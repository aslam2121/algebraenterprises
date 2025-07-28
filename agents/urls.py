from django.urls import path
from . import views

app_name = 'agents'

urlpatterns = [
    path('', views.AgentListView.as_view(), name='list'),
    path('<str:username>/', views.AgentDetailView.as_view(), name='detail'),
] 