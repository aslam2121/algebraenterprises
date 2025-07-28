#!/usr/bin/env python3
"""
PostgreSQL Setup Helper Script for Algebra Enterprises

This script helps you set up PostgreSQL for production deployment.
"""

import os
import sys

def print_header():
    print("=" * 60)
    print("PostgreSQL Setup for Algebra Enterprises")
    print("=" * 60)

def print_instructions():
    print("\n📋 PostgreSQL Setup Instructions:")
    print("\n1. Install PostgreSQL on your system:")
    print("   - Windows: Download from https://www.postgresql.org/download/windows/")
    print("   - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib")
    print("   - CentOS/RHEL: sudo yum install postgresql postgresql-server")
    print("   - macOS: brew install postgresql")
    
    print("\n2. Start PostgreSQL service:")
    print("   - Windows: PostgreSQL service should start automatically")
    print("   - Linux: sudo systemctl start postgresql")
    print("   - macOS: brew services start postgresql")
    
    print("\n3. Create a database and user:")
    print("   sudo -u postgres psql")
    print("   CREATE DATABASE algebra_enterprises;")
    print("   CREATE USER algebra_user WITH PASSWORD 'your_secure_password';")
    print("   GRANT ALL PRIVILEGES ON DATABASE algebra_enterprises TO algebra_user;")
    print("   \\q")
    
    print("\n4. Set up environment variables in your .env file:")
    print("   DB_NAME=algebra_enterprises")
    print("   DB_USER=algebra_user")
    print("   DB_PASSWORD=your_secure_password")
    print("   DB_HOST=localhost")
    print("   DB_PORT=5432")
    
    print("\n5. Run Django migrations:")
    print("   python manage.py migrate")
    
    print("\n6. Create a superuser:")
    print("   python manage.py createsuperuser")

def check_postgres_connection():
    print("\n🔍 Checking PostgreSQL connection...")
    try:
        import psycopg2
        print("✅ psycopg2-binary is installed")
        
        # Try to connect using environment variables
        db_name = os.getenv('DB_NAME')
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        
        if all([db_name, db_user, db_password]):
            try:
                conn = psycopg2.connect(
                    dbname=db_name,
                    user=db_user,
                    password=db_password,
                    host=db_host,
                    port=db_port
                )
                conn.close()
                print("✅ Successfully connected to PostgreSQL database")
                return True
            except psycopg2.OperationalError as e:
                print(f"❌ Failed to connect to PostgreSQL: {e}")
                print("   Make sure PostgreSQL is running and credentials are correct")
                return False
        else:
            print("⚠️  Environment variables not set. Please set DB_NAME, DB_USER, and DB_PASSWORD")
            return False
            
    except ImportError:
        print("❌ psycopg2-binary is not installed")
        print("   Run: pip install psycopg2-binary==2.9.9")
        return False

def main():
    print_header()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        check_postgres_connection()
    else:
        print_instructions()
        print("\n" + "=" * 60)
        print("For more information, visit: https://www.postgresql.org/docs/")
        print("=" * 60)

if __name__ == "__main__":
    main() 