# Generated by Django 4.2.10 on 2025-07-26 06:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0009_property_neighbourhood_alter_property_area"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="property",
            name="zip_code",
        ),
        migrations.AlterField(
            model_name="property",
            name="neighbourhood",
            field=models.CharField(
                choices=[
                    ("DOWNTOWN", "Downtown"),
                    ("UPTOWN", "Uptown"),
                    ("SUBURBAN", "Suburban"),
                    ("RURAL", "Rural"),
                    ("WATERFRONT", "Waterfront"),
                    ("MOUNTAIN_VIEW", "Mountain View"),
                    ("CITY_CENTER", "City Center"),
                    ("RESIDENTIAL", "Residential"),
                    ("COMMERCIAL", "Commercial"),
                    ("INDUSTRIAL", "Industrial"),
                    ("HISTORIC", "Historic District"),
                    ("UNIVERSITY", "University Area"),
                    ("SHOPPING", "Shopping District"),
                    ("PARK", "Park Area"),
                    ("OTHER", "Other"),
                ],
                default="OTHER",
                max_length=20,
            ),
        ),
    ]
