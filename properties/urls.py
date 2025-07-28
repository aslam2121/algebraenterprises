from django.urls import path
from . import views
from .views import ajax_property_image_upload

app_name = 'properties'

urlpatterns = [
    path('', views.PropertyListView.as_view(), name='list'),
    path('search/', views.PropertyListView.as_view(), name='search'),
    path('<slug:slug>/', views.PropertyDetailView.as_view(), name='detail'),
    path('<slug:slug>/inquiry/', views.send_inquiry, name='send_inquiry'),
    path('<slug:slug>/viewing/', views.schedule_viewing, name='schedule_viewing'),
    path('<slug:slug>/favorite/', views.toggle_favorite, name='toggle_favorite'),
    path('<slug:slug>/remove-favorite/', views.remove_favorite, name='remove_favorite'),
    path('admin/properties/property/<int:property_id>/upload-image/', ajax_property_image_upload, name='property_image_upload'),
] 