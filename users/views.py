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
from .models import Template, Section, Question, Inspection  # Added Inspection import
from rest_framework.parsers import MultiPartParser
import json
from django.shortcuts import get_object_or_404, render
from rest_framework.generics import RetrieveAPIView
from django.views import View
import base64
from django.core.files.base import ContentFile


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
        data = request.data  # DRF automatically parses JSON
        email = data.get("email")
        password = data.get("password")

        # Ensure email-based authentication works
        user = authenticate(username=email, password=password)

        if user is not None:
            login(request, user)
            return Response({"message": "Login successful", "redirect": "/create_templates"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
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
                        response_type=question_data.get("responseType"),  # Note: This might need to be "response_type" for consistency
                        required=question_data.get("required", False),
                        order=question_data.get("order", 0),
                    )

            return Response({"message": "Template created successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(login_required, name='dispatch')  # Requires login
class DashboardAPI(APIView):
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
        templates = Template.objects.all()
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data)


class TemplateCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            title = request.data.get("title")
            description = request.data.get("description")
            logo_base64 = request.data.get("logo")
            sections_data = request.data.get("sections")
            template_id = request.data.get("id")  # For updating an existing template

            if not title:
                return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Decode logo (if present)
            logo_file = None
            if logo_base64:
                format, imgstr = logo_base64.split(';base64,')
                ext = format.split('/')[-1]
                logo_file = ContentFile(base64.b64decode(imgstr), name=f"logo.{ext}")

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
                )

            # Process sections and questions
            for section_data in sections:
                section_id = section_data.get("id")
                section = None

                if section_id:
                    try:
                        section = Section.objects.get(id=section_id, template=template)
                        section.title = section_data.get("title", section.title)
                        section.description = section_data.get("description", section.description)
                        section.order = section_data.get("order", section.order)
                        section.is_collapsed = section_data.get("isCollapsed", section.is_collapsed)
                        section.save()
                    except Section.DoesNotExist:
                        # If the section ID doesn't exist, create a new section
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
                    response_type = question_data.get("response_type") or question_data.get("responseType")
                    if not response_type:
                        raise ValueError(f"response_type is required for question: {question_data}")

                    question_id = question_data.get("id")
                    if question_id:
                        question = Question.objects.filter(id=question_id, section=section).first()
                        if question:
                            question.text = question_data.get("text", question.text)
                            question.response_type = response_type
                            question.required = question_data.get("required", question.required)
                            question.order = question_data.get("order", question.order)
                            question.save()
                        else:
                            return Response({"error": f"Question with id {question_id} not found."}, status=status.HTTP_400_BAD_REQUEST)
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
            print(f"Error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TemplateDetailView(RetrieveAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer


class DashboardTemplateView(View):
    def get(self, request):
        templates = Template.objects.all()
        return render(request, 'dashboard/templates.html', {'templates': templates})

