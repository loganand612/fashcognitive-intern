
from django.urls import path
from .views import RegisterUserView,login_user,templates_api

urlpatterns = [
    path("login/", login_user, name="login"),
    path('register/', RegisterUserView.as_view(), name='register'),
    path("create_templates/", templates_api, name="create_templates"),  
]
