from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import SessionAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone

from .models import Template, TemplateAccess
from .serializers import TemplateSerializer


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that doesn't enforce CSRF for GET requests
    """
    def enforce_csrf(self, request):
        # Skip CSRF check for GET requests
        if request.method == 'GET':
            return
        return super().enforce_csrf(request)

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
    response = Response(serializer.data)

    # Add cache-control headers to ensure fresh data
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'

    return response


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

    # If user is inspector, check if template is assigned to them
    if user.user_role == 'inspector':
        from .models import TemplateAssignment
        has_assignment = TemplateAssignment.objects.filter(
            template=template,
            inspector=user,
            status__in=['assigned', 'in_progress']
        ).exists()

        if has_assignment:
            serializer = TemplateSerializer(template)
            return Response(serializer.data)
        else:
            return Response(
                {"detail": "You do not have access to this template. Please contact your administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

    # Check if user has access to the template (for non-inspectors)
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
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def user_templates_with_shared(request):
    """
    Get templates owned by the user and templates shared with the user
    Returns them as separate lists
    """
    # Debug authentication
    print(f"🔍 user_templates_with_shared called")
    print(f"🔍 User authenticated: {request.user.is_authenticated}")
    print(f"🔍 User: {request.user}")
    print(f"🔍 Session key: {request.session.session_key}")
    print(f"🔍 Request headers: {dict(request.headers)}")

    if not request.user.is_authenticated:
        print("❌ User not authenticated in user_templates_with_shared")
        return Response(
            {"detail": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = request.user
    print(f"✅ Authenticated user: {user.email} (ID: {user.id})")

    # Get templates owned by the user
    owned_templates = Template.objects.filter(user=user)
    print(f"📋 Found {owned_templates.count()} owned templates")

    # Get templates shared with the user
    shared_access = TemplateAccess.objects.filter(
        user=user,
        status='active'
    ).select_related('template')

    shared_templates = [access.template for access in shared_access]
    print(f"🤝 Found {len(shared_templates)} shared templates")

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
