from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import TemplateView, ListView, CreateView, UpdateView, DeleteView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.contrib import messages
from django.conf import settings
from properties.models import Property, PropertyInquiry, PropertyViewing, PropertyImage
from agents.models import AgentProfile
from accounts.models import User
from .models import PropertyView, SearchHistory, UserActivity, AgentPerformance
from properties.forms import PropertyForm

# Create your views here.

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'dashboard/index.html'

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_admin:
            return redirect('dashboard:admin')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.user.is_agent:
            agent_profile = get_object_or_404(AgentProfile, user=self.request.user)
            context['properties'] = Property.objects.filter(agent=agent_profile)
            context['viewings'] = PropertyView.objects.filter(property__agent=agent_profile)
        elif self.request.user.is_admin:
            context['properties'] = Property.objects.all()
            context['viewings'] = PropertyView.objects.all()
        else:
            context['favorites'] = self.request.user.favorite_properties.all()
            context['viewings'] = PropertyView.objects.filter(user=self.request.user)
        return context

class AgentDashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'dashboard/agent.html'

    def test_func(self):
        return self.request.user.is_agent

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        agent_profile = get_object_or_404(AgentProfile, user=self.request.user)
        context['properties'] = Property.objects.filter(agent=agent_profile)
        context['viewings'] = PropertyView.objects.filter(property__agent=agent_profile)
        context['performance'] = AgentPerformance.objects.filter(agent=agent_profile).first()
        return context

class AdminDashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'dashboard/admin.html'

    def test_func(self):
        return self.request.user.is_admin

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['properties'] = Property.objects.all()
        context['viewings'] = PropertyView.objects.all()
        context['agents'] = User.objects.filter(is_agent=True)
        return context

class CustomerDashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'dashboard/customer.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['favorites'] = self.request.user.favorite_properties.all()
        context['viewings'] = PropertyView.objects.filter(user=self.request.user)
        context['search_history'] = SearchHistory.objects.filter(user=self.request.user)
        return context

class PropertyListView(LoginRequiredMixin, ListView):
    model = Property
    template_name = 'dashboard/properties.html'
    context_object_name = 'properties'

    def get_queryset(self):
        if self.request.user.is_agent:
            agent_profile = get_object_or_404(AgentProfile, user=self.request.user)
            return Property.objects.filter(agent=agent_profile)
        elif self.request.user.is_admin:
            return Property.objects.all()
        return Property.objects.none()

class PropertyCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Property
    template_name = 'dashboard/property_form.html'
    form_class = PropertyForm

    def test_func(self):
        return self.request.user.is_agent or self.request.user.is_admin

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        try:
            agent_profile = get_object_or_404(AgentProfile, user=self.request.user)
            form.instance.agent = agent_profile
            form.instance.is_verified = True  # Automatically verify the property
            response = super().form_valid(form)
            
            # Handle multiple image uploads
            images = self.request.FILES.getlist('images')
            for image in images:
                PropertyImage.objects.create(
                    property=form.instance,
                    image=image,
                    is_primary=not form.instance.images.exists()  # First image is primary
                )
            
            messages.success(self.request, 'Property created successfully.')
            return response
        except Exception as e:
            messages.error(self.request, f'Error creating property: {str(e)}')
            return self.form_invalid(form)

    def form_invalid(self, form):
        messages.error(self.request, 'Please correct the errors below.')
        return super().form_invalid(form)

    def get_success_url(self):
        return reverse_lazy('dashboard:properties')

class PropertyUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Property
    template_name = 'dashboard/property_form.html'
    form_class = PropertyForm

    def test_func(self):
        obj = self.get_object()
        return self.request.user.is_admin or (self.request.user.is_agent and obj.agent.user == self.request.user)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        response = super().form_valid(form)
        
        # Handle multiple image uploads
        images = self.request.FILES.getlist('images')
        for image in images:
            PropertyImage.objects.create(
                property=form.instance,
                image=image,
                is_primary=not form.instance.images.exists()  # First image is primary
            )
        
        messages.success(self.request, 'Property updated successfully.')
        return response

    def get_success_url(self):
        return reverse_lazy('dashboard:properties')

class PropertyDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Property
    template_name = 'dashboard/property_confirm_delete.html'

    def test_func(self):
        obj = self.get_object()
        return self.request.user.is_admin or (self.request.user.is_agent and obj.agent.user == self.request.user)

    def delete(self, request, *args, **kwargs):
        messages.success(request, 'Property deleted successfully.')
        return super().delete(request, *args, **kwargs)

    def get_success_url(self):
        return reverse_lazy('dashboard:properties')

class ProfileUpdateView(LoginRequiredMixin, UpdateView):
    model = settings.AUTH_USER_MODEL
    template_name = 'dashboard/profile.html'
    fields = ['first_name', 'last_name', 'email', 'phone_number', 'profile_picture']

    def get_object(self):
        return self.request.user

    def form_valid(self, form):
        messages.success(self.request, 'Profile updated successfully.')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('dashboard:profile')

class InquiryListView(LoginRequiredMixin, ListView):
    model = PropertyView
    template_name = 'dashboard/inquiries.html'
    context_object_name = 'inquiries'

    def get_queryset(self):
        if self.request.user.is_agent:
            return PropertyView.objects.filter(property__agent=self.request.user)
        elif self.request.user.is_admin:
            return PropertyView.objects.all()
        return PropertyView.objects.filter(user=self.request.user)

class ViewingListView(LoginRequiredMixin, ListView):
    model = PropertyView
    template_name = 'dashboard/viewings.html'
    context_object_name = 'viewings'

    def get_queryset(self):
        if self.request.user.is_agent:
            return PropertyView.objects.filter(property__agent=self.request.user)
        elif self.request.user.is_admin:
            return PropertyView.objects.all()
        return PropertyView.objects.filter(user=self.request.user)

class FavoritePropertiesView(LoginRequiredMixin, ListView):
    template_name = 'dashboard/favorites.html'
    context_object_name = 'properties'
    paginate_by = 12

    def get_queryset(self):
        return self.request.user.favorite_properties.all()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Favorite Properties'
        return context
