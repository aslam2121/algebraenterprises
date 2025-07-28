from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from .models import Property, PropertyCategory, PropertyImage, PropertyVideo, PropertyInquiry, PropertyViewing, PropertyFeature
from .forms import PropertyImageForm, PropertyVideoForm
from adminsortable2.admin import SortableAdminBase, SortableInlineAdminMixin

@admin.register(PropertyFeature)
class PropertyFeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon', 'properties_count')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    def properties_count(self, obj):
        return obj.properties.count()
    properties_count.short_description = 'Properties'

@admin.register(PropertyCategory)
class PropertyCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')
    ordering = ('name',)
    prepopulated_fields = {'slug': ('name',)}

class PropertyImageInline(SortableInlineAdminMixin, admin.TabularInline):
    model = PropertyImage
    form = PropertyImageForm
    extra = 1
    fields = ['order', 'image', 'caption', 'is_primary', 'preview']
    readonly_fields = ['preview']

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "No image"
    preview.short_description = 'Preview'

class PropertyVideoInline(admin.TabularInline):
    model = PropertyVideo
    form = PropertyVideoForm
    extra = 1
    fields = ['title', 'video', 'description', 'order']

@admin.register(Property)
class PropertyAdmin(SortableAdminBase, admin.ModelAdmin):
    change_form_template = "admin/properties/property/change_form.html"
    list_display = ['title', 'property_type', 'status', 'price', 'neighbourhood', 'agent', 'is_verified', 'is_featured', 'created_at']
    list_filter = ['property_type', 'status', 'is_verified', 'is_featured', 'created_at', 'features', 'neighbourhood']
    search_fields = ['title', 'description', 'address', 'neighbourhood', 'city']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'views_count']
    inlines = [PropertyImageInline, PropertyVideoInline]
    filter_horizontal = ['features']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'price', 'property_type', 'category', 'status')
        }),
        ('Property Details', {
            'fields': ('bedrooms', 'bathrooms', 'area', 'garages', 'year_built', 'features'),
            'description': 'Select or remove features for this property. You can select multiple features.'
        }),
        ('Location', {
            'fields': ('address', 'neighbourhood', 'city'),
            'description': 'Address information (only visible to agents and admins in frontend)'
        }),
        ('Metadata', {
            'fields': ('agent', 'is_verified', 'is_featured', 'created_at', 'updated_at', 'views_count')
        }),
    )

    class Media:
        js = [
            'https://unpkg.com/filepond@4/dist/filepond.min.js',
            '/static/properties/js/image_upload.js',
        ]
        css = {
            'all': [
                'https://unpkg.com/filepond@4/dist/filepond.min.css',
                'admin/css/property_admin.css',
            ]
        }

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(agent__user=request.user)

@admin.register(PropertyInquiry)
class PropertyInquiryAdmin(admin.ModelAdmin):
    list_display = ['property', 'name', 'email', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['property__title', 'name', 'email', 'message']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(PropertyViewing)
class PropertyViewingAdmin(admin.ModelAdmin):
    list_display = ['property', 'name', 'email', 'preferred_date', 'preferred_time', 'status']
    list_filter = ['status', 'preferred_date']
    search_fields = ['property__title', 'name', 'email', 'message']
    readonly_fields = ['created_at', 'updated_at']
