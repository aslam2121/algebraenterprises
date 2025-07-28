from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill

# Create your models here.

class AgentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='agent_profile')
    company_name = models.CharField(max_length=200)
    office_address = models.CharField(max_length=255)
    bio = models.TextField()
    specialization = models.CharField(max_length=200)
    
    # Social Media Links
    facebook = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    
    # Metadata
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.company_name}"

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email

    @property
    def phone_number(self):
        return self.user.phone_number

class AgentReview(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='reviews')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    rating = models.PositiveIntegerField()
    comment = models.TextField()
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for {self.agent.full_name} by {self.name}"

class AgentAchievement(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=200)
    description = models.TextField()
    year = models.PositiveIntegerField()
    icon = models.CharField(max_length=50, blank=True)  # For FontAwesome icons
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year']

    def __str__(self):
        return f"{self.title} - {self.agent.full_name}"

class AgentSpecialization(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='specializations')
    category = models.ForeignKey('properties.PropertyCategory', on_delete=models.CASCADE)
    years_of_experience = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['agent', 'category']

    def __str__(self):
        return f"{self.agent.full_name} - {self.category.name}"

class AgentAvailability(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.PositiveIntegerField(choices=[(i, _(f'Day {i}')) for i in range(7)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Agent Availabilities'
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.agent.full_name} - {self.get_day_of_week_display()}"

class AgentContact(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='contacts')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='agent_contacts')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Contact from {self.user.email} to {self.agent.full_name}"

class AgentListing(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='listings')
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='agent_listings')
    is_featured = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['agent', 'property']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.agent.full_name} - {self.property.title}"
