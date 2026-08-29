from django.urls import path
from . import views

app_name = 'cafe'

urlpatterns = [
    path('', views.home, name='home'),
    path('menu/', views.menu, name='menu'),
    path('about/', views.about, name='about'),
    path('chat/', views.chat, name='chat'),
]
