# Algebra Enterprises - Real Estate Platform

A comprehensive real estate platform built with Django and Bootstrap, featuring property listings, agent management, and customer interactions.

## Features

- Property listings for rent and sale
- Multi-media support (images and videos)
- Role-based access (Customers, Agents, Admins)
- Advanced search and filtering
- Favorite properties and agents
- Contact options (form, email, call, WhatsApp)
- SEO optimization
- Mobile responsive design
- Admin dashboard
- Automated backups

## Tech Stack

- Backend: Django 4.2.10
- Frontend: Bootstrap 5
- Database: SQLite (Development) / PostgreSQL (Production)
- Media Storage: Local/Cloud Storage (AWS S3 in production)
- Task Queue: Celery with Redis
- Web Server: Gunicorn

## Prerequisites

- Python 3.10+
- PostgreSQL (for production)
- Redis (for production)
- Virtual Environment

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Alegebra_Enterprises
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables (create .env file):
```bash
# Create .env file with the following variables:
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# For production, add:
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_HOST_USER=your_email
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=your_email
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_STORAGE_BUCKET_NAME=your_bucket_name
REDIS_URL=redis://127.0.0.1:6379/0
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

## Project Structure

```
Alegebra_Enterprises/
├── manage.py
├── requirements.txt
├── db.sqlite3 (development database)
├── core/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/
├── properties/
├── agents/
├── dashboard/
├── pages/
├── static/
├── media/
└── templates/
```

## Database Configuration

- **Development**: SQLite3 (db.sqlite3)
- **Production**: PostgreSQL with psycopg2-binary driver
- **Cache**: Redis (production) / Local memory (development)

## Development

- Use `python manage.py runserver` for development
- Access admin panel at `/admin`
- Debug toolbar available in development
- Development uses SQLite database by default

## Production Deployment

1. Set up production settings (core/settings/production.py)
2. Configure PostgreSQL database
3. Set up Redis for caching and Celery
4. Configure static files with `python manage.py collectstatic`
5. Configure web server (Nginx/Apache)
6. Set up SSL certificates
7. Configure AWS S3 for media storage
8. Set up backup system

## Environment Variables

The project uses environment variables for configuration. Key variables include:

- `DJANGO_SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DB_*`: Database configuration
- `EMAIL_*`: Email configuration
- `AWS_*`: AWS S3 configuration
- `REDIS_URL`: Redis connection URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 