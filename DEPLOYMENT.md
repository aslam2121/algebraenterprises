# cPanel Deployment Guide

## Prerequisites
1. cPanel hosting with Python support (Python 3.10.13 recommended)
2. MySQL database
3. Domain name configured in cPanel

## Setup Steps

### 1. Database Setup
1. Create a MySQL database in cPanel
2. Note down the database credentials:
   - Database name - ae.satmz.com
   - Username - aslam2121
   - Password - Aslam.210001
   - Host (usually localhost)
   - Port (usually 3306)

### 2. Environment Variables
Create a `.env` file in your project root with the following variables:
```
DJANGO_SECRET_KEY=generate-a-secure-key
DJANGO_ALLOWED_HOSTS=ae.satmz.com,www.ae.satmz.com
DB_NAME=ae.satmz.com
DB_USER=aslam2121
DB_PASSWORD=Aslam.210001
DB_HOST=localhost
DB_PORT=3306
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-email-password
DEFAULT_FROM_EMAIL=your-email
```

### 3. File Structure
Your project should be in the `public_html` directory with the following structure:
```
public_html/
├── ae.satmz.com/
│   ├── core/
│   ├── accounts/
│   ├── properties/
│   ├── agents/
│   ├── dashboard/
│   ├── static/
│   ├── media/
│   ├── templates/
│   ├── manage.py
│   ├── passenger_wsgi.py
│   ├── requirements.txt
│   └── .env
├── .htaccess
└── logs/
```

### 4. Python Setup
1. In cPanel, go to "Setup Python App"
2. Create a new application:
   - Python version: 3.10.13 (recommended)
   - Application root: /home/satmz/public_html/ae.satmz.com
   - Application URL: ae.satmz.com
   - Application startup file: passenger_wsgi.py

### 5. Install Dependencies
1. In cPanel, go to "Terminal" or use the Python App interface
2. Create and activate virtual environment:
```bash
python3.10 -m venv venv
source venv/bin/activate
```
3. Install requirements:
```bash
pip install -r requirements.txt
```

### 6. Database Migrations
1. Run migrations:
```bash
python manage.py migrate
```
2. Create superuser:
```bash
python manage.py createsuperuser
```

### 7. Static Files
1. Collect static files:
```bash
python manage.py collectstatic
```

### 8. File Permissions
Set appropriate permissions:
```bash
chmod 755 ~/public_html/ae.satmz.com
chmod 644 ~/public_html/.htaccess
chmod -R 755 ~/public_html/ae.satmz.com/static
chmod -R 755 ~/public_html/ae.satmz.com/media
chmod 600 ~/public_html/ae.satmz.com/.env
```

## Updating the Application
1. Upload new code through cPanel File Manager or FTP
2. Run migrations if needed:
```bash
python manage.py migrate
```
3. Collect static files if needed:
```bash
python manage.py collectstatic
```
4. Restart the Python application in cPanel

## Troubleshooting
1. Check error logs in cPanel
2. Verify file permissions
3. Ensure all environment variables are set correctly
4. Check database connection
5. Verify static and media file paths

## Security Notes
1. Keep your `.env` file secure and outside public access
2. Regularly update dependencies
3. Use strong passwords
4. Enable SSL/HTTPS
5. Keep Django and all packages updated

## MySQL-Specific Notes
1. Make sure your MySQL version is 5.7 or higher
2. The database should use utf8mb4 character set
3. If you encounter any character encoding issues, check the MySQL connection settings
4. For large text fields, consider using TEXT or LONGTEXT instead of VARCHAR
5. Regularly backup your MySQL database through cPanel

## Migrating from PostgreSQL to MySQL

### 1. Export Data from PostgreSQL
1. Install required packages:
```bash
pip install django-mysql
```

2. Create a data dump using Django's dumpdata command:
```bash
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > data_dump.json
```

### 2. Prepare MySQL Database
1. Create the MySQL database and user in cPanel
2. Update your settings.py to use MySQL temporarily:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'satmz_ae_db',
        'USER': 'satmz_ae_user',
        'PASSWORD': 'your-password',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        }
    }
}
```

### 3. Migrate Database Structure
1. Run migrations to create tables:
```bash
python manage.py migrate
```

### 4. Import Data
1. Load the data into MySQL:
```bash
python manage.py loaddata data_dump.json
```

### 5. Verify Migration
1. Check data integrity:
```bash
python manage.py check
```

2. Verify in Django admin:
   - Log in to admin panel
   - Check each model's data
   - Verify relationships between models
   - Test CRUD operations

### 6. Handle Common Issues
1. Character encoding issues:
   - Ensure MySQL uses utf8mb4
   - Check for any special characters in the data

2. Foreign key constraints:
   - If loaddata fails, try loading data in correct order
   - Use --natural-foreign flag if needed:
   ```bash
   python manage.py loaddata --natural-foreign data_dump.json
   ```

3. Date/Time fields:
   - Ensure timezone settings match
   - Check for any timezone-related issues

4. Large text fields:
   - Convert any problematic VARCHAR fields to TEXT
   - Check for any truncated data

### 7. Post-Migration Tasks
1. Update any PostgreSQL-specific queries
2. Test all database operations
3. Verify all relationships
4. Check for any data type mismatches
5. Test all forms and data entry points

### 8. Backup
1. Create a backup of the MySQL database
2. Keep the PostgreSQL dump for reference
3. Document any manual fixes applied

# In cPanel File Manager:
1. Navigate to public_html
2. Create directory: ae.satmz.com
3. Create subdirectories:
   - logs
   - django_cache 

# In cPanel:
1. Go to "MySQL Databases"
2. Create new database: satmz_ae_db
3. Create new user: satmz_ae_user
4. Add user to database with all privileges
5. Note down the credentials 

# Using cPanel File Manager or FTP:
1. Upload all project files to /home/satmz/public_html/ae.satmz.com
2. Ensure .env file is uploaded
3. Upload .htaccess to public_html directory 

# In cPanel Terminal:
cd ~/public_html/ae.satmz.com
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt 

# In the same terminal:
python manage.py migrate
python manage.py createsuperuser 

# In cPanel:
1. Go to "SSL/TLS"
2. Install SSL certificate for ae.satmz.com
3. Force HTTPS (already configured in .htaccess) 

# Verify:
1. Website is accessible at https://ae.satmz.com
2. Static files are loading
3. Media uploads work
4. Admin panel is accessible
5. Database connections work
6. Emails are sending 

# In cPanel:
1. Set up error logging
2. Monitor disk usage
3. Set up backup schedule 