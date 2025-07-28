from django.urls import path
<<<<<<< HEAD
<<<<<<< HEAD
from . import views
=======
from .import views
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
from .import views
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
from .views import ajax_property_image_upload

app_name = 'properties'

urlpatterns = [
    path('', views.PropertyListView.as_view(), name='list'),
    path('search/', views.PropertyListView.as_view(), name='search'),
    path('<slug:slug>/', views.PropertyDetailView.as_view(), name='detail'),
<<<<<<< HEAD
<<<<<<< HEAD
    path('<slug:slug>/inquiry/', views.send_inquiry, name='send_inquiry'),
    path('<slug:slug>/viewing/', views.schedule_viewing, name='schedule_viewing'),
    path('<slug:slug>/favorite/', views.toggle_favorite, name='toggle_favorite'),
    path('<slug:slug>/remove-favorite/', views.remove_favorite, name='remove_favorite'),
=======
    path('<slug:slug>/schedule-viewing/', views.schedule_viewing, name='schedule_viewing'),
    path('<slug:slug>/send-inquiry/', views.send_inquiry, name='send_inquiry'),
    path('<int:pk>/toggle-favorite/', views.toggle_favorite, name='toggle_favorite'),
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
=======
    path('<slug:slug>/schedule-viewing/', views.schedule_viewing, name='schedule_viewing'),
    path('<slug:slug>/send-inquiry/', views.send_inquiry, name='send_inquiry'),
    path('<int:pk>/toggle-favorite/', views.toggle_favorite, name='toggle_favorite'),
>>>>>>> 071638c8575366cd0a285d6fe2c370b5d92be472
    path('admin/properties/property/<int:property_id>/upload-image/', ajax_property_image_upload, name='property_image_upload'),
] 