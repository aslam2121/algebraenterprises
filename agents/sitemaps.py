from django.contrib.sitemaps import Sitemap
from .models import AgentProfile

class AgentSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return AgentProfile.objects.filter(is_approved=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/agents/{obj.user.username}/' 