from django.urls import path
from .views import RegisterUserView, login_user, templates_api, DashboardAPI,TemplateAPI, TemplateCreateView, TemplateDetailView, DashboardTemplateView

urlpatterns = [
    path("login/", login_user, name="login"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path("dashboard/", DashboardAPI.as_view(), name="dashboard_api"),
    path("create_templates/", TemplateCreateView.as_view(), name="create-template"),
    path("templates/", TemplateAPI.as_view(), name="template-list"),
    path("templates/<int:pk>/", TemplateDetailView.as_view(), name="template-detail"),
    path("dashboard/templates/", DashboardTemplateView.as_view(), name="dashboard_templates"),
]


