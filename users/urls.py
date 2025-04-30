from django.urls import path
from .views import (
    RegisterUserView, login_user, templates_api, DashboardAPI,
    TemplateAPI, TemplateCreateView, TemplateDetailView,
    DashboardTemplateView, auth_status, get_csrf_token
)

urlpatterns = [
    path("login/", login_user, name="login"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path("auth-status/", auth_status, name="auth-status"),
    path("dashboard/", DashboardAPI.as_view(), name="dashboard_api"),
    path("create_templates/", TemplateCreateView.as_view(), name="create_templates"),
    path("templates/", TemplateAPI.as_view(), name="template-list"),
    path("templates/<int:pk>/", TemplateDetailView.as_view(), name="template-detail"),
    path("dashboard/templates/", DashboardTemplateView.as_view(), name="dashboard_templates"),
    path("get-csrf-token/", get_csrf_token, name="get-csrf-token"),
]

from django.http import JsonResponse

def catch_all_debug(request, *args, **kwargs):
    print("🚨 HIT FALLBACK catch-all route:", request.path)
    return JsonResponse({"error": "Fallback hit", "path": request.path}, status=404)

urlpatterns += [
    path('<path:path>', catch_all_debug),  # TEMPORARY DEBUG ROUTE
]