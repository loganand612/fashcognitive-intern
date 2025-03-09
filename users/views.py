from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from .serializers import UserRegistrationSerializer, TemplateSerializer
from .models import Template
import json
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from .models import Template, Section, Question


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

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Template
from .serializers import TemplateSerializer


@api_view(["GET", "POST"])
def templates_api(request):
    if request.method == "GET":
        templates = Template.objects.all()
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        data = request.data
        title = data.get("title")
        description = data.get("description")
        sections_data = data.get("sections", [])

        # Create Template
        template = Template.objects.create(title=title, description=description)

        # Loop through Sections and save them
        for section_data in sections_data:
            section = Section.objects.create(
                template=template,
                title=section_data.get("title"),
                description=section_data.get("description", ""),
                order=section_data.get("order", 0),
                is_collapsed=section_data.get("isCollapsed", False),
            )

            # Save Questions inside each section
            for question_data in section_data.get("questions", []):
                Question.objects.create(
                    section=section,
                    text=question_data.get("text"),
                    response_type=question_data.get("responseType"),
                    required=question_data.get("required", False),
                    order=question_data.get("order", 0),
                )

        return Response({"message": "Template created successfully!"}, status=status.HTTP_201_CREATED)


@method_decorator(login_required, name='dispatch')  # Requires login
class DashboardAPI(APIView):
    def get(self, request):
        data = {
            "templates_created": 24,
            "inspections_completed": "18/25",
            "open_issues": 3,
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
    

