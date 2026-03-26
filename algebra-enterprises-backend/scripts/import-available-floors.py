#!/usr/bin/env python3

import argparse
import json
import os
import sqlite3
import subprocess
import sys
import time
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
import re


DEFAULT_XLSX_PATH = Path(__file__).resolve().parents[2] / 'properties_available_floors.xlsx'
DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / '.tmp' / 'data.db'
DEFAULT_DB_CLIENT = os.environ.get('DATABASE_CLIENT', 'sqlite').strip().lower() or 'sqlite'
XML_NS = {
    'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


def parse_args():
    parser = argparse.ArgumentParser(description='Import Available_Floors into Strapi properties.')
    parser.add_argument('--apply', action='store_true', help='Write changes to the configured DB.')
    parser.add_argument('--xlsx', default=str(DEFAULT_XLSX_PATH), help='Path to the source workbook.')
    parser.add_argument('--db', default=str(DEFAULT_DB_PATH), help='Path to the Strapi SQLite database.')
    parser.add_argument(
        '--db-client',
        default=DEFAULT_DB_CLIENT,
        choices=['sqlite', 'postgres'],
        help='Database client to target. Defaults to DATABASE_CLIENT or sqlite.',
    )
    parser.add_argument('--limit', type=int, help='Limit processed records for testing.')
    args = parser.parse_args()

    if args.limit is not None and args.limit < 1:
      raise SystemExit('--limit must be a positive integer.')

    return args


def normalize_cell(value):
    return value.strip() if isinstance(value, str) else ''


def normalize_available_floors(value):
    return re.sub(r'\s+', ' ', normalize_cell(value))


def column_index(cell_ref):
    match = re.match(r'([A-Z]+)', cell_ref or '')
    if not match:
        return 0

    index = 0
    for char in match.group(1):
        index = index * 26 + ord(char) - 64
    return index - 1


def get_cell_value(cell, shared_strings):
    cell_type = cell.attrib.get('t')
    value_node = cell.find('a:v', XML_NS)

    if cell_type == 's' and value_node is not None:
        return shared_strings[int(value_node.text)]

    if cell_type == 'inlineStr':
        return ''.join(node.text or '' for node in cell.findall('.//a:t', XML_NS))

    if value_node is not None:
        return value_node.text or ''

    return ''


def read_workbook_rows(xlsx_path):
    if not xlsx_path.exists():
        raise FileNotFoundError(f'Workbook not found: {xlsx_path}')

    with zipfile.ZipFile(xlsx_path) as archive:
        shared_strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared_root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            for item in shared_root.findall('a:si', XML_NS):
                shared_strings.append(''.join(node.text or '' for node in item.findall('.//a:t', XML_NS)))

        workbook_root = ET.fromstring(archive.read('xl/workbook.xml'))
        workbook_rels_root = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        rel_map = {
            rel.attrib['Id']: rel.attrib['Target']
            for rel in workbook_rels_root
        }

        first_sheet = workbook_root.find('a:sheets/a:sheet', XML_NS)
        if first_sheet is None:
            return []

        relation_id = first_sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        worksheet_path = 'xl/' + rel_map[relation_id]
        worksheet_root = ET.fromstring(archive.read(worksheet_path))
        row_nodes = worksheet_root.findall('.//a:sheetData/a:row', XML_NS)
        if not row_nodes:
            return []

        parsed_rows = []
        for row in row_nodes:
            values_by_index = {}
            max_index = -1

            for cell in row.findall('a:c', XML_NS):
                index = column_index(cell.attrib.get('r', 'A1'))
                values_by_index[index] = get_cell_value(cell, shared_strings)
                max_index = max(max_index, index)

            values = [''] * (max_index + 1 if max_index >= 0 else 0)
            for index, value in values_by_index.items():
                values[index] = value
            parsed_rows.append(values)

    header = [normalize_cell(value) for value in parsed_rows[0]]
    if 'Property_Code' not in header or 'Available_Floors' not in header:
        raise ValueError('Workbook must contain Property_Code and Available_Floors columns.')

    rows = []
    for row_number, values in enumerate(parsed_rows[1:], start=2):
        record = {'_rowNumber': row_number}
        for index, key in enumerate(header):
            if not key:
                continue
            record[key] = values[index] if index < len(values) else ''
        rows.append(record)

    return rows


def merge_rows_by_property_code(rows):
    merged_by_code = {}
    duplicate_rows = []

    for row in rows:
        row_number = int(row.get('_rowNumber', 0)) or None
        property_code = normalize_cell(row.get('Property_Code', '')).lower()
        available_floors = normalize_available_floors(row.get('Available_Floors', ''))

        if not property_code:
            raise ValueError(f'Workbook row {row_number} is missing Property_Code.')

        existing = merged_by_code.get(property_code)
        if existing is None:
            merged_by_code[property_code] = {
                'rowNumber': row_number,
                'propertyCode': property_code,
                'availableFloors': available_floors,
            }
            continue

        duplicate_rows.append({
            'propertyCode': property_code,
            'rows': [existing['rowNumber'], row_number],
            'values': [existing['availableFloors'], available_floors],
        })

        if available_floors:
            existing['availableFloors'] = available_floors
            existing['rowNumber'] = row_number

    return list(merged_by_code.values()), duplicate_rows


def load_published_properties(conn):
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        '''
        SELECT document_id, property_code, available_floors
        FROM properties
        WHERE published_at IS NOT NULL
        '''
    )

    return {
        normalize_cell(row['property_code']).lower(): {
            'documentId': row['document_id'],
            'availableFloors': normalize_available_floors(row['available_floors']),
        }
        for row in cursor.fetchall()
    }


def update_document_available_floors(conn, document_id, available_floors):
    cursor = conn.cursor()
    cursor.execute(
        '''
        UPDATE properties
        SET available_floors = ?, updated_at = ?
        WHERE document_id = ?
        ''',
        (
            available_floors or None,
            int(time.time() * 1000),
            document_id,
        ),
    )


def build_psql_env():
    database_url = normalize_cell(os.environ.get('DATABASE_URL', ''))
    if not database_url:
        raise RuntimeError('DATABASE_URL is required when --db-client=postgres.')

    env = os.environ.copy()
    env['DATABASE_URL'] = database_url

    if env.get('DATABASE_SSL', '').lower() in {'1', 'true', 'yes', 'on'} and not env.get('PGSSLMODE'):
        env['PGSSLMODE'] = 'require'

    return env


def run_psql(sql):
    env = build_psql_env()
    result = subprocess.run(
        [
            'psql',
            env['DATABASE_URL'],
            '-X',
            '-v',
            'ON_ERROR_STOP=1',
            '-A',
            '-F',
            '\t',
            '-P',
            'footer=off',
            '-c',
            sql,
        ],
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )
    return result.stdout


def load_published_properties_postgres():
    output = run_psql(
        '''
        SELECT document_id, property_code, COALESCE(available_floors, '')
        FROM public.properties
        WHERE published_at IS NOT NULL
        ORDER BY property_code ASC;
        '''
    )

    published = {}
    for line in output.splitlines():
        if not line.strip():
            continue

        document_id, property_code, available_floors = (line.split('\t') + ['', '', ''])[:3]
        published[normalize_cell(property_code).lower()] = {
            'documentId': normalize_cell(document_id),
            'availableFloors': normalize_available_floors(available_floors),
        }

    return published


def sql_literal(value):
    if value is None:
        return 'NULL'

    return "'" + str(value).replace("'", "''") + "'"


def update_document_available_floors_postgres(updates):
    if not updates:
        return

    statements = ['BEGIN;']

    for update in updates:
        statements.append(
            '''
            UPDATE public.properties
            SET available_floors = {available_floors},
                updated_at = NOW()
            WHERE document_id = {document_id};
            '''.format(
                available_floors=sql_literal(update['availableFloors'] or None),
                document_id=sql_literal(update['documentId']),
            ).strip()
        )

    statements.append('COMMIT;')
    run_psql('\n'.join(statements))


def import_rows(args):
    workbook_rows = read_workbook_rows(Path(args.xlsx))
    records, duplicate_rows = merge_rows_by_property_code(workbook_rows)
    limited_records = records[:args.limit] if args.limit else records

    summary = {
        'xlsxPath': str(Path(args.xlsx).resolve()),
        'dbClient': args.db_client,
        'dbPath': str(Path(args.db).resolve()) if args.db_client == 'sqlite' else None,
        'totalWorkbookRows': len(workbook_rows),
        'uniquePropertyCodes': len(records),
        'processedRecords': len(limited_records),
        'duplicateRows': duplicate_rows,
        'missingProperties': [],
        'matchedPublishedProperties': 0,
        'wouldUpdate': 0,
        'updated': 0,
        'unchanged': 0,
        'blankAvailableFloors': 0,
        'clearedAvailableFloors': 0,
        'sample': [],
    }

    pending_postgres_updates = []
    conn = None

    try:
        if args.db_client == 'sqlite':
            conn = sqlite3.connect(args.db, timeout=30)
            published_by_code = load_published_properties(conn)
        else:
            published_by_code = load_published_properties_postgres()

        for index, record in enumerate(limited_records, start=1):
            current_property = published_by_code.get(record['propertyCode'])
            if current_property is None:
                summary['missingProperties'].append({
                    'row': record['rowNumber'],
                    'propertyCode': record['propertyCode'],
                })
                continue

            summary['matchedPublishedProperties'] += 1

            current_available_floors = current_property['availableFloors']
            next_available_floors = record['availableFloors']
            changed = current_available_floors != next_available_floors

            if not next_available_floors:
                summary['blankAvailableFloors'] += 1

            if changed and current_available_floors and not next_available_floors:
                summary['clearedAvailableFloors'] += 1

            if len(summary['sample']) < 12:
                summary['sample'].append({
                    'propertyCode': record['propertyCode'],
                    'action': 'update' if changed else 'unchanged',
                    'previousAvailableFloors': current_available_floors or None,
                    'nextAvailableFloors': next_available_floors or None,
                })

            if not changed:
                summary['unchanged'] += 1
                continue

            summary['wouldUpdate'] += 1

            if not args.apply:
                continue

            if args.db_client == 'sqlite':
                update_document_available_floors(
                    conn,
                    current_property['documentId'],
                    next_available_floors,
                )
            else:
                pending_postgres_updates.append({
                    'documentId': current_property['documentId'],
                    'availableFloors': next_available_floors,
                })

            summary['updated'] += 1

            if index % 50 == 0:
                print(json.dumps({
                    'progress': index,
                    'processedRecords': len(limited_records),
                    'apply': True,
                }))

        if args.apply and args.db_client == 'sqlite':
            conn.commit()
        elif args.apply and args.db_client == 'postgres':
            update_document_available_floors_postgres(pending_postgres_updates)

        return summary
    finally:
        if conn is not None:
            conn.close()


def main():
    args = parse_args()
    summary = import_rows(args)
    print(json.dumps({
        'mode': 'apply' if args.apply else 'dry-run',
        **summary,
    }, indent=2))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        sys.exit(1)
