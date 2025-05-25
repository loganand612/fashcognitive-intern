from rest_framework.views import APIView
from rest_framework.response import Response as DRFResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import (
    Template, Inspection, Response as ResponseModel, InspectionResponse,
    Question, TemplateAssignment, CustomUser
)
from .permissions import IsInspector
from .serializers import InspectionSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_inspection(request):
    """
    API endpoint to submit inspection data.
    This creates a new Inspection record and associated Response records.
    If the inspection is part of a template assignment, it also updates the assignment status.
    """
    # Get data from request
    template_id = request.data.get('template_id')
    answers = request.data.get('answers', {})
    completed_by_id = request.data.get('completed_by')
    assignment_id = request.data.get('assignment_id')

    # Validate required fields
    if not template_id:
        return DRFResponse(
            {"detail": "Template ID is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get template
    try:
        template = Template.objects.get(id=template_id)
    except Template.DoesNotExist:
        return DRFResponse(
            {"detail": "Template not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get inspector if provided
    inspector = None
    if completed_by_id:
        try:
            inspector = CustomUser.objects.get(id=completed_by_id)
        except CustomUser.DoesNotExist:
            return DRFResponse(
                {"detail": "Inspector not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    # Create inspection record
    inspection = Inspection.objects.create(
        template=template,
        title=f"{template.title} - {timezone.now().strftime('%Y-%m-%d %H:%M')}",
        conducted_by=inspector.email if inspector else request.user.email,
        status='completed'
    )

    # Process answers and create response records
    for question_id, answer_value in answers.items():
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            continue  # Skip if question doesn't exist

        # Create response based on question type
        response = ResponseModel(question=question)

        # Set the appropriate field based on response type
        if question.response_type in ['Text', 'Site', 'Inspection location', 'Person']:
            response.text_response = str(answer_value) if answer_value is not None else None
        elif question.response_type == 'Number':
            try:
                response.number_response = float(answer_value) if answer_value is not None else None
            except (ValueError, TypeError):
                response.text_response = str(answer_value) if answer_value is not None else None
        elif question.response_type in ['Checkbox', 'Yes/No']:
            response.boolean_response = bool(answer_value) if answer_value is not None else None
        elif question.response_type in ['Date & Time', 'Inspection date']:
            # Handle date format conversion if needed
            response.date_response = answer_value
        elif question.response_type in ['Multiple choice', 'Slider']:
            # For multiple choice, store as text for now
            # In a more complete implementation, you would link to QuestionOption
            response.text_response = str(answer_value) if answer_value is not None else None

        # Save the response
        response.save()

        # Link response to inspection
        InspectionResponse.objects.create(
            inspection=inspection,
            response=response
        )

    # If this is part of an assignment, update the assignment status
    if assignment_id:
        try:
            assignment = TemplateAssignment.objects.get(id=assignment_id)
            # Only complete if the current user is the assigned inspector
            if request.user == assignment.inspector:
                assignment.complete()
        except TemplateAssignment.DoesNotExist:
            pass  # Continue even if assignment doesn't exist

    # Return success response
    return DRFResponse({
        "detail": "Inspection submitted successfully",
        "inspection_id": inspection.id
    }, status=status.HTTP_201_CREATED)
