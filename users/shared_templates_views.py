from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from .models import Template, TemplateAccess
from .serializers import TemplateSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def shared_templates(request):
    """
    Get templates shared with the current user
    """
    user = request.user
    
    # Get templates where the user has explicit access
    template_access = TemplateAccess.objects.filter(
        user=user,
        status='active'
    ).select_related('template')
    
    # Extract the templates and update last_accessed
    templates = []
    for access in template_access:
        templates.append(access.template)
        # Record this access
        access.last_accessed = timezone.now()
        access.save(update_fields=['last_accessed'])
    
    serializer = TemplateSerializer(templates, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_accessible_templates(request):
    """
    Get all templates the user can access (owned + shared)
    """
    user = request.user
    
    # Get templates owned by the user
    owned_templates = Template.objects.filter(user=user)
    
    # Get templates shared with the user
    shared_access = TemplateAccess.objects.filter(
        user=user,
        status='active'
    ).select_related('template')
    
    shared_templates = [access.template for access in shared_access]
    
    # Combine both sets
    all_templates = list(owned_templates) + shared_templates
    
    # Update last_accessed for shared templates
    for access in shared_access:
        access.last_accessed = timezone.now()
        access.save(update_fields=['last_accessed'])
    
    serializer = TemplateSerializer(all_templates, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def template_detail_with_access_check(request, template_id):
    """
    Get a specific template if the user has access to it
    """
    user = request.user
    template = get_object_or_404(Template, id=template_id)
    
    # Check if user owns the template
    if template.user == user:
        serializer = TemplateSerializer(template)
        return Response(serializer.data)
    
    # Check if user has access to the template
    try:
        access = TemplateAccess.objects.get(
            template=template,
            user=user,
            status='active'
        )
        
        # Record this access
        access.last_accessed = timezone.now()
        access.save(update_fields=['last_accessed'])
        
        serializer = TemplateSerializer(template)
        return Response(serializer.data)
    except TemplateAccess.DoesNotExist:
        return Response(
            {"detail": "You don't have access to this template."},
            status=status.HTTP_403_FORBIDDEN
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_templates_with_shared(request):
    """
    Get templates owned by the user and templates shared with the user
    Returns them as separate lists
    """
    user = request.user
    
    # Get templates owned by the user
    owned_templates = Template.objects.filter(user=user)
    
    # Get templates shared with the user
    shared_access = TemplateAccess.objects.filter(
        user=user,
        status='active'
    ).select_related('template')
    
    shared_templates = [access.template for access in shared_access]
    
    # Update last_accessed for shared templates
    for access in shared_access:
        access.last_accessed = timezone.now()
        access.save(update_fields=['last_accessed'])
    
    owned_serializer = TemplateSerializer(owned_templates, many=True)
    shared_serializer = TemplateSerializer(shared_templates, many=True)
    
    return Response({
        "owned_templates": owned_serializer.data,
        "shared_templates": shared_serializer.data
    })
