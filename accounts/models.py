from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill

class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/%Y/%m/%d/', blank=True)
    
    # User roles
    is_agent = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    
    # Profile picture thumbnails
    profile_thumbnail = ImageSpecField(
        source='profile_picture',
        processors=[ResizeToFill(150, 150)],
        format='JPEG',
        options={'quality': 80}
    )
    
    # Favorite properties
    favorite_properties = models.ManyToManyField('properties.Property', blank=True, related_name='favorited_by')
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    
    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Last activity
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def get_short_name(self):
        return self.first_name or self.email.split('@')[0]

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    preferred_property_types = models.CharField(max_length=200, blank=True)
    budget_range = models.CharField(max_length=100, blank=True)
    preferred_locations = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()}'s Profile"
