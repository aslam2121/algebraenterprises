from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .models import Property, PropertyCategory

class PropertySitemap(Sitemap):
    changefreq = "daily"
    priority = 0.8

    def items(self):
        return Property.objects.filter(is_verified=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/properties/{obj.slug}/'

class PropertyCategorySitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        return PropertyCategory.objects.all()

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/properties/category/{obj.slug}/' 