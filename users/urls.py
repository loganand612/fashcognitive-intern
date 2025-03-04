
from django.urls import path
from .views import RegisterUserView,login_user,templates_api,DashboardAPI,TemplateAPI

urlpatterns = [
    path("login/", login_user, name="login"),
    path('register/', RegisterUserView.as_view(), name='register'),
    path("api/dashboard/", DashboardAPI.as_view(), name="dashboard_api"),
    path("api/create_templates/", templates_api, name="create_templates"),
    path("api/templates/", TemplateAPI.as_view(), name="template_api"),
]
