from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Template, Section, Question
from django.core.files.base import ContentFile
import base64
from rest_framework.views import APIView
import uuid
from rest_framework.parsers import MultiPartParser, FormParser
import json
from rest_framework.response import Response
from rest_framework import status


CustomUser = get_user_model()

# User registration serializer
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone',
            'password', 'company_name', 'industry_type', 'job_title', 'company_size'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


# Question serializer
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'response_type', 'required', 'order']


# Section serializer
class SectionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)

    class Meta:
        model = Section
        fields = ['id', 'title', 'description', 'order', 'questions']


# Template serializer
class TemplateSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, required=False)
    logo = serializers.CharField(required=False, allow_blank=True)  # Accept base64 string for input
    lastModified = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ['id', 'title', 'description', 'logo', 'lastModified', 'access', 'sections']

    def create(self, validated_data):
        sections_data = validated_data.pop('sections', [])
        logo_base64 = validated_data.pop('logo', None)

        if logo_base64:
            format, imgstr = logo_base64.split(';base64,') if ';base64,' in logo_base64 else ('', logo_base64)
            ext = format.split('/')[-1] if '/' in format else 'png'
            file_name = f"{uuid.uuid4()}.{ext}"
            validated_data['logo'] = ContentFile(base64.b64decode(imgstr), name=file_name)

        template = Template.objects.create(**validated_data)

        for section_data in sections_data:
            questions_data = section_data.pop('questions', [])
            section = Section.objects.create(template=template, **section_data)
            for question_data in questions_data:
                Question.objects.create(section=section, **question_data)

        return template

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Include base64 encoded image in response
        if instance.logo:
            try:
                with instance.logo.open('rb') as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    representation['logo'] = f"data:image/png;base64,{encoded_string}"
            except Exception:
                representation['logo'] = None
        else:
            representation['logo'] = None

        return representation

    def get_lastModified(self, obj):
        return obj.updated_at.strftime("%B %d, %Y") if hasattr(obj, 'updated_at') and obj.updated_at else "Unknown"

    def get_access(self, obj):
        return obj.access if hasattr(obj, 'access') else "All users"
    
        


class TemplateCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        data = request.data.copy()

        print("📥 RAW request.data:", request.data)  # Debug: show raw input

        if 'sections' in data and isinstance(data['sections'], str):
            try:
                data['sections'] = json.loads(data['sections'])
            except json.JSONDecodeError as e:
                print("❌ JSON decode error for sections:", e)
                return Response({'sections': ['Invalid JSON']}, status=400)

        serializer = TemplateSerializer(data=data)

        if serializer.is_valid():
            template = serializer.save()
            return Response({"id": template.id, "message": "Template created successfully!"}, status=201)
        else:
            print("❌ serializer.errors:", serializer.errors)  # <---- this is what we need
            return Response(serializer.errors, status=400)
