from django.contrib import admin
from django.utils.html import format_html
from .models import (
    AgentProfile, AgentReview, AgentAchievement,
    AgentSpecialization, AgentAvailability, AgentContact,
    AgentListing
)

class AgentReviewInline(admin.TabularInline):
    model = AgentReview
    extra = 0
    readonly_fields = ['created_at']

class AgentAchievementInline(admin.TabularInline):
    model = AgentAchievement
    extra = 1

class AgentSpecializationInline(admin.TabularInline):
    model = AgentSpecialization
    extra = 1

class AgentAvailabilityInline(admin.TabularInline):
    model = AgentAvailability
    extra = 1

@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'specialization', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'company_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [AgentReviewInline, AgentAchievementInline, AgentSpecializationInline, AgentAvailabilityInline]
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Company Information', {
            'fields': ('company_name', 'office_address', 'specialization', 'bio')
        }),
        ('Social Media', {
            'fields': ('facebook', 'twitter', 'linkedin', 'instagram')
        }),
        ('Status', {
            'fields': ('is_approved', 'created_at', 'updated_at')
        }),
    )

@admin.register(AgentReview)
class AgentReviewAdmin(admin.ModelAdmin):
    list_display = ['agent', 'name', 'email', 'rating', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'rating', 'created_at']
    search_fields = ['agent__user__email', 'name', 'email', 'comment']
    readonly_fields = ['created_at']

@admin.register(AgentContact)
class AgentContactAdmin(admin.ModelAdmin):
    list_display = ['agent', 'user', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['agent__user__email', 'user__email', 'message']
    readonly_fields = ['created_at']

@admin.register(AgentListing)
class AgentListingAdmin(admin.ModelAdmin):
    list_display = ['agent', 'property', 'is_featured', 'featured_until', 'created_at']
    list_filter = ['is_featured', 'created_at']
    search_fields = ['agent__user__email', 'property__title']
    readonly_fields = ['created_at', 'updated_at']
