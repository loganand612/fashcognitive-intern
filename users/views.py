from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
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
            return Response({"message": "Login successful", "redirect": "/create_templates"}, status=status.HTTP_200_OK)
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

            return Response({"message": "Template created successfully!"}, status=status.HTTP_201_CREATED)

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


class TemplateAPI(APIView):
    def get(self, request):
        #print("🧭 HIT: templates_api view")
        templates = Template.objects.all()
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
                            question.save()
                        else:
                            print(f"❌ Question with id {question_id} not found in section {section.id}")
                            return Response({"error": f"Question with id {question_id} not found."}, status=400)

                    else:
                        Question.objects.create(
                            section=section,
                            text=question_data.get("text"),
                            response_type=response_type,
                            required=question_data.get("required", False),
                            order=question_data.get("order", 0),
                        )

            return Response({"message": "Template saved successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"❌ Exception Traceback:\n{e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        request.data._mutable = True  # May be required if using QueryDict

        if not pk:
            return Response({"error": "Template ID is required for update"}, status=400)

        request.data["id"] = pk  # So you can reuse your existing logic
        return self.post(request)  # Reuse your existing logic




class TemplateDetailView(RetrieveAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

    def patch(self, request, pk=None):
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
                                    question.save()
                                else:
                                    Question.objects.create(
                                        section=section,
                                        text=question_data.get("text"),
                                        response_type=response_type,
                                        required=question_data.get("required", False),
                                        order=question_data.get("order", 0),
                                    )
                            else:
                                Question.objects.create(
                                    section=section,
                                    text=question_data.get("text"),
                                    response_type=response_type,
                                    required=question_data.get("required", False),
                                    order=question_data.get("order", 0),
                                )
                except Exception as e:
                    print(f"Error processing sections: {e}")
                    return Response({"error": f"Error processing sections: {str(e)}"}, status=400)

            return Response({"message": "Template updated successfully!"}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Exception in PATCH: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardTemplateView(View):
    def get(self, request):
        templates = Template.objects.all()
        return render(request, 'dashboard/templates.html', {'templates': templates})

# Add this new view to check authentication status
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_status(request):
    return Response({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email
        }
    })

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