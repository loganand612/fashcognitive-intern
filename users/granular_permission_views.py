from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import (
    Template, TemplateAccess, CustomUser, 
    PermissionType, GranularPermission, PermissionAuditLog
)
from .serializers import (
    TemplateSerializer, TemplateAccessSerializer,
    PermissionTypeSerializer, GranularPermissionSerializer
)
from .permissions import IsTemplateOwner, HasTemplateAccess


class PermissionTypeListView(APIView):
    """
    API view to list all available permission types
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all permission types"""
        permission_types = PermissionType.objects.all()
        serializer = PermissionTypeSerializer(permission_types, many=True)
        return Response(serializer.data)


class GranularPermissionListView(APIView):
    """
    API view to list and create granular permissions for a template access
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, template_id, access_id):
        """Get all granular permissions for a template access"""
        template = get_object_or_404(Template, id=template_id)
        template_access = get_object_or_404(TemplateAccess, id=access_id, template=template)
        
        # Check if user is owner or has admin access
        if not (template.user == request.user or 
                TemplateAccess.objects.filter(
                    template=template, 
                    user=request.user, 
                    permission_level__in=['owner', 'admin'],
                    status='active'
                ).exists() or
                template_access.user == request.user):
            return Response(
                {"detail": "You don't have permission to view granular permissions for this access."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        granular_permissions = GranularPermission.objects.filter(template_access=template_access)
        serializer = GranularPermissionSerializer(granular_permissions, many=True)
        return Response(serializer.data)
    
    def post(self, request, template_id, access_id):
        """Create a new granular permission for a template access"""
        template = get_object_or_404(Template, id=template_id)
        template_access = get_object_or_404(TemplateAccess, id=access_id, template=template)
        
        # Check if user is owner or has admin access
        if not (template.user == request.user or 
                TemplateAccess.objects.filter(
                    template=template, 
                    user=request.user, 
                    permission_level__in=['owner', 'admin'],
                    status='active'
                ).exists()):
            return Response(
                {"detail": "You don't have permission to modify granular permissions for this access."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get permission type
        permission_type_id = request.data.get('permission_type_id')
        if not permission_type_id:
            return Response(
                {"detail": "Permission type ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        permission_type = get_object_or_404(PermissionType, id=permission_type_id)
        
        # Check if this granular permission already exists
        if GranularPermission.objects.filter(
            template_access=template_access,
            permission_type=permission_type
        ).exists():
            return Response(
                {"detail": "This granular permission already exists for this access."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the granular permission
        granular_permission = GranularPermission.objects.create(
            template_access=template_access,
            permission_type=permission_type,
            granted_by=request.user
        )
        
        # Log the permission grant
        PermissionAuditLog.objects.create(
            user=template_access.user,
            template=template,
            action='grant',
            performed_by=request.user,
            old_permission=None,
            new_permission=permission_type.name,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            additional_data={
                'permission_type_id': permission_type.id,
                'template_access_id': template_access.id
            }
        )
        
        serializer = GranularPermissionSerializer(granular_permission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class GranularPermissionDetailView(APIView):
    """
    API view to retrieve, update or delete a granular permission
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, template_id, access_id, permission_id):
        """Get a specific granular permission"""
        template = get_object_or_404(Template, id=template_id)
        template_access = get_object_or_404(TemplateAccess, id=access_id, template=template)
        granular_permission = get_object_or_404(
            GranularPermission, 
            id=permission_id,
            template_access=template_access
        )
        
        # Check if user is owner, has admin access, or is the user with this access
        if not (template.user == request.user or 
                TemplateAccess.objects.filter(
                    template=template, 
                    user=request.user, 
                    permission_level__in=['owner', 'admin'],
                    status='active'
                ).exists() or
                template_access.user == request.user):
            return Response(
                {"detail": "You don't have permission to view this granular permission."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = GranularPermissionSerializer(granular_permission)
        return Response(serializer.data)
    
    def delete(self, request, template_id, access_id, permission_id):
        """Delete a granular permission"""
        template = get_object_or_404(Template, id=template_id)
        template_access = get_object_or_404(TemplateAccess, id=access_id, template=template)
        granular_permission = get_object_or_404(
            GranularPermission, 
            id=permission_id,
            template_access=template_access
        )
        
        # Check if user is owner or has admin access
        if not (template.user == request.user or 
                TemplateAccess.objects.filter(
                    template=template, 
                    user=request.user, 
                    permission_level__in=['owner', 'admin'],
                    status='active'
                ).exists()):
            return Response(
                {"detail": "You don't have permission to delete this granular permission."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log the permission revocation
        permission_type_name = granular_permission.permission_type.name
        PermissionAuditLog.objects.create(
            user=template_access.user,
            template=template,
            action='revoke',
            performed_by=request.user,
            old_permission=permission_type_name,
            new_permission=None,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            additional_data={
                'permission_type_id': granular_permission.permission_type.id,
                'template_access_id': template_access.id
            }
        )
        
        # Delete the granular permission
        granular_permission.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
