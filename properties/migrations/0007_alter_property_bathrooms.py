# Generated by Django 5.2.1 on 2025-05-28 15:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0006_propertyfeature_remove_propertycategory_created_at_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='property',
            name='bathrooms',
            field=models.DecimalField(decimal_places=0, max_digits=3),
        ),
    ]
