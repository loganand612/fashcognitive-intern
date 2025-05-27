from django.urls import path
from .views import (
    RegisterUserView, login_user, logout_user, templates_api, DashboardAPI,
    TemplateAPI, TemplateCreateView, TemplateDetailView,
    DashboardTemplateView, AuthStatusView, auth_status, debug_auth_status, get_csrf_token, current_user
)
from .views import GarmentTemplateCreateView
from .template_access_views import TemplateAccessListView, TemplateAccessDetailView
from .shared_templates_views import (
    shared_templates, all_accessible_templates,
    template_detail_with_access_check, user_templates_with_shared
)
from .granular_permission_views import (
    PermissionTypeListView, GranularPermissionListView, GranularPermissionDetailView
)
from .audit_log_views import (
    TemplateAuditLogView, UserAuditLogView, recent_audit_logs
)
from .template_assignment_views import (
    TemplateAssignmentListView, TemplateAssignmentDetailView,
    InspectorAssignmentsView, start_assignment, complete_assignment,
    revoke_assignment, reassign_template
)
from .inspector_views import InspectorListView, get_inspectors
from .inspection_views import submit_inspection


urlpatterns = [
    path("login/", login_user, name="login"),
    path("logout/", logout_user, name="logout"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path("auth-status/", AuthStatusView.as_view(), name="auth-status"),
    path("debug-auth-status/", debug_auth_status, name="debug-auth-status"),
    path("dashboard/", DashboardAPI.as_view(), name="dashboard_api"),
    path("create_templates/", TemplateCreateView.as_view(), name="create_templates"),
    path("templates/", TemplateAPI.as_view(), name="template-list"),
    path("templates/<int:pk>/", TemplateDetailView.as_view(), name="template-detail"),
    path("dashboard/templates/", DashboardTemplateView.as_view(), name="dashboard_templates"),
    path("get-csrf-token/", get_csrf_token, name="get-csrf-token"),
    path("user/templates/", TemplateAPI.as_view(), name="user-templates"),
    path('garment-template/', GarmentTemplateCreateView.as_view(), name='garment-template'),
    path("api/templates/", TemplateCreateView.as_view(), name="api-template-create"),

    # API endpoints for frontend
    path("garment-template/", GarmentTemplateCreateView.as_view(), name='api-garment-template'),
    path("garment-template/publish/", GarmentTemplateCreateView.as_view(), name='api-garment-template-publish'),
    path("get-csrf-token/", get_csrf_token, name="api-get-csrf-token"),
    path("auth-status/", AuthStatusView.as_view(), name="api-auth-status"),
    path("debug-auth-status/", debug_auth_status, name="api-debug-auth-status"),
    path("current-user/", current_user, name="api-current-user"),
    path("logout/", logout_user, name="api-logout"),
    path("templates/<int:pk>/", TemplateDetailView.as_view(), name="api-template-detail"),

    # Template access management endpoints
    path("templates/<int:template_id>/access/", TemplateAccessListView.as_view(), name="template-access-list"),
    path("templates/<int:template_id>/access/<int:access_id>/", TemplateAccessDetailView.as_view(), name="template-access-detail"),

    # Shared templates endpoints
    path("shared-templates/", shared_templates, name="shared-templates"),
    path("all-templates/", all_accessible_templates, name="all-accessible-templates"),
    path("templates-with-shared/", user_templates_with_shared, name="templates-with-shared"),
    path("templates/<int:template_id>/access-check/", template_detail_with_access_check, name="template-detail-with-access"),

    # API endpoints for frontend (shared templates)
    path("shared-templates/", shared_templates, name="api-shared-templates"),
    path("all-templates/", all_accessible_templates, name="api-all-accessible-templates"),
    path("templates-with-shared/", user_templates_with_shared, name="api-templates-with-shared"),

    # Granular permission endpoints
    path("permission-types/", PermissionTypeListView.as_view(), name="permission-type-list"),
    path("templates/<int:template_id>/access/<int:access_id>/permissions/",
         GranularPermissionListView.as_view(), name="granular-permission-list"),
    path("templates/<int:template_id>/access/<int:access_id>/permissions/<int:permission_id>/",
         GranularPermissionDetailView.as_view(), name="granular-permission-detail"),

    # Audit log endpoints
    path("templates/<int:template_id>/audit-logs/",
         TemplateAuditLogView.as_view(), name="template-audit-logs"),
    path("users/<int:user_id>/audit-logs/",
         UserAuditLogView.as_view(), name="user-audit-logs"),
    path("my-audit-logs/",
         UserAuditLogView.as_view(), name="my-audit-logs"),
    path("recent-audit-logs/",
         recent_audit_logs, name="recent-audit-logs"),

    # Template assignment endpoints
    path("template-assignments/",
         TemplateAssignmentListView.as_view(), name="template-assignment-list"),
    path("template-assignments/<int:pk>/",
         TemplateAssignmentDetailView.as_view(), name="template-assignment-detail"),
    path("my-assignments/",
         InspectorAssignmentsView.as_view(), name="inspector-assignments"),
    path("template-assignments/<int:pk>/start/",
         start_assignment, name="start-assignment"),
    path("template-assignments/<int:pk>/complete/",
         complete_assignment, name="complete-assignment"),
    path("template-assignments/<int:pk>/revoke/",
         revoke_assignment, name="revoke-assignment"),
    path("template-assignments/<int:pk>/reassign/",
         reassign_template, name="reassign-template"),

    # API endpoints for frontend (template assignments)
    path("template-assignments/",
         TemplateAssignmentListView.as_view(), name="api-template-assignment-list"),
    path("template-assignments/<int:pk>/",
         TemplateAssignmentDetailView.as_view(), name="api-template-assignment-detail"),
    path("my-assignments/",
         InspectorAssignmentsView.as_view(), name="api-inspector-assignments"),
    path("template-assignments/<int:pk>/start/",
         start_assignment, name="api-start-assignment"),
    path("template-assignments/<int:pk>/complete/",
         complete_assignment, name="api-complete-assignment"),
    path("template-assignments/<int:pk>/revoke/",
         revoke_assignment, name="api-revoke-assignment"),
    path("template-assignments/<int:pk>/reassign/",
         reassign_template, name="api-reassign-template"),

    # Inspector endpoints
    path("inspectors/",
         InspectorListView.as_view(), name="inspector-list"),
    path("inspectors/",
         get_inspectors, name="api-inspector-list"),

    # Inspection endpoints
    path("submit-inspection/",
         submit_inspection, name="submit-inspection"),
    path("submit-inspection/",
         submit_inspection, name="api-submit-inspection"),
]

