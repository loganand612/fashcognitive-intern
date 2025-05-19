import re
import json
from django.http import HttpResponseForbidden
from django.urls import resolve
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from .models import Template, TemplateAccess, PermissionAuditLog
from .permissions import has_template_permission


class AccessVerificationMiddleware(MiddlewareMixin):
    """
    Middleware to consistently check permissions across different views.
    This centralizes permission logic to avoid duplication.
    """
    
    # Define URL patterns that require permission checks
    TEMPLATE_URL_PATTERNS = [
        r'^/users/templates/(?P<template_id>\d+)/$',
        r'^/api/templates/(?P<template_id>\d+)/$',
        r'^/users/templates/(?P<template_id>\d+)/access/$',
        r'^/users/templates/(?P<template_id>\d+)/access/(?P<access_id>\d+)/$',
    ]
    
    # Define which methods require which permission levels for each URL pattern
    PERMISSION_REQUIREMENTS = {
        r'^/users/templates/(?P<template_id>\d+)/$': {
            'GET': 'viewer',
            'PUT': 'editor',
            'PATCH': 'editor',
            'DELETE': 'owner',
        },
        r'^/api/templates/(?P<template_id>\d+)/$': {
            'GET': 'viewer',
            'PUT': 'editor',
            'PATCH': 'editor',
            'DELETE': 'owner',
        },
        r'^/users/templates/(?P<template_id>\d+)/access/$': {
            'GET': 'admin',
            'POST': 'admin',
        },
        r'^/users/templates/(?P<template_id>\d+)/access/(?P<access_id>\d+)/$': {
            'GET': 'admin',
            'PUT': 'admin',
            'DELETE': 'admin',
        },
    }
    
    # URLs that should bypass this middleware
    EXEMPT_URLS = [
        r'^/admin/',
        r'^/static/',
        r'^/media/',
        r'^/users/login/',
        r'^/users/register/',
        r'^/users/auth-status/',
        r'^/users/get-csrf-token/',
    ]
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Check permissions before the view is called.
        """
        # Skip if user is not authenticated
        if not request.user.is_authenticated:
            return None
            
        # Skip for exempt URLs
        path = request.path
        for exempt_pattern in self.EXEMPT_URLS:
            if re.match(exempt_pattern, path):
                return None
                
        # Check if this URL requires permission verification
        template_id = None
        required_permission = None
        
        for pattern in self.TEMPLATE_URL_PATTERNS:
            match = re.match(pattern, path)
            if match:
                template_id = match.group('template_id')
                method_requirements = self.PERMISSION_REQUIREMENTS.get(pattern, {})
                required_permission = method_requirements.get(request.method)
                break
                
        # If no template_id or required_permission found, proceed to the view
        if not template_id or not required_permission:
            return None
            
        # Check if the user has the required permission
        has_permission = has_template_permission(
            request.user, 
            template_id, 
            required_level=required_permission
        )
        
        if not has_permission:
            # Log the failed access attempt
            try:
                template = Template.objects.get(id=template_id)
                PermissionAuditLog.objects.create(
                    user=request.user,
                    template=template,
                    action='access',
                    performed_by=request.user,
                    old_permission=None,
                    new_permission=None,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    additional_data={
                        'method': request.method,
                        'path': path,
                        'required_permission': required_permission,
                        'status': 'denied'
                    }
                )
            except Template.DoesNotExist:
                pass
                
            return HttpResponseForbidden(
                json.dumps({'detail': 'You do not have permission to perform this action.'}),
                content_type='application/json'
            )
            
        # Log the successful access
        try:
            template = Template.objects.get(id=template_id)
            PermissionAuditLog.objects.create(
                user=request.user,
                template=template,
                action='access',
                performed_by=request.user,
                old_permission=None,
                new_permission=None,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                additional_data={
                    'method': request.method,
                    'path': path,
                    'required_permission': required_permission,
                    'status': 'allowed'
                }
            )
        except Template.DoesNotExist:
            pass
            
        # Proceed to the view
        return None
        
    def get_client_ip(self, request):
        """
        Get the client's IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
