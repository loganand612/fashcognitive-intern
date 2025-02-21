from django.urls import path
from .views import register, dashboard_view, user_login
from django.contrib.auth.decorators import login_required


urlpatterns = [
    path("", home, name="home"),
    path("register/", register, name="register"),
    path("login/", user_login, name="login"),
    path("dashboard/", dashboard_view, name="dashboard"),
]
