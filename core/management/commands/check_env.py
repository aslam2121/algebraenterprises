from django.core.management.base import BaseCommand
import sys
import os
import pkg_resources
import django
from pathlib import Path
import subprocess

class Command(BaseCommand):
    help = 'Checks environment and installs required dependencies'

    def add_arguments(self, parser):
        parser.add_argument(
            '--install',
            action='store_true',
            help='Install missing dependencies',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Environment Check ==='))
        
        # Check Python version
        self.stdout.write(f"\nPython Version: {sys.version}")
        
        # Check Django version
        self.stdout.write(f"Django Version: {django.get_version()}")
        
        # Check installed packages
        self.stdout.write("\nInstalled Packages:")
        installed_packages = {pkg.key: pkg.version for pkg in pkg_resources.working_set}
        
        # Required packages with versions
        required_packages = {
            "Django": "4.2.10",
            "Pillow": "10.2.0",
            "mysqlclient": "2.2.4",
            "django-cleanup": "8.0.0",
            "django-imagekit": "4.1.0",
            "django-meta": "2.5.0",
            "django-sitemaps": "1.0.0",
            "django-debug-toolbar": "4.2.0",
            "whitenoise": "6.6.0",
            "django-compressor": "4.4",
            "django-allauth": "0.58.2",
            "python-dotenv": "1.0.1",
            "django-widget-tweaks": "1.5.0",
            "django-crispy-forms": "2.1",
            "crispy-bootstrap5": "2024.2",
            "django-storages": "1.14.2",
            "django-cors-headers": "4.3.1",
            "django-filter": "23.5",
            "djangorestframework": "3.14.0",
            "djangorestframework-simplejwt": "5.3.1",
            "django-celery-beat": "2.5.0",
            "celery": "5.3.6",
            "redis": "5.0.1",
            "gunicorn": "21.2.0",
            "django-environ": "0.11.2",
            "django-taggit": "5.0.1",
            "django-ckeditor": "6.7.0",
            "django-redis": "5.4.0",
            "django-extensions": "3.2.3",
            "django-celery-results": "2.5.1",
            "sentry-sdk": "1.39.1"
        }

        # Check and display package status
        missing_packages = []
        outdated_packages = []
        
        for package, required_version in required_packages.items():
            if package.lower() in installed_packages:
                current_version = installed_packages[package.lower()]
                if current_version != required_version:
                    outdated_packages.append((package, current_version, required_version))
            else:
                missing_packages.append(package)

        # Display package status
        for package, version in installed_packages.items():
            self.stdout.write(f"{package}=={version}")

        if missing_packages:
            self.stdout.write(self.style.WARNING("\nMissing Packages:"))
            for package in missing_packages:
                self.stdout.write(f"- {package}")

        if outdated_packages:
            self.stdout.write(self.style.WARNING("\nOutdated Packages:"))
            for package, current, required in outdated_packages:
                self.stdout.write(f"- {package}: {current} (required: {required})")

        # Install packages if requested
        if options['install']:
            self.stdout.write("\nInstalling missing packages...")
            for package in missing_packages:
                self.stdout.write(f"Installing {package}...")
                try:
                    subprocess.check_call([sys.executable, "-m", "pip", "install", f"{package}=={required_packages[package]}"])
                    self.stdout.write(self.style.SUCCESS(f"✓ {package} installed successfully"))
                except subprocess.CalledProcessError:
                    self.stdout.write(self.style.ERROR(f"✗ Failed to install {package}"))
                    # Try without version constraint
                    try:
                        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
                        self.stdout.write(self.style.SUCCESS(f"✓ {package} installed successfully"))
                    except subprocess.CalledProcessError:
                        self.stdout.write(self.style.ERROR(f"✗ Failed to install {package}"))

            # Update outdated packages
            for package, current, required in outdated_packages:
                self.stdout.write(f"Updating {package} from {current} to {required}...")
                try:
                    subprocess.check_call([sys.executable, "-m", "pip", "install", f"{package}=={required}"])
                    self.stdout.write(self.style.SUCCESS(f"✓ {package} updated successfully"))
                except subprocess.CalledProcessError:
                    self.stdout.write(self.style.ERROR(f"✗ Failed to update {package}"))

        # Check database configuration
        self.stdout.write("\nDatabase Configuration:")
        try:
            from django.conf import settings
            self.stdout.write(f"Database Engine: {settings.DATABASES['default']['ENGINE']}")
            self.stdout.write(f"Database Name: {settings.DATABASES['default']['NAME']}")
        except:
            self.stdout.write(self.style.ERROR("Could not load Django settings"))

        # Check static and media directories
        self.stdout.write("\nStatic and Media Directories:")
        try:
            self.stdout.write(f"Static Root: {settings.STATIC_ROOT}")
            self.stdout.write(f"Media Root: {settings.MEDIA_ROOT}")
        except:
            self.stdout.write(self.style.ERROR("Could not load static/media settings")) 