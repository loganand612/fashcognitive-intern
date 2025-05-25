from django.contrib import admin
from .models import (
    Template, Section, Question, CustomUser,
    TemplateAccess, TemplateAssignment, PermissionType,
    GranularPermission, PermissionAuditLog
)

# Register basic models
admin.site.register(Template)
admin.site.register(Section)
admin.site.register(Question)

# Custom admin for CustomUser
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'user_role', 'company_name')
    list_filter = ('user_role', 'company_name', 'industry_type')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'company_name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Company info', {'fields': ('company_name', 'industry_type', 'job_title', 'company_size')}),
        ('Role', {'fields': ('user_role',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)

# Custom admin for TemplateAssignment
class TemplateAssignmentAdmin(admin.ModelAdmin):
    list_display = ('template', 'inspector', 'assigned_by', 'status', 'assigned_at', 'completed_at')
    list_filter = ('status', 'assigned_at', 'completed_at')
    search_fields = ('template__title', 'inspector__email', 'assigned_by__email')
    ordering = ('-assigned_at',)
    raw_id_fields = ('template', 'inspector', 'assigned_by')
    date_hierarchy = 'assigned_at'

    fieldsets = (
        (None, {'fields': ('template', 'inspector', 'assigned_by')}),
        ('Status', {'fields': ('status', 'notes')}),
        ('Timestamps', {'fields': ('assigned_at', 'started_at', 'completed_at', 'revoked_at')}),
    )

    readonly_fields = ('assigned_at',)

admin.site.register(TemplateAssignment, TemplateAssignmentAdmin)

# Register other models
admin.site.register(TemplateAccess)
admin.site.register(PermissionType)
admin.site.register(GranularPermission)
admin.site.register(PermissionAuditLog)
