from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from agents.models import AgentProfile
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates an agent account with the specified details'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address for the agent')
        parser.add_argument('password', type=str, help='Password for the agent')
        parser.add_argument('--first-name', type=str, help='First name of the agent')
        parser.add_argument('--last-name', type=str, help='Last name of the agent')
        parser.add_argument('--phone', type=str, help='Phone number of the agent')
        parser.add_argument('--company', type=str, help='Company name')
        parser.add_argument('--address', type=str, help='Office address')
        parser.add_argument('--bio', type=str, help='Agent bio')
        parser.add_argument('--specialization', type=str, help='Agent specialization')

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Create user
                user = User.objects.create_user(
                    email=options['email'],
                    password=options['password'],
                    first_name=options.get('first_name', ''),
                    last_name=options.get('last_name', ''),
                    phone_number=options.get('phone', ''),
                    is_active=True
                )

                # Create agent profile
                agent_profile = AgentProfile.objects.create(
                    user=user,
                    company_name=options.get('company', ''),
                    office_address=options.get('address', ''),
                    bio=options.get('bio', ''),
                    specialization=options.get('specialization', ''),
                    is_approved=True
                )

                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created agent account for {user.email}')
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Agent Profile ID: {agent_profile.id}')
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating agent account: {str(e)}')
            ) 