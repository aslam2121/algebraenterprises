from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from agents.models import AgentProfile
from properties.models import Property

class PropertyView(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='property_views', null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']

    def __str__(self):
        return f"View of {self.property.title} at {self.viewed_at}"

class SearchHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='search_history')
    query = models.CharField(max_length=255)
    filters = models.JSONField(default=dict)
    results_count = models.PositiveIntegerField()
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Search Histories'
        ordering = ['-searched_at']

    def __str__(self):
        return f"Search by {self.user.email}: {self.query}"

class AgentPerformance(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='performance')
    total_listings = models.PositiveIntegerField(default=0)
    active_listings = models.PositiveIntegerField(default=0)
    total_views = models.PositiveIntegerField(default=0)
    total_inquiries = models.PositiveIntegerField(default=0)
    total_sales = models.PositiveIntegerField(default=0)
    total_rentals = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end']

    def __str__(self):
        return f"Performance of {self.agent.user.get_full_name()} for {self.period_start} to {self.period_end}"

class SiteAnalytics(models.Model):
    total_users = models.PositiveIntegerField(default=0)
    total_properties = models.PositiveIntegerField(default=0)
    total_agents = models.PositiveIntegerField(default=0)
    total_views = models.PositiveIntegerField(default=0)
    total_inquiries = models.PositiveIntegerField(default=0)
    total_favorites = models.PositiveIntegerField(default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Site Analytics'
        ordering = ['-period_end']

    def __str__(self):
        return f"Site Analytics for {self.period_start} to {self.period_end}"

class UserActivity(models.Model):
    class ActivityType(models.TextChoices):
        LOGIN = 'LOGIN', _('Login')
        LOGOUT = 'LOGOUT', _('Logout')
        VIEW_PROPERTY = 'VIEW_PROPERTY', _('View Property')
        SAVE_FAVORITE = 'SAVE_FAVORITE', _('Save Favorite')
        CONTACT_AGENT = 'CONTACT_AGENT', _('Contact Agent')
        SEARCH = 'SEARCH', _('Search')
        REGISTER = 'REGISTER', _('Register')
        UPDATE_PROFILE = 'UPDATE_PROFILE', _('Update Profile')

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    description = models.TextField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'User Activities'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.get_activity_type_display()} at {self.created_at}"
