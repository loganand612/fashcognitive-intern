from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Template, TemplateAccess, CustomUser, PermissionAuditLog
from .serializers import TemplateSerializer, TemplateAccessSerializer
from .permissions import IsTemplateOwner, HasTemplateAccess

class TemplateAccessListView(APIView):
    """
    API view to list and create template access permissions
    """
    permission_classes = [IsAuthenticated]

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get(self, request, template_id):
        """Get all access permissions for a template"""
        template = get_object_or_404(Template, id=template_id)

        # Check if user is owner or has admin access
        try:
            user_access = TemplateAccess.objects.get(
                template=template,
                user=request.user
            )
            if user_access.permission_level not in ['owner', 'admin']:
                return Response(
                    {"detail": "You don't have permission to view access settings for this template."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except TemplateAccess.DoesNotExist:
            # If template belongs to user but no explicit access record exists
            if template.user == request.user:
                # Create owner access record for the user
                TemplateAccess.objects.create(
                    template=template,
                    user=request.user,
                    permission_level='owner',
                    status='active'
                )
            else:
                return Response(
                    {"detail": "You don't have permission to view access settings for this template."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Get all access permissions for this template
        access_permissions = TemplateAccess.objects.filter(template=template)
        serializer = TemplateAccessSerializer(access_permissions, many=True)
        return Response(serializer.data)

    def post(self, request, template_id):
        """Create a new access permission for a template"""
        template = get_object_or_404(Template, id=template_id)

        # Check if user is owner or has admin access
        try:
            user_access = TemplateAccess.objects.get(
                template=template,
                user=request.user
            )
            if user_access.permission_level not in ['owner', 'admin']:
                return Response(
                    {"detail": "You don't have permission to modify access settings for this template."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except TemplateAccess.DoesNotExist:
            # If template belongs to user but no explicit access record exists
            if template.user == request.user:
                # Create owner access record for the user
                TemplateAccess.objects.create(
                    template=template,
                    user=request.user,
                    permission_level='owner',
                    status='active'
                )
            else:
                return Response(
                    {"detail": "You don't have permission to modify access settings for this template."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Get user by email
        user_email = request.data.get('user_email')
        if not user_email:
            return Response(
                {"detail": "User email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=user_email)
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": f"User with email {user_email} does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if access already exists
        if TemplateAccess.objects.filter(template=template, user=user).exists():
            return Response(
                {"detail": f"User {user_email} already has access to this template."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new access permission
        permission_level = request.data.get('permission_level', 'viewer')
        if permission_level not in [choice[0] for choice in TemplateAccess.PERMISSION_CHOICES]:
            return Response(
                {"detail": f"Invalid permission level: {permission_level}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        access = TemplateAccess.objects.create(
            template=template,
            user=user,
            permission_level=permission_level,
            status='pending',  # New permissions start as pending until accepted
            granted_by=request.user
        )

        # Log the permission grant
        PermissionAuditLog.objects.create(
            user=user,
            template=template,
            action='grant',
            performed_by=request.user,
            old_permission=None,
            new_permission=permission_level,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            additional_data={
                'template_access_id': access.id,
                'status': 'pending'
            }
        )

        serializer = TemplateAccessSerializer(access)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TemplateAccessDetailView(APIView):
    """
    API view to retrieve, update or delete template access permissions
    """
    permission_classes = [IsAuthenticated]

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get(self, request, template_id, access_id):
        """Get a specific access permission"""
        template = get_object_or_404(Template, id=template_id)
        access = get_object_or_404(TemplateAccess, id=access_id, template=template)

        # Check if user is owner, has admin access, or is the user with this access
        if not (template.user == request.user or
                TemplateAccess.objects.filter(
                    template=template,
                    user=request.user,
                    permission_level__in=['owner', 'admin']
                ).exists() or
                access.user == request.user):
            return Response(
                {"detail": "You don't have permission to view this access permission."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TemplateAccessSerializer(access)
        return Response(serializer.data)

    def put(self, request, template_id, access_id):
        """Update an access permission"""
        template = get_object_or_404(Template, id=template_id)
        access = get_object_or_404(TemplateAccess, id=access_id, template=template)

        # Check if user is owner or has admin access
        if not (template.user == request.user or
                TemplateAccess.objects.filter(
                    template=template,
                    user=request.user,
                    permission_level__in=['owner', 'admin']
                ).exists()):
            return Response(
                {"detail": "You don't have permission to modify access settings for this template."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Don't allow changing owner's permission level unless it's a transfer
        if access.permission_level == 'owner' and request.data.get('permission_level') != 'owner':
            # Check if there's another owner being assigned
            new_owner_id = request.data.get('new_owner_id')
            if not new_owner_id:
                return Response(
                    {"detail": "Cannot change owner's permission level without transferring ownership."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                new_owner_access = TemplateAccess.objects.get(id=new_owner_id, template=template)
                # Transfer ownership
                new_owner_access.permission_level = 'owner'
                new_owner_access.save()
                access.permission_level = request.data.get('permission_level', 'admin')
                access.save()
                return Response(
                    {"detail": "Ownership transferred successfully."},
                    status=status.HTTP_200_OK
                )
            except TemplateAccess.DoesNotExist:
                return Response(
                    {"detail": "New owner access record not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Store old values for audit log
        old_permission_level = access.permission_level
        old_status = access.status

        # Update permission level
        permission_level = request.data.get('permission_level')
        if permission_level and permission_level in [choice[0] for choice in TemplateAccess.PERMISSION_CHOICES]:
            access.permission_level = permission_level

        # Update status
        status_value = request.data.get('status')
        if status_value and status_value in [choice[0] for choice in TemplateAccess.STATUS_CHOICES]:
            access.status = status_value

        access.save()

        # Log the permission change
        if old_permission_level != access.permission_level:
            PermissionAuditLog.objects.create(
                user=access.user,
                template=template,
                action='modify',
                performed_by=request.user,
                old_permission=old_permission_level,
                new_permission=access.permission_level,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                additional_data={
                    'template_access_id': access.id,
                    'old_status': old_status,
                    'new_status': access.status
                }
            )

        serializer = TemplateAccessSerializer(access)
        return Response(serializer.data)

    def delete(self, request, template_id, access_id):
        """Delete an access permission"""
        template = get_object_or_404(Template, id=template_id)
        access = get_object_or_404(TemplateAccess, id=access_id, template=template)

        # Check if user is owner or has admin access
        if not (template.user == request.user or
                TemplateAccess.objects.filter(
                    template=template,
                    user=request.user,
                    permission_level__in=['owner', 'admin']
                ).exists()):
            return Response(
                {"detail": "You don't have permission to modify access settings for this template."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Don't allow deleting the owner's access
        if access.permission_level == 'owner':
            return Response(
                {"detail": "Cannot delete the owner's access. Transfer ownership first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Log the permission revocation before deleting
        PermissionAuditLog.objects.create(
            user=access.user,
            template=template,
            action='revoke',
            performed_by=request.user,
            old_permission=access.permission_level,
            new_permission=None,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            additional_data={
                'template_access_id': access.id,
                'status': access.status
            }
        )

        access.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
