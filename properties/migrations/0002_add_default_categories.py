from django.db import migrations
from django.utils.text import slugify

def add_default_categories(apps, schema_editor):
    PropertyCategory = apps.get_model('properties', 'PropertyCategory')
    
    default_categories = [
        {
            'name': 'Residential',
            'description': 'Single-family homes, apartments, and other residential properties',
            'icon': 'fas fa-home'
        },
        {
            'name': 'Commercial',
            'description': 'Office buildings, retail spaces, and other commercial properties',
            'icon': 'fas fa-building'
        },
        {
            'name': 'Industrial',
            'description': 'Warehouses, factories, and other industrial properties',
            'icon': 'fas fa-industry'
        },
        {
            'name': 'Land',
            'description': 'Vacant land, agricultural land, and other undeveloped properties',
            'icon': 'fas fa-mountain'
        },
        {
            'name': 'Luxury',
            'description': 'High-end properties with premium features and amenities',
            'icon': 'fas fa-crown'
        }
    ]
    
    for category_data in default_categories:
        slug = slugify(category_data['name'])
        category, created = PropertyCategory.objects.get_or_create(
            slug=slug,
            defaults={
                'name': category_data['name'],
                'description': category_data['description'],
                'icon': category_data['icon']
            }
        )
        if not created:
            # Update existing category
            category.name = category_data['name']
            category.description = category_data['description']
            category.icon = category_data['icon']
            category.save()

def remove_default_categories(apps, schema_editor):
    PropertyCategory = apps.get_model('properties', 'PropertyCategory')
    PropertyCategory.objects.filter(slug__in=[
        'residential', 'commercial', 'industrial', 'land', 'luxury'
    ]).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('properties', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_default_categories, remove_default_categories),
    ] 