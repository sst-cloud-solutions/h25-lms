from django.contrib import admin
from django.urls import path
from django.contrib.auth import views as auth_views
from lms import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.dashboard, name='dashboard'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    # Use a custom logout view to ensure correct redirect and CSRF-protected POST
    path('logout/', views.custom_logout, name='logout'),

    # API
    path('api/chat/', views.chat, name='chat'),
    path('api/question/', views.get_question, name='get_question'),
    path('api/answer/', views.submit_answer, name='submit_answer'),
]