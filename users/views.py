from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from .serializers import UserRegistrationSerializer, TemplateSerializer
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from .models import Template, Section, Question, Inspection
from rest_framework.parsers import MultiPartParser
import json
from django.shortcuts import get_object_or_404, render
from rest_framework.generics import RetrieveAPIView
from django.views import View
import base64
from rest_framework.permissions import IsAuthenticated
from django.core.files.base import ContentFile
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from rest_framework.authentication import SessionAuthentication
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.authentication import BasicAuthentication
from django.middleware.csrf import CsrfViewMiddleware
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

class RegisterUserView(APIView):
    permission_classes = [AllowAny]  # Allow anyone to register

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    try:
        data = request.data
        email = data.get("email")
        password = data.get("password")

        print("Request Headers:", request.headers)
        print("Cookies:", request.COOKIES)
        user = authenticate(username=email, password=password)

        if user is not None:
            login(request, user)
            print(f"✅ Login successful for user: {user.email}")  # <- Print Email
            print(f"✅ User ID: {user.id}")  # <- Print ID
            print(f"✅ User Role: {user.user_role}")  # <- Print Role
            return Response({
                "message": "Login successful",
                "redirect": "/create_templates",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "user_role": user.user_role
                }
            }, status=status.HTTP_200_OK)
        else:
            print(f"❌ Login failed for email: {email}")  # <- Print failure case
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        print(f"❗ Error during login: {str(e)}")  # <- Print Exception
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)




