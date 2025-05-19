from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    Template, TemplateAccess, CustomUser, PermissionAuditLog
)
from .serializers import PermissionAuditLogSerializer
from .permissions import IsTemplateOwner, HasTemplateAccess


class TemplateAuditLogView(APIView):
    """
    API view to retrieve audit logs for a specific template
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, template_id):
        """Get audit logs for a template"""
        template = get_object_or_404(Template, id=template_id)
        
        # Check if user is owner or has admin access
        if not (template.user == request.user or 
                TemplateAccess.objects.filter(
                    template=template, 
                    user=request.user, 
                    permission_level__in=['owner', 'admin'],
                    status='active'
                ).exists()):
            return Response(
                {"detail": "You don't have permission to view audit logs for this template."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        action_type = request.query_params.get('action')
        user_id = request.query_params.get('user')
        days = request.query_params.get('days')
        
        # Base query
        audit_logs = PermissionAuditLog.objects.filter(template=template)
        
        # Apply filters
        if action_type:
            audit_logs = audit_logs.filter(action=action_type)
        
        if user_id:
            audit_logs = audit_logs.filter(user_id=user_id)
        
        if days:
            try:
                days = int(days)
                start_date = timezone.now() - timedelta(days=days)
                audit_logs = audit_logs.filter(timestamp__gte=start_date)
            except ValueError:
                pass
        
        # Order by timestamp descending
        audit_logs = audit_logs.order_by('-timestamp')
        
        serializer = PermissionAuditLogSerializer(audit_logs, many=True)
        return Response(serializer.data)


class UserAuditLogView(APIView):
    """
    API view to retrieve audit logs for a specific user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id=None):
        """Get audit logs for a user"""
        # If no user_id is provided, use the current user
        if not user_id:
            user = request.user
        else:
            user = get_object_or_404(CustomUser, id=user_id)
            
            # Only allow admins or the user themselves to view their logs
            if user != request.user and not request.user.is_staff:
                return Response(
                    {"detail": "You don't have permission to view audit logs for this user."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get query parameters
        action_type = request.query_params.get('action')
        template_id = request.query_params.get('template')
        days = request.query_params.get('days')
        
        # Base query
        audit_logs = PermissionAuditLog.objects.filter(user=user)
        
        # Apply filters
        if action_type:
            audit_logs = audit_logs.filter(action=action_type)
        
        if template_id:
            audit_logs = audit_logs.filter(template_id=template_id)
        
        if days:
            try:
                days = int(days)
                start_date = timezone.now() - timedelta(days=days)
                audit_logs = audit_logs.filter(timestamp__gte=start_date)
            except ValueError:
                pass
        
        # Order by timestamp descending
        audit_logs = audit_logs.order_by('-timestamp')
        
        serializer = PermissionAuditLogSerializer(audit_logs, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_audit_logs(request):
    """
    Get recent audit logs for templates the user has access to
    """
    user = request.user
    
    # Get templates where the user is owner or admin
    accessible_templates = Template.objects.filter(
        Q(user=user) |
        Q(access_permissions__user=user, 
          access_permissions__permission_level__in=['owner', 'admin'],
          access_permissions__status='active')
    ).distinct()
    
    # Get recent logs for these templates
    days = request.query_params.get('days', 7)
    try:
        days = int(days)
    except ValueError:
        days = 7
        
    start_date = timezone.now() - timedelta(days=days)
    
    audit_logs = PermissionAuditLog.objects.filter(
        template__in=accessible_templates,
        timestamp__gte=start_date
    ).order_by('-timestamp')[:100]  # Limit to 100 most recent logs
    
    serializer = PermissionAuditLogSerializer(audit_logs, many=True)
    return Response(serializer.data)
