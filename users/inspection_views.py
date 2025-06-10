from rest_framework.views import APIView
from rest_framework.response import Response as DRFResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.utils import timezone
import json

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
    conditional_answers = request.data.get('conditional_answers', {})
    conditional_evidence = request.data.get('conditional_evidence', {})
    display_messages = request.data.get('display_messages', {})  # Add display messages
    garment_data = request.data.get('garment_data', {})
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

    # Process conditional answers
    for conditional_id, answer_value in conditional_answers.items():
        # Create a pseudo-question for conditional answers
        # We'll store them as text responses with the conditional ID as the question text
        try:
            # Try to find the original question from the conditional ID
            # Format is usually: {question_id}_{rule_id}_conditional
            parts = conditional_id.split('_')
            if len(parts) >= 3 and parts[-1] == 'conditional':
                original_question_id = parts[0]
                rule_id = parts[1]

                try:
                    original_question = Question.objects.get(id=original_question_id)
                    # Create a response for the conditional answer
                    response = ResponseModel(question=original_question)
                    response.text_response = f"CONDITIONAL_{conditional_id}:{answer_value}"
                    response.save()

                    # Link response to inspection
                    InspectionResponse.objects.create(
                        inspection=inspection,
                        response=response
                    )
                except Question.DoesNotExist:
                    continue
        except:
            continue

    # Process conditional evidence
    for evidence_id, evidence_value in conditional_evidence.items():
        # Similar to conditional answers, but mark as evidence
        try:
            # Format is usually: {question_id}_{rule_id}
            parts = evidence_id.split('_')
            if len(parts) >= 2:
                original_question_id = parts[0]
                rule_id = parts[1]

                try:
                    original_question = Question.objects.get(id=original_question_id)
                    # Create a response for the evidence
                    response = ResponseModel(question=original_question)
                    response.text_response = f"EVIDENCE_{evidence_id}:{evidence_value}"
                    response.save()

                    # Link response to inspection
                    InspectionResponse.objects.create(
                        inspection=inspection,
                        response=response
                    )
                except Question.DoesNotExist:
                    continue
        except:
            continue

    # Process display messages
    for question_id, message_text in display_messages.items():
        try:
            question = Question.objects.get(id=question_id)
            # Create a response for the display message
            response = ResponseModel(question=question)
            response.text_response = f"DISPLAY_MESSAGE_{question_id}:{message_text}"
            response.save()

            # Link response to inspection
            InspectionResponse.objects.create(
                inspection=inspection,
                response=response
            )
        except Question.DoesNotExist:
            continue
        except:
            continue

    # Process garment data if provided
    if garment_data:
        try:
            print(f"Received garment data: {garment_data}")
            # Store garment data directly in the inspection model
            inspection.garment_data = garment_data
            inspection.save()
            print(f"Successfully stored garment data for inspection {inspection.id}")
        except Exception as e:
            print(f"Error storing garment data: {e}")

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_inspection(request, inspection_id):
    """
    API endpoint to retrieve inspection data for report generation.
    Returns the inspection with all associated responses and template data.
    """
    try:
        print(f"Getting inspection with ID: {inspection_id}")

        # Get the inspection
        inspection = get_object_or_404(Inspection, id=inspection_id)
        print(f"Found inspection: {inspection.title}")

        # Get the template
        template = inspection.template

        # Get all responses for this inspection
        responses = InspectionResponse.objects.filter(inspection=inspection)

        # Organize responses by question ID
        answers = {}
        conditional_answers = {}
        conditional_evidence = {}
        display_messages = {}  # Add display messages

        # Get garment data directly from inspection
        garment_data = inspection.garment_data or {}

        for response in responses:
            question_id = str(response.response.question.id)

            # Get the appropriate response value based on the question type
            value = None
            if response.response.text_response is not None:
                value = response.response.text_response
            elif response.response.number_response is not None:
                value = response.response.number_response
            elif response.response.boolean_response is not None:
                value = response.response.boolean_response
            elif response.response.date_response is not None:
                value = response.response.date_response.isoformat()
            elif response.response.choice_response is not None:
                value = response.response.choice_response.text

            # Parse JSON if it's a string that looks like JSON
            if isinstance(value, str):
                try:
                    parsed_value = json.loads(value)
                    value = parsed_value
                except (json.JSONDecodeError, TypeError):
                    pass  # Keep as string if not valid JSON

            # Categorize the response
            if isinstance(value, str) and value.startswith('CONDITIONAL_'):
                # Parse conditional answer: CONDITIONAL_{conditional_id}:{answer_value}
                try:
                    parts = value.split(':', 1)
                    if len(parts) == 2:
                        conditional_id = parts[0].replace('CONDITIONAL_', '')
                        conditional_value = parts[1]
                        conditional_answers[conditional_id] = conditional_value
                except:
                    pass
            elif isinstance(value, str) and value.startswith('EVIDENCE_'):
                # Parse evidence: EVIDENCE_{evidence_id}:{evidence_value}
                try:
                    parts = value.split(':', 1)
                    if len(parts) == 2:
                        evidence_id = parts[0].replace('EVIDENCE_', '')
                        evidence_value = parts[1]
                        conditional_evidence[evidence_id] = evidence_value
                except:
                    pass
            elif isinstance(value, str) and value.startswith('DISPLAY_MESSAGE_'):
                # Parse display message: DISPLAY_MESSAGE_{question_id}:{message_text}
                try:
                    parts = value.split(':', 1)
                    if len(parts) == 2:
                        message_question_id = parts[0].replace('DISPLAY_MESSAGE_', '')
                        message_text = parts[1]
                        display_messages[message_question_id] = message_text
                except:
                    pass
            else:
                answers[question_id] = value

        # Try to get conditional answers and evidence from the inspection's metadata
        # This is a workaround since conditional answers might be stored differently
        try:
            # Check if there's a way to get the original submission data
            # For now, we'll look for any stored conditional data in the inspection
            pass
        except:
            pass

        # Serialize template data
        template_data = {
            'id': template.id,
            'title': template.title,
            'description': template.description,
            'logo': template.logo.url if template.logo else None,
            'sections': []
        }

        # Add sections and questions
        for section in template.sections.all():
            section_data = {
                'id': section.id,
                'title': section.title,
                'description': section.description,
                'type': 'garmentDetails' if section.is_garment_section else 'standard',
                'questions': []
            }

            # Add garment content if it's a garment section
            if section.is_garment_section:
                section_data['content'] = {
                    'aqlSettings': {
                        'aqlLevel': section.aql_level or '2.5',
                        'inspectionLevel': section.inspection_level or 'II',
                        'samplingPlan': section.sampling_plan or 'Single',
                        'severity': section.severity or 'Normal'
                    },
                    'sizes': section.sizes or [],
                    'colors': section.colors or [],
                    'includeCartonOffered': section.include_carton_offered,
                    'includeCartonInspected': section.include_carton_inspected,
                    'defaultDefects': section.default_defects or []
                }

            # Add questions
            for question in section.questions.all():
                # Get question options
                options = [option.text for option in question.options.all()]

                question_data = {
                    'id': question.id,
                    'text': question.text,
                    'responseType': question.response_type,
                    'required': question.required,
                    'options': options,
                    'value': answers.get(str(question.id)),
                    'flagged': question.flagged
                }

                # Add logic rules if they exist
                if question.logic_rules:
                    try:
                        question_data['logicRules'] = json.loads(question.logic_rules) if isinstance(question.logic_rules, str) else question.logic_rules
                    except (json.JSONDecodeError, TypeError):
                        question_data['logicRules'] = []

                section_data['questions'].append(question_data)

            template_data['sections'].append(section_data)

        # Prepare the response data
        print(f"Final garment_data being returned: {garment_data}")
        response_data = {
            'inspection': {
                'id': inspection.id,
                'title': inspection.title,
                'conducted_by': inspection.conducted_by,
                'conducted_at': inspection.conducted_at.isoformat(),
                'location': inspection.location,
                'site': inspection.site,
                'status': inspection.status,
                'created_at': inspection.created_at.isoformat(),
                'updated_at': inspection.updated_at.isoformat()
            },
            'template': template_data,
            'answers': answers,
            'conditional_answers': conditional_answers,
            'conditional_evidence': conditional_evidence,
            'display_messages': display_messages,  # Add display messages to response
            'garment_data': garment_data
        }

        return DRFResponse(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return DRFResponse({
            "detail": f"Error retrieving inspection: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_template_inspections(request, template_id):
    """
    API endpoint to retrieve all inspections for a specific template.
    Returns a list of inspections with basic info for the template creator to view results.
    """
    try:
        print(f"Getting inspections for template ID: {template_id}")

        # Get the template
        template = get_object_or_404(Template, id=template_id)
        print(f"Found template: {template.title}")

        # Check if user has permission to view this template's results
        # Template creator or admin can view results
        if request.user.user_role != 'admin' and template.created_by != request.user:
            return DRFResponse({
                "detail": "You do not have permission to view results for this template."
            }, status=status.HTTP_403_FORBIDDEN)

        # Get all inspections for this template
        inspections = Inspection.objects.filter(template=template).order_by('-created_at')

        # Prepare inspection data
        inspection_list = []
        for inspection in inspections:
            inspection_data = {
                'id': inspection.id,
                'title': inspection.title,
                'conducted_by': inspection.conducted_by,
                'conducted_at': inspection.conducted_at.isoformat(),
                'location': inspection.location,
                'site': inspection.site,
                'status': inspection.status,
                'created_at': inspection.created_at.isoformat(),
                'updated_at': inspection.updated_at.isoformat(),
                'has_garment_data': bool(inspection.garment_data)
            }
            inspection_list.append(inspection_data)

        response_data = {
            'template': {
                'id': template.id,
                'title': template.title,
                'description': template.description,
                'created_by': template.created_by.username if template.created_by else None,
                'created_at': template.created_at.isoformat(),
            },
            'inspections': inspection_list,
            'total_inspections': len(inspection_list)
        }

        return DRFResponse(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return DRFResponse({
            "detail": f"Error retrieving template inspections: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assignment_inspection(request, assignment_id):
    """
    API endpoint to get the inspection ID for a completed assignment.
    This allows linking from schedule page to the specific inspection report.
    """
    try:
        print(f"Getting inspection for assignment ID: {assignment_id}")

        # Get the assignment
        assignment = get_object_or_404(TemplateAssignment, id=assignment_id)

        # Check if user has permission to view this assignment
        if request.user.user_role != 'admin' and assignment.inspector != request.user:
            return DRFResponse({
                "detail": "You do not have permission to view this assignment."
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if assignment is completed
        if assignment.status != 'completed':
            return DRFResponse({
                "detail": "This assignment has not been completed yet."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Find the inspection for this assignment
        # Look for inspections created for this template by this inspector around the completion time
        inspection = Inspection.objects.filter(
            template=assignment.template,
            conducted_by=assignment.inspector.email,
            created_at__gte=assignment.completed_at - timezone.timedelta(hours=1),
            created_at__lte=assignment.completed_at + timezone.timedelta(hours=1)
        ).first()

        if not inspection:
            return DRFResponse({
                "detail": "No inspection found for this assignment."
            }, status=status.HTTP_404_NOT_FOUND)

        response_data = {
            'assignment_id': assignment.id,
            'inspection_id': inspection.id,
            'inspection_title': inspection.title,
            'template_title': assignment.template.title
        }

        return DRFResponse(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return DRFResponse({
            "detail": f"Error retrieving assignment inspection: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
