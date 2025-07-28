from django.shortcuts import render
from django.views.generic import ListView, DetailView
from django.contrib.auth import get_user_model
from .models import AgentProfile

# Create your views here.

class AgentListView(ListView):
    model = AgentProfile
    template_name = 'agents/list.html'
    context_object_name = 'agents'
    paginate_by = 12

    def get_queryset(self):
        return AgentProfile.objects.filter(is_approved=True).select_related('user')

class AgentDetailView(DetailView):
    model = AgentProfile
    template_name = 'agents/detail.html'
    context_object_name = 'agent'
    slug_field = 'user__username'
    slug_url_kwarg = 'username'

    def get_queryset(self):
        return AgentProfile.objects.filter(is_approved=True).select_related('user')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['properties'] = self.object.properties.filter(is_verified=True)[:6]
        return context
