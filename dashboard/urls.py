from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='index'),
    path('agent/', views.AgentDashboardView.as_view(), name='agent'),
    path('admin/', views.AdminDashboardView.as_view(), name='admin'),
    path('customer/', views.CustomerDashboardView.as_view(), name='customer'),
    path('favorites/', views.FavoritePropertiesView.as_view(), name='favorites'),
    path('properties/', views.PropertyListView.as_view(), name='properties'),
    path('properties/add/', views.PropertyCreateView.as_view(), name='property_add'),
    path('properties/<slug:slug>/edit/', views.PropertyUpdateView.as_view(), name='property_edit'),
    path('properties/<slug:slug>/delete/', views.PropertyDeleteView.as_view(), name='property_delete'),
    path('profile/', views.ProfileUpdateView.as_view(), name='profile'),
    path('inquiries/', views.InquiryListView.as_view(), name='inquiries'),
    path('viewings/', views.ViewingListView.as_view(), name='viewings'),
] 