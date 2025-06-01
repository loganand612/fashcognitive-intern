from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication

from .models import Template, TemplateAssignment, CustomUser
from .serializers import TemplateAssignmentSerializer, TemplateSerializer
from .permissions import IsAdmin, IsInspector, IsAssignedInspector, CanManageAssignments


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that doesn't enforce CSRF for any requests
    """
    def enforce_csrf(self, request):
        # Skip CSRF check for all requests (for debugging)
        return


class TemplateAssignmentListView(APIView):
    """
    API view to list and create template assignments
    """
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all template assignments for admin users or assigned to the current inspector"""
        if request.user.user_role == 'admin':
            # Admin users can see all assignments
            assignments = TemplateAssignment.objects.all().order_by('-assigned_at')
        elif request.user.user_role == 'inspector':
            # Inspector users see assignments where they are the assigned inspector
            assignments = TemplateAssignment.objects.filter(
                inspector=request.user,
                status__in=['assigned', 'in_progress']
            ).order_by('-assigned_at')
        else:
            # Regular users can only see assignments they created
            assignments = TemplateAssignment.objects.filter(assigned_by=request.user).order_by('-assigned_at')

        serializer = TemplateAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new template assignment"""
        print(f"🔍 POST REQUEST STARTED")
        print(f"🔍 Request method: {request.method}")
        print(f"🔍 Request user: {request.user}")
        print(f"🔍 Request authenticated: {request.user.is_authenticated}")

        # Only admin users can create assignments
        if request.user.user_role != 'admin':
            print(f"🔍 PERMISSION DENIED: User role '{request.user.user_role}' is not admin")
            return Response(
                {"detail": "Only admin users can assign templates."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get template and inspector (handle both DRF and Django requests)
        if hasattr(request, 'data'):
            data = request.data
        else:
            data = request.POST

        # Handle different field name formats from different frontend components
        template_id = data.get('template') or data.get('template_id')
        inspector_id = data.get('inspector') or data.get('assigned_to_id')

        print(f"🔍 Raw request data: {data}")
        print(f"🔍 Data keys: {list(data.keys()) if hasattr(data, 'keys') else 'No keys method'}")
        print(f"🔍 Template ID: {template_id} (type: {type(template_id)})")
        print(f"🔍 Inspector ID: {inspector_id} (type: {type(inspector_id)})")
        print(f"🔍 All data items:")
        if hasattr(data, 'items'):
            for key, value in data.items():
                print(f"🔍   {key}: {value} (type: {type(value)})")

        if not template_id or not inspector_id:
            return Response(
                {"detail": "Template and inspector are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle template ID - check if it's numeric (database ID) or string (frontend ID)
        try:
            if str(template_id).isdigit():
                template = get_object_or_404(Template, id=template_id)
            else:
                # Frontend-generated ID - template doesn't exist in database yet
                return Response(
                    {"detail": "Template must be saved before it can be assigned. Please save the template first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"detail": "Invalid template ID format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"🔍 Looking for inspector with ID: {inspector_id}")
        try:
            inspector = CustomUser.objects.get(id=inspector_id)
            print(f"🔍 Found inspector: {inspector.email} (ID: {inspector.id})")
            print(f"🔍 Inspector role: {inspector.user_role}")
        except CustomUser.DoesNotExist:
            print(f"🔍 INSPECTOR NOT FOUND: No user with ID {inspector_id}")
            return Response(
                {"detail": "Inspector not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify inspector has the inspector role
        if inspector.user_role != 'inspector':
            print(f"🔍 INVALID INSPECTOR ROLE: User {inspector.email} has role '{inspector.user_role}', not 'inspector'")
            return Response(
                {"detail": "Selected user is not an inspector."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if assignment already exists (any status due to unique constraint)
        print(f"🔍 Checking for existing assignments for template {template.id} and inspector {inspector.id}")
        existing_assignment = TemplateAssignment.objects.filter(
            template=template,
            inspector=inspector
        ).first()

        if existing_assignment:
            print(f"🔍 DUPLICATE ASSIGNMENT FOUND: Assignment {existing_assignment.id} already exists with status '{existing_assignment.status}'")
            print(f"🔍 AUTO-REASSIGNMENT: Automatically deleting existing assignment {existing_assignment.id}")

            # Delete the existing assignment to avoid unique constraint violation
            # This allows us to create a completely new assignment with updated details
            existing_assignment.delete()
            print(f"🔍 Existing assignment deleted, proceeding with new assignment")

        print(f"🔍 No existing assignment found, proceeding to create new assignment")

        # Create new assignment
        assignment_data = {
            'template': template,
            'inspector': inspector,
            'assigned_by': request.user,
            'status': 'assigned',
            'notes': data.get('notes', '')
        }

        # Add due date if provided
        due_date = data.get('due_date')
        if due_date:
            try:
                # Handle different date formats
                if 'T' in due_date:
                    # Full ISO format with time
                    assignment_data['due_date'] = timezone.datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                else:
                    # Date only format (YYYY-MM-DD) - set to end of day
                    from datetime import datetime
                    date_obj = datetime.strptime(due_date, '%Y-%m-%d')
                    # Set to end of day (23:59:59) in the current timezone
                    assignment_data['due_date'] = timezone.make_aware(
                        date_obj.replace(hour=23, minute=59, second=59)
                    )
                print(f"🔍 Parsed due_date: {assignment_data['due_date']}")
            except (ValueError, AttributeError) as e:
                print(f"🔍 Due date parsing error: {e}")
                return Response(
                    {"detail": f"Invalid due date format '{due_date}'. Please use YYYY-MM-DD or ISO format."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            print(f"🔍 Creating assignment with data: {assignment_data}")
            assignment = TemplateAssignment.objects.create(**assignment_data)
            print(f"🔍 Assignment created successfully: ID={assignment.id}")
            serializer = TemplateAssignmentSerializer(assignment)
            print(f"🔍 Assignment serialized successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"🔍 ERROR creating assignment: {e}")
            print(f"🔍 Error type: {type(e)}")
            return Response(
                {"detail": f"Failed to create assignment: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class TemplateAssignmentDetailView(APIView):
    """
    API view to retrieve, update or delete a template assignment
    """
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(TemplateAssignment, pk=pk)

    def get(self, request, pk):
        """Get a specific template assignment"""
        assignment = self.get_object(pk)

        # Check permissions
        if request.user.user_role == 'admin' or request.user == assignment.assigned_by or request.user == assignment.inspector:
            serializer = TemplateAssignmentSerializer(assignment)
            return Response(serializer.data)

        return Response(
            {"detail": "You don't have permission to view this assignment."},
            status=status.HTTP_403_FORBIDDEN
        )

    def put(self, request, pk):
        """Update a template assignment"""
        assignment = self.get_object(pk)

        # Only admin users or the assigning user can update assignments
        if not (request.user.user_role == 'admin' or request.user == assignment.assigned_by):
            return Response(
                {"detail": "You don't have permission to update this assignment."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Handle status changes
        new_status = request.data.get('status')
        if new_status and new_status != assignment.status:
            if new_status == 'in_progress' and assignment.status == 'assigned':
                assignment.start()
            elif new_status == 'completed' and assignment.status in ['assigned', 'in_progress']:
                assignment.complete()
            elif new_status == 'revoked' and assignment.status in ['assigned', 'in_progress']:
                assignment.revoke()

        # Update other fields
        if 'notes' in request.data:
            assignment.notes = request.data.get('notes')

        # Update due date if provided
        if 'due_date' in request.data:
            due_date = request.data.get('due_date')
            if due_date:
                try:
                    assignment.due_date = timezone.datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    return Response(
                        {"detail": "Invalid due date format. Please use ISO format (YYYY-MM-DDTHH:MM:SS)."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # If null is provided, clear the due date
                assignment.due_date = None

        # Save all changes
        assignment.save()

        # Check if assignment has expired
        assignment.is_expired()

        serializer = TemplateAssignmentSerializer(assignment)
        return Response(serializer.data)

    def delete(self, request, pk):
        """Delete a template assignment"""
        assignment = self.get_object(pk)

        # Only admin users or the assigning user can delete assignments
        if not (request.user.user_role == 'admin' or request.user == assignment.assigned_by):
            return Response(
                {"detail": "You don't have permission to delete this assignment."},
                status=status.HTTP_403_FORBIDDEN
            )

        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InspectorAssignmentsView(APIView):
    """
    API view for inspectors to view their assigned templates
    Admin users can also access this endpoint but will receive an empty list
    """
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get all templates assigned to the current inspector
        For admin users, return an empty list
        """
        # For admin users, return an empty list
        if request.user.user_role == 'admin':
            return Response([])

        # For inspectors, return their assignments
        if request.user.user_role == 'inspector':
            # Get active assignments
            assignments = TemplateAssignment.objects.filter(
                inspector=request.user,
                status__in=['assigned', 'in_progress']
            ).order_by('-assigned_at')

            # Check each assignment for expiration
            for assignment in assignments:
                assignment.is_expired()

            # Re-query to exclude any that might have just expired
            assignments = TemplateAssignment.objects.filter(
                inspector=request.user,
                status__in=['assigned', 'in_progress']
            ).order_by('-assigned_at')

            serializer = TemplateAssignmentSerializer(assignments, many=True)
            return Response(serializer.data)

        # For other users, return a forbidden response
        return Response(
            {"detail": "You don't have permission to view assignments."},
            status=status.HTTP_403_FORBIDDEN
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInspector])
def start_assignment(request, pk):
    """Mark an assignment as in progress"""
    assignment = get_object_or_404(TemplateAssignment, pk=pk)

    # Verify the current user is the assigned inspector
    if request.user != assignment.inspector:
        return Response(
            {"detail": "You are not the assigned inspector for this template."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if assignment has expired
    if assignment.is_expired():
        return Response(
            {"detail": "This assignment has expired and cannot be started."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify the assignment is in 'assigned' status
    if assignment.status != 'assigned':
        return Response(
            {"detail": f"Cannot start assignment with status '{assignment.status}'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Try to start the assignment
    if not assignment.start():
        return Response(
            {"detail": "Failed to start assignment. It may have expired or been revoked."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = TemplateAssignmentSerializer(assignment)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInspector])
def complete_assignment(request, pk):
    """Mark an assignment as completed"""
    assignment = get_object_or_404(TemplateAssignment, pk=pk)

    # Verify the current user is the assigned inspector
    if request.user != assignment.inspector:
        return Response(
            {"detail": "You are not the assigned inspector for this template."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if assignment has expired
    if assignment.is_expired():
        return Response(
            {"detail": "This assignment has expired and cannot be completed."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verify the assignment is in 'in_progress' or 'assigned' status
    if assignment.status not in ['in_progress', 'assigned']:
        return Response(
            {"detail": f"Cannot complete assignment with status '{assignment.status}'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Try to complete the assignment
    if not assignment.complete():
        return Response(
            {"detail": "Failed to complete assignment. It may have expired or been revoked."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = TemplateAssignmentSerializer(assignment)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_assignment(request, pk):
    """Revoke a template assignment"""
    # Only admin users can revoke assignments
    if request.user.user_role != 'admin':
        return Response(
            {"detail": "Only admin users can revoke assignments."},
            status=status.HTTP_403_FORBIDDEN
        )

    assignment = get_object_or_404(TemplateAssignment, pk=pk)

    # Verify the assignment is not already completed or revoked
    if assignment.status in ['completed', 'revoked']:
        return Response(
            {"detail": f"Cannot revoke assignment with status '{assignment.status}'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    assignment.revoke()
    serializer = TemplateAssignmentSerializer(assignment)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reassign_template(request, pk):
    """Reassign a template to another inspector"""
    # Only admin users can reassign templates
    if request.user.user_role != 'admin':
        return Response(
            {"detail": "Only admin users can reassign templates."},
            status=status.HTTP_403_FORBIDDEN
        )

    assignment = get_object_or_404(TemplateAssignment, pk=pk)
    new_inspector_id = request.data.get('inspector')

    if not new_inspector_id:
        return Response(
            {"detail": "New inspector ID is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get the new inspector
    new_inspector = get_object_or_404(CustomUser, id=new_inspector_id)

    # Verify new inspector has the inspector role
    if new_inspector.user_role != 'inspector':
        return Response(
            {"detail": "Selected user is not an inspector."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Revoke the current assignment
    assignment.revoke()

    # Create a new assignment
    new_assignment = TemplateAssignment.objects.create(
        template=assignment.template,
        inspector=new_inspector,
        assigned_by=request.user,
        status='assigned',
        notes=f"Reassigned from {assignment.inspector.email}"
    )

    serializer = TemplateAssignmentSerializer(new_assignment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