@api_view(["GET", "POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser])
def templates_api(request):
    if request.method == "GET":
        templates = Template.objects.all()
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        try:
            title = request.data.get("title")
            description = request.data.get("description")
            logo_file = request.FILES.get("logo")
            logo_data = logo_file.read() if logo_file else None

            sections_data = request.data.get("sections")

            if not title:
                return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                sections = json.loads(sections_data)
            except Exception as e:
                return Response({"error": "Invalid JSON in sections"}, status=status.HTTP_400_BAD_REQUEST)

            template = Template.objects.create(
                title=title,
                description=description,
                logo=logo_data,
                user=request.user,
            )

            for section_data in sections:
                section = Section.objects.create(
                    template=template,
                    title=section_data.get("title"),
                    description=section_data.get("description", ""),
                    order=section_data.get("order", 0),
                    is_collapsed=section_data.get("isCollapsed", False),
                )

                for question_data in section_data.get("questions", []):
                    Question.objects.create(
                        section=section,
                        text=question_data.get("text"),
                        response_type = question_data.get("response_type") or question_data.get("responseType"),
                        required=question_data.get("required", False),
                        order=question_data.get("order", 0),
                    )

            return Response({
                "message": "Template created successfully!",
                "id": template.id,
                "template": {
                    "id": template.id,
                    "title": template.title,
                    "description": template.description
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Internal Server Error: {e}")  # Useful for server logs
            return Response({"error": "Something went wrong. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DashboardAPI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        templates_created = Template.objects.count()
        inspections_completed = Inspection.objects.filter(status="Completed").count()

        data = {
            "templates_created": templates_created,
            "inspections_completed": f"{inspections_completed}/25",
            "open_issues": 3,  # Example, this can be dynamic too
            "recent_activity": [
                {"id": 1, "title": "Safety Inspection", "type": "Template", "date": "2024-03-01", "status": "Completed"},
                {"id": 2, "title": "Monthly Equipment Check", "type": "Inspection", "date": "2024-02-28", "status": "In Progress"}
            ]
        }
        return Response(data)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication that doesn't enforce CSRF for GET requests
    """
    def enforce_csrf(self, request):
        # Skip CSRF check for GET requests
        if request.method == 'GET':
            return
        return super().enforce_csrf(request)

class TemplateAPI(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only return templates that the user has access to
        templates = Template.objects.filter(user=request.user)
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data)


from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

class TemplateCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("User:", request.user)
        print(f"X-CSRFToken: {request.META.get('HTTP_X_CSRFTOKEN')}")
        print(f"sessionid: {request.COOKIES.get('sessionid')}")
        if not request.user.is_authenticated:
            return Response({"error": "User is not authenticated"}, status=status.HTTP_403_FORBIDDEN)

        # Only admin users can create templates
        if request.user.user_role == 'inspector':
            return Response(
                {"error": "Only admin users can create templates."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            title = request.data.get("title")
            description = request.data.get("description")
            logo = request.FILES.get("logo") or request.data.get("logo")
            logo_file = None
            sections_data = request.data.get("sections")
            if isinstance(sections_data, list):
                sections_data = sections_data[0]

            template_id = request.data.get("id")  # For updating an existing template

            if not title:
                return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)

            if isinstance(logo, str) and 'base64,' in logo:
                try:
                    format, imgstr = logo.split(';base64,')
                    ext = format.split('/')[-1]
                    logo_file = ContentFile(base64.b64decode(imgstr), name=f"logo.{ext}")
                except Exception as e:
                    print("Error decoding base64 logo:", e)
            # If InMemoryUploadedFile
            elif hasattr(logo, 'read'):
                logo_file = logo

            # Parse sections
            try:
                sections = json.loads(sections_data) if isinstance(sections_data, str) else sections_data
            except Exception:
                return Response({"error": "Invalid JSON in sections"}, status=status.HTTP_400_BAD_REQUEST)

            # Handle existing template or create new one
            if template_id:
                template = get_object_or_404(Template, id=template_id)
                template.title = title
                template.description = description
                if logo_file:
                    template.logo = logo_file
                template.save()
            else:
                template = Template.objects.create(
                        title=title,
                        description=description,
                        logo=logo_file,
                        user=request.user,
                    )

            # Process sections and questions
            for section_data in sections:
                section_id = section_data.get("id")
                section = None

                if section_id and str(section_id).isdigit():
                    try:
                        section = Section.objects.get(id=section_id, template=template)
                        section.title = section_data.get("title", section.title)
                        section.description = section_data.get("description", section.description)
                        section.order = section_data.get("order", section.order)
                        section.is_collapsed = section_data.get("isCollapsed", section.is_collapsed)
                        section.save()
                    except Section.DoesNotExist:
                        print(f"Section ID {section_id} not found; creating new section.")
                        section = Section.objects.create(
                            template=template,
                            title=section_data.get("title"),
                            description=section_data.get("description", ""),
                            order=section_data.get("order", 0),
                            is_collapsed=section_data.get("isCollapsed", False),
                        )

                else:
                    # If no section ID is provided, create a new section
                    section = Section.objects.create(
                        template=template,
                        title=section_data.get("title"),
                        description=section_data.get("description", ""),
                        order=section_data.get("order", 0),
                        is_collapsed=section_data.get("isCollapsed", False),
                    )


                # Create/update questions for this section
                for question_data in section_data.get("questions", []):
                    # Check for response_type or responseType (handle both for compatibility)
                    print(f"🔍 Processing question: {question_data}")
                    print(f"🔍 Logic rules in question_data: {question_data.get('logicRules')}")
                    response_type = question_data.get("response_type") or question_data.get("responseType")
                    if not response_type:
                        print(f"❌ Missing response_type for question: {question_data}")
                        return Response({"error": f"response_type is required for question: {question_data}"}, status=400)

                    question_id = question_data.get("id")
                    if question_id and str(question_id).isdigit():
                        question = Question.objects.filter(id=question_id, section=section).first()
                        if question:
                            question.text = question_data.get("text", question.text)
                            question.response_type = response_type
                            question.required = question_data.get("required", question.required)
                            question.order = question_data.get("order", question.order)
                            # Handle both camelCase and snake_case for logic_rules
                            logic_rules = question_data.get("logic_rules") or question_data.get("logicRules")
                            if logic_rules is not None:
                                question.logic_rules = logic_rules
                            question.flagged = question_data.get("flagged", question.flagged)
                            question.multiple_selection = question_data.get("multipleSelection", question.multiple_selection)
                            print(f"🔍 Saving question with logic_rules: {question.logic_rules}")
                            question.save()
                        else:
                            print(f"❌ Question with id {question_id} not found in section {section.id}")
                            return Response({"error": f"Question with id {question_id} not found."}, status=400)

                    else:
                        # Handle both camelCase and snake_case for logic_rules
                        logic_rules_data = question_data.get("logic_rules") or question_data.get("logicRules")
                        print(f"🔍 Creating new question with logic_rules: {logic_rules_data}")
                        question = Question.objects.create(
                            section=section,
                            text=question_data.get("text"),
                            response_type=response_type,
                            required=question_data.get("required", False),
                            order=question_data.get("order", 0),
                            logic_rules=logic_rules_data,
                            flagged=question_data.get("flagged", False),
                            multiple_selection=question_data.get("multipleSelection", False),
                        )
                        print(f"🔍 Created question with ID {question.id}, logic_rules: {question.logic_rules}")

                        # Create options for multiple choice questions
                        for o_index, option in enumerate(question_data.get("options", [])):
                            QuestionOption.objects.create(
                                question=question,
                                text=option,
                                order=o_index
                            )

            return Response({
                "message": "Template saved successfully!",
                "id": template.id,
                "template": {
                    "id": template.id,
                    "title": template.title,
                    "description": template.description
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"❌ Exception Traceback:\n{e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        # Only admin users can update templates
        if request.user.user_role == 'inspector':
            return Response(
                {"error": "Only admin users can update templates."},
                status=status.HTTP_403_FORBIDDEN
            )

        request.data._mutable = True  # May be required if using QueryDict

        if not pk:
            return Response({"error": "Template ID is required for update"}, status=400)

        request.data["id"] = pk  # So you can reuse your existing logic
        return self.post(request)  # Reuse your existing logic




class TemplateDetailView(RetrieveAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Check if user is inspector and if they have access to this template
        template_id = kwargs.get('pk')
        print(f"🔍 TemplateDetailView.get: template_id={template_id}, user={request.user}, user_role={getattr(request.user, 'user_role', 'unknown')}")

        if request.user.user_role == 'inspector':
            from .models import TemplateAssignment
            # Check if this template is assigned to the inspector (including completed assignments for viewing results)
            has_assignment = TemplateAssignment.objects.filter(
                template_id=template_id,
                inspector=request.user,
                status__in=['assigned', 'in_progress', 'completed']
            ).exists()

            if not has_assignment:
                # Check if they have any assignment for this template (even revoked/expired) for better error message
                any_assignment = TemplateAssignment.objects.filter(
                    template_id=template_id,
                    inspector=request.user
                ).exists()

                if any_assignment:
                    return Response(
                        {"detail": "Your access to this template has expired or been revoked. Please contact your administrator."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                else:
                    return Response(
                        {"detail": "You do not have access to this template. Please contact your administrator."},
                        status=status.HTTP_403_FORBIDDEN
                    )
        # Admin users can access any template
        elif request.user.user_role == 'admin':
            # Admin users have full access to all templates
            pass

        response = super().get(request, *args, **kwargs)
        print(f"🔍 Template API Response for ID {kwargs.get('pk')}:")
        print(f"🔍 Response data: {response.data}")

        # Debug logic rules specifically
        if 'sections' in response.data:
            for section in response.data['sections']:
                if 'questions' in section:
                    for question in section['questions']:
                        if question.get('logic_rules'):
                            print(f"🔍 Question '{question.get('text')}' has logic_rules: {question.get('logic_rules')}")
                        else:
                            print(f"🔍 Question '{question.get('text')}' has NO logic_rules")

        return response

    def patch(self, request, pk=None):
        # Only admin users can update templates
        if request.user.user_role == 'inspector':
            return Response(
                {"error": "Only admin users can update templates."},
                status=status.HTTP_403_FORBIDDEN
            )

        template = self.get_object()

        try:
            title = request.data.get("title")
            description = request.data.get("description")
            logo = request.FILES.get("logo") or request.data.get("logo")
            logo_file = None
            sections_data = request.data.get("sections")

            # Update basic template fields
            if title:
                template.title = title
            if description:
                template.description = description

            # Handle logo if provided
            if isinstance(logo, str) and 'base64,' in logo:
                try:
                    format, imgstr = logo.split(';base64,')
                    ext = format.split('/')[-1]
                    logo_file = ContentFile(base64.b64decode(imgstr), name=f"logo.{ext}")
                    template.logo = logo_file
                except Exception as e:
                    print("Error decoding base64 logo:", e)
            elif hasattr(logo, 'read'):
                template.logo = logo

            template.save()

            # Process sections if provided
            if sections_data:
                try:
                    sections = json.loads(sections_data) if isinstance(sections_data, str) else sections_data

                    # Process sections and questions
                    for section_data in sections:
                        section_id = section_data.get("id")
                        section = None

                        if section_id and str(section_id).isdigit():
                            try:
                                section = Section.objects.get(id=section_id, template=template)
                                section.title = section_data.get("title", section.title)
                                section.description = section_data.get("description", section.description)
                                section.order = section_data.get("order", section.order)
                                section.is_collapsed = section_data.get("isCollapsed", section.is_collapsed)
                                section.save()
                            except Section.DoesNotExist:
                                section = Section.objects.create(
                                    template=template,
                                    title=section_data.get("title"),
                                    description=section_data.get("description", ""),
                                    order=section_data.get("order", 0),
                                    is_collapsed=section_data.get("isCollapsed", False),
                                )
                        else:
                            # If no section ID is provided, create a new section
                            section = Section.objects.create(
                                template=template,
                                title=section_data.get("title"),
                                description=section_data.get("description", ""),
                                order=section_data.get("order", 0),
                                is_collapsed=section_data.get("isCollapsed", False),
                            )

                        # Create/update questions for this section
                        for question_data in section_data.get("questions", []):
                            response_type = question_data.get("response_type") or question_data.get("responseType")
                            if not response_type:
                                return Response({"error": f"response_type is required for question"}, status=400)

                            question_id = question_data.get("id")
                            if question_id and str(question_id).isdigit():
                                question = Question.objects.filter(id=question_id, section=section).first()
                                if question:
                                    question.text = question_data.get("text", question.text)
                                    question.response_type = response_type
                                    question.required = question_data.get("required", question.required)
                                    question.order = question_data.get("order", question.order)
                                    # Handle both camelCase and snake_case for logic_rules
                                    logic_rules = question_data.get("logic_rules") or question_data.get("logicRules")
                                    if logic_rules is not None:
                                        question.logic_rules = logic_rules
                                    question.flagged = question_data.get("flagged", question.flagged)
                                    question.multiple_selection = question_data.get("multipleSelection", question.multiple_selection)
                                    question.save()

                                    # Update options for existing question
                                    question.options.all().delete()  # Remove existing options
                                    for o_index, option in enumerate(question_data.get("options", [])):
                                        QuestionOption.objects.create(
                                            question=question,
                                            text=option,
                                            order=o_index
                                        )
                                else:
                                    question = Question.objects.create(
                                        section=section,
                                        text=question_data.get("text"),
                                        response_type=response_type,
                                        required=question_data.get("required", False),
                                        order=question_data.get("order", 0),
                                        logic_rules=question_data.get("logic_rules") or question_data.get("logicRules"),
                                        flagged=question_data.get("flagged", False),
                                        multiple_selection=question_data.get("multipleSelection", False),
                                    )

                                    # Create options for new question
                                    for o_index, option in enumerate(question_data.get("options", [])):
                                        QuestionOption.objects.create(
                                            question=question,
                                            text=option,
                                            order=o_index
                                        )
                            else:
                                question = Question.objects.create(
                                    section=section,
                                    text=question_data.get("text"),
                                    response_type=response_type,
                                    required=question_data.get("required", False),
                                    order=question_data.get("order", 0),
                                    logic_rules=question_data.get("logic_rules") or question_data.get("logicRules"),
                                    flagged=question_data.get("flagged", False),
                                    multiple_selection=question_data.get("multipleSelection", False),
                                )

                                # Create options for new question
                                for o_index, option in enumerate(question_data.get("options", [])):
                                    QuestionOption.objects.create(
                                        question=question,
                                        text=option,
                                        order=o_index
                                    )
                except Exception as e:
                    print(f"Error processing sections: {e}")
                    return Response({"error": f"Error processing sections: {str(e)}"}, status=400)

            return Response({
                "message": "Template updated successfully!",
                "id": template.id,
                "template": {
                    "id": template.id,
                    "title": template.title,
                    "description": template.description
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Exception in PATCH: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardTemplateView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return templates for the dashboard - only user's templates
        templates = Template.objects.filter(user=request.user)
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data)

# Add this new view to check authentication status
class AuthStatusView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [AllowAny]  # Allow any user to check auth status

    def get(self, request):
        print(f"🔍 AuthStatusView: User authenticated: {request.user.is_authenticated}")
        print(f"🔍 AuthStatusView: User: {request.user}")
        print(f"🔍 AuthStatusView: Session key: {request.session.session_key}")
        print(f"🔍 AuthStatusView: Cookies: {request.COOKIES}")

        if request.user.is_authenticated:
            return Response({
                "authenticated": True,
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "user_role": request.user.user_role
                }
            })
        else:
            return Response({
                "authenticated": False,
                "user": None
            })

# Keep the function-based view for backward compatibility
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_status(request):
    return Response({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "user_role": request.user.user_role
        }
    })

# Debug auth status endpoint that doesn't require authentication
@api_view(["GET"])
@permission_classes([AllowAny])
def debug_auth_status(request):
    print(f"🔍 DebugAuthStatus: User authenticated: {request.user.is_authenticated}")
    print(f"🔍 DebugAuthStatus: User: {request.user}")
    print(f"🔍 DebugAuthStatus: Session key: {request.session.session_key}")
    print(f"🔍 DebugAuthStatus: Cookies: {request.COOKIES}")

    if request.user.is_authenticated:
        return Response({
            "authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "user_role": request.user.user_role
            }
        })
    else:
        return Response({
            "authenticated": False,
            "user": None
        })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return the current user's information"""
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
        "first_name": request.user.first_name,
        "last_name": request.user.last_name,
        "user_role": request.user.user_role
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def debug_template_access(request):
    """Debug endpoint to check template access for current user"""
    template_id = request.GET.get('template_id', 115)

    from .models import TemplateAssignment, Template

    try:
        template = Template.objects.get(id=template_id)
        print(f"🔍 Template {template_id} exists: {template.title}")

        # Check assignments for this user
        assignments = TemplateAssignment.objects.filter(
            template_id=template_id,
            inspector=request.user
        )

        assignment_data = []
        for assignment in assignments:
            assignment_data.append({
                'id': assignment.id,
                'status': assignment.status,
                'assigned_at': assignment.assigned_at,
                'inspector': assignment.inspector.email
            })

        return Response({
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "user_role": request.user.user_role
            },
            "template": {
                "id": template.id,
                "title": template.title,
                "owner": template.user.email
            },
            "assignments": assignment_data,
            "has_active_assignment": TemplateAssignment.objects.filter(
                template_id=template_id,
                inspector=request.user,
                status__in=['assigned', 'in_progress', 'completed']
            ).exists()
        })

    except Template.DoesNotExist:
        return Response({
            "error": f"Template {template_id} does not exist"
        }, status=404)

# Add logout view
@api_view(["POST"])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)
    return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_templates(request):
    user = request.user
    templates = Template.objects.filter(user=user)
    serializer = TemplateSerializer(templates, many=True)
    return Response(serializer.data)

@ensure_csrf_cookie
def get_csrf_token(request):
    csrf_token = get_token(request)
    print("Generated CSRF Token:", csrf_token)

    response = JsonResponse({"csrfToken": csrf_token})
    # Ensure the CSRF cookie is set with the correct settings
    response.set_cookie(
        'csrftoken',
        csrf_token,
        max_age=3600,  # 1 hour
        path='/',
        secure=False,  # Set to True in production with HTTPS
        httponly=False,  # CSRF token needs to be accessible via JavaScript
        samesite='Lax'  # Helps prevent CSRF in modern browsers
    )
    return response


from .models import Template, Section, Question, QuestionOption

class GarmentTemplateCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only admin users can create templates
        if request.user.user_role == 'inspector':
            return Response(
                {"error": "Only admin users can create templates."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if this is a publish request
        if request.data.get("publish") == "true":
            return self.publish_template(request)

        try:
            title = request.data.get("title")
            description = request.data.get("description")
            logo = request.FILES.get("logo") or request.data.get("logo")
            template_id = request.data.get("id")
            sections_data = request.data.get("sections")

            if not title:
                return Response({"error": "Title is required"}, status=400)

            # Handle logo base64
            logo_file = None
            if isinstance(logo, str) and 'base64,' in logo:
                try:
                    format, imgstr = logo.split(';base64,')
                    ext = format.split('/')[-1]
                    logo_file = ContentFile(base64.b64decode(imgstr), name=f"logo.{ext}")
                except Exception as e:
                    print("Logo decode error:", e)
            elif hasattr(logo, 'read'):
                logo_file = logo

            # Parse section JSON
            sections = json.loads(sections_data) if isinstance(sections_data, str) else sections_data

            # Create or update template
            if template_id:
                template = get_object_or_404(Template, id=template_id)
                template.title = title
                template.description = description
                if logo_file:
                    template.logo = logo_file
                template.template_type = 'garment'
                template.save()
            else:
                template = Template.objects.create(
                    user=request.user,
                    title=title,
                    description=description,
                    logo=logo_file,
                    template_type='garment'
                )

            # Loop through sections
            for index, section_data in enumerate(sections):
                section_type = section_data.get("type", "standard")
                content = section_data.get("content", {})
                aql = content.get("aqlSettings", {})
                section = Section.objects.create(
                    template=template,
                    title=section_data.get("title"),
                    description=content.get("description", ""),
                    order=index,
                    is_collapsed=section_data.get("isCollapsed", False),
                    is_garment_section=(section_type == "garmentDetails"),
                    aql_level=aql.get("aqlLevel"),
                    inspection_level=aql.get("inspectionLevel"),
                    sampling_plan=aql.get("samplingPlan"),
                    severity=aql.get("severity"),
                    sizes=content.get("sizes", []),
                    colors=content.get("colors", []),
                    default_defects=content.get("defaultDefects", []),
                    include_carton_offered=content.get("includeCartonOffered", True),
                    include_carton_inspected=content.get("includeCartonInspected", True),
                )

                # If standard, process questions
                if section_type == "standard":
                    for q_index, question_data in enumerate(content.get("questions", [])):
                        question = Question.objects.create(
                            section=section,
                            text=question_data.get("text"),
                            response_type=question_data.get("responseType"),
                            required=question_data.get("required", False),
                            order=q_index,
                            logic_rules=question_data.get("logic_rules") or question_data.get("logicRules"),
                            flagged=question_data.get("flagged", False),
                            multiple_selection=question_data.get("multipleSelection", False),
                        )
                        for o_index, option in enumerate(question_data.get("options", [])):
                            QuestionOption.objects.create(
                                question=question,
                                text=option,
                                order=o_index
                            )

            return Response({
                "message": "Garment template saved successfully",
                "id": template.id
            }, status=201)

        except Exception as e:
            print("❌ Error:", e)
            return Response({"error": str(e)}, status=400)

    def put(self, request, pk=None):
        if not pk:
            return Response({"error": "Template ID is required for update"}, status=400)
        request.data._mutable = True
        request.data["id"] = pk
        return self.post(request)

    def publish_template(self, request):
        try:
            template_id = request.data.get("template_id")
            if not template_id:
                return Response({"error": "Template ID is required for publishing"}, status=400)

            # Check if the template exists by frontend_id
            template = None
            try:
                # First try to find by numeric ID
                if str(template_id).isdigit():
                    template = Template.objects.filter(id=template_id).first()

                # If not found, try to find by title (as a fallback)
                if not template:
                    title = request.data.get("title")
                    if title:
                        template = Template.objects.filter(title=title, user=request.user).order_by('-created_at').first()

                if not template:
                    return Response({"error": f"Template with ID {template_id} not found"}, status=404)
            except Exception as e:
                print(f"Error finding template: {e}")
                return Response({"error": f"Error finding template: {str(e)}"}, status=400)

            # Update the template with publish date
            from django.utils import timezone
            template.last_published = timezone.now()
            template.save()

            return Response({"message": "Template published successfully", "template_id": template.id}, status=200)
        except Exception as e:
            print("❌ Error publishing template:", e)
            return Response({"error": str(e)}, status=400)