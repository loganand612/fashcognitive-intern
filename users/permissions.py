from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .models import Template, TemplateAccess, GranularPermission, PermissionType, TemplateAssignment


class IsTemplateOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a template to access it.
    """

    def has_object_permission(self, request, view, obj):
        # Check if the object is a Template
        if isinstance(obj, Template):
            return obj.user == request.user

        # If the object has a template attribute, check if the user is the owner
        if hasattr(obj, 'template'):
            return obj.template.user == request.user

        return False


class HasTemplateAccess(permissions.BasePermission):
    """
    Custom permission to allow access based on the user's permission level for a template.
    """

    def has_object_permission(self, request, view, obj):
        # Get the template object
        template = None
        if isinstance(obj, Template):
            template = obj
        elif hasattr(obj, 'template'):
            template = obj.template
        else:
            return False

        # Check if user is the template owner
        if template.user == request.user:
            return True

        # Check if user is an inspector assigned to this template
        if request.user.user_role == 'inspector':
            assignment_exists = TemplateAssignment.objects.filter(
                template=template,
                inspector=request.user,
                status__in=['assigned', 'in_progress']
            ).exists()

            if assignment_exists:
                # Inspectors can only view and update (not delete) assigned templates
                if request.method in permissions.SAFE_METHODS or request.method in ['PUT', 'PATCH']:
                    return True
                return False

        # Check if user has access through TemplateAccess
        try:
            access = TemplateAccess.objects.get(
                template=template,
                user=request.user,
                status='active'
            )

            # Record this access
            access.record_access()

            # For safe methods (GET, HEAD, OPTIONS), any access level is sufficient
            if request.method in permissions.SAFE_METHODS:
                return True

            # For unsafe methods, check permission level
            if request.method in ['PUT', 'PATCH']:
                return access.permission_level in ['owner', 'admin', 'editor']

            if request.method == 'DELETE':
                return access.permission_level in ['owner', 'admin']

            return False

        except TemplateAccess.DoesNotExist:
            return False


class HasGranularPermission(permissions.BasePermission):
    """
    Custom permission to check if a user has a specific granular permission.
    """

    def __init__(self, required_permission_codename):
        self.required_permission_codename = required_permission_codename
        super().__init__()

    def has_object_permission(self, request, view, obj):
        # Get the template object
        template = None
        if isinstance(obj, Template):
            template = obj
        elif hasattr(obj, 'template'):
            template = obj.template
        else:
            return False

        # Check if user is the template owner (owners have all permissions)
        if template.user == request.user:
            return True

        # Check if user has admin access (admins have all permissions)
        try:
            access = TemplateAccess.objects.get(
                template=template,
                user=request.user,
                status='active'
            )

            if access.permission_level in ['owner', 'admin']:
                return True

            # For other permission levels, check granular permissions
            try:
                permission_type = PermissionType.objects.get(codename=self.required_permission_codename)
                has_permission = GranularPermission.objects.filter(
                    template_access=access,
                    permission_type=permission_type
                ).exists()

                return has_permission

            except PermissionType.DoesNotExist:
                return False

        except TemplateAccess.DoesNotExist:
            return False


def has_template_permission(user, template_id, required_level=None, permission_codename=None):
    """
    Utility function to check if a user has the required permission level or granular permission
    for a template. This can be used in views or other functions.

    Args:
        user: The user to check permissions for
        template_id: The ID of the template
        required_level: The minimum required permission level (owner, admin, editor, viewer)
        permission_codename: A specific granular permission codename to check

    Returns:
        bool: True if the user has the required permission, False otherwise
    """
    print(f"🔍 has_template_permission: user={user}, template_id={template_id}, required_level={required_level}")

    try:
        template = Template.objects.get(id=template_id)
        print(f"🔍 Template found: {template.title}")

        # Check if user is the template owner
        if template.user == user:
            print(f"🔍 User is template owner, granting access")
            return True

        # Check if user is admin - admin users have access to all templates
        if user.user_role == 'admin':
            print(f"🔍 User is admin, granting access to all templates")
            return True

        # Check if user is an inspector with an assignment for this template
        if user.user_role == 'inspector':
            print(f"🔍 User is inspector, checking assignments...")
            assignment_exists = TemplateAssignment.objects.filter(
                template=template,
                inspector=user,
                status__in=['assigned', 'in_progress', 'completed']
            ).exists()

            print(f"🔍 Assignment exists: {assignment_exists}")

            if assignment_exists:
                # For inspectors with assignments, they have at least viewer access
                if required_level in ['viewer', None]:
                    print(f"🔍 Inspector has assignment and required level is viewer/None, granting access")
                    return True
                # Inspectors can't have higher permissions through assignments
                print(f"🔍 Inspector has assignment but required level ({required_level}) is higher than viewer")
                return False

        # Check if user has access through TemplateAccess
        try:
            access = TemplateAccess.objects.get(
                template=template,
                user=user,
                status='active'
            )

            # Record this access
            access.record_access()

            # Check permission level if required
            if required_level:
                permission_hierarchy = {
                    'owner': 4,
                    'admin': 3,
                    'editor': 2,
                    'viewer': 1
                }

                user_level = permission_hierarchy.get(access.permission_level, 0)
                required_level_value = permission_hierarchy.get(required_level, 0)

                if user_level >= required_level_value:
                    return True
            else:
                # If no specific level is required, any access is sufficient
                return True

            # Check granular permission if required
            if permission_codename:
                try:
                    permission_type = PermissionType.objects.get(codename=permission_codename)
                    has_permission = GranularPermission.objects.filter(
                        template_access=access,
                        permission_type=permission_type
                    ).exists()

                    return has_permission

                except PermissionType.DoesNotExist:
                    return False

            return False

        except TemplateAccess.DoesNotExist:
            print(f"🔍 No TemplateAccess found for user")
            return False

    except Template.DoesNotExist:
        print(f"🔍 Template {template_id} does not exist")
        return False


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users with admin role.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == 'admin'


class IsInspector(permissions.BasePermission):
    """
    Custom permission to only allow users with inspector role.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == 'inspector'


class IsAssignedInspector(permissions.BasePermission):
    """
    Custom permission to only allow the assigned inspector to access a template.
    """

    def has_object_permission(self, request, view, obj):
        # Get the template object
        template = None
        if isinstance(obj, Template):
            template = obj
        elif hasattr(obj, 'template'):
            template = obj.template
        else:
            return False

        # Check if user is an inspector
        if not request.user.is_authenticated or request.user.user_role != 'inspector':
            return False

        # Check if user is assigned to this template
        return TemplateAssignment.objects.filter(
            template=template,
            inspector=request.user,
            status__in=['assigned', 'in_progress']
        ).exists()


class CanManageAssignments(permissions.BasePermission):
    """
    Custom permission to only allow users who can manage template assignments.
    Currently, only admin users can manage assignments.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == 'admin'

    def has_object_permission(self, request, view, obj):
        # Admin users can manage all assignments
        if request.user.user_role == 'admin':
            return True

        # For template owners, check if they own the template
        if hasattr(obj, 'template'):
            return obj.template.user == request.user

        return False
