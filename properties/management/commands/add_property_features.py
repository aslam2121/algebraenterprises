from django.core.management.base import BaseCommand
from properties.models import PropertyFeature

class Command(BaseCommand):
    help = 'Add new property features to the database'

    def handle(self, *args, **options):
        features_data = [
            {'name': 'Air Conditioning', 'icon': 'fas fa-snowflake'},
            {'name': 'Basement', 'icon': 'fas fa-warehouse'},
            {'name': 'Brand New', 'icon': 'fas fa-star'},
            {'name': 'Corner Plot', 'icon': 'fas fa-square'},
            {'name': 'Dining Room', 'icon': 'fas fa-utensils'},
            {'name': 'Driveway Parking', 'icon': 'fas fa-car'},
            {'name': 'Equipped Kitchen', 'icon': 'fas fa-kitchen-set'},
            {'name': 'Four Side Open', 'icon': 'fas fa-expand-arrows-alt'},
            {'name': 'Fruit & Vegetable Garden', 'icon': 'fas fa-seedling'},
            {'name': 'Fully Furnished', 'icon': 'fas fa-couch'},
            {'name': 'Furnished', 'icon': 'fas fa-chair'},
            {'name': 'Gas Pipeline', 'icon': 'fas fa-fire'},
            {'name': 'Generator', 'icon': 'fas fa-bolt'},
            {'name': 'Inverter', 'icon': 'fas fa-plug'},
            {'name': 'Laundry Room', 'icon': 'fas fa-tshirt'},
            {'name': 'Lawn', 'icon': 'fas fa-leaf'},
            {'name': 'Lift', 'icon': 'fas fa-arrow-up'},
            {'name': 'Living Room', 'icon': 'fas fa-home'},
            {'name': 'Marble Floors', 'icon': 'fas fa-gem'},
            {'name': 'Newly renovated', 'icon': 'fas fa-hammer'},
            {'name': 'Outside Parking', 'icon': 'fas fa-parking'},
            {'name': 'Park Facing', 'icon': 'fas fa-tree'},
            {'name': 'Powder Room', 'icon': 'fas fa-restroom'},
            {'name': 'Power Backup', 'icon': 'fas fa-battery-full'},
            {'name': 'Quiet Location', 'icon': 'fas fa-volume-mute'},
            {'name': 'Roof Garden', 'icon': 'fas fa-seedling'},
            {'name': 'Security', 'icon': 'fas fa-shield-alt'},
            {'name': 'Semi Furnished', 'icon': 'fas fa-couch'},
            {'name': 'Staff Quarter', 'icon': 'fas fa-users'},
            {'name': 'Stilt Parking', 'icon': 'fas fa-car-side'},
            {'name': 'Swimming Pool', 'icon': 'fas fa-swimming-pool'},
            {'name': 'Terrace', 'icon': 'fas fa-building'},
            {'name': 'Three Side Open', 'icon': 'fas fa-expand'},
            {'name': 'Two Side Open', 'icon': 'fas fa-arrows-alt-h'},
            {'name': 'UPVC Window', 'icon': 'fas fa-window-maximize'},
        ]

        created_count = 0
        skipped_count = 0

        for feature_data in features_data:
            feature, created = PropertyFeature.objects.get_or_create(
                name=feature_data['name'],
                defaults={
                    'icon': feature_data['icon'],
                    'description': f'{feature_data["name"]} feature available in this property.'
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created feature: {feature.name}')
                )
            else:
                skipped_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⚠ Skipped (already exists): {feature.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} features created, {skipped_count} features skipped.'
            )
        ) 