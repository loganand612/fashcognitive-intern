from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Template, Section, Question
import base64
from rest_framework.generics import RetrieveAPIView

CustomUser = get_user_model()

# User registration serializer
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name', 'phone', 'password', 'company_name', 'industry_type', 'job_title', 'company_size']

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


# Template serializer with nested sections and computed fields
class TemplateSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, required=False)
    logo = serializers.SerializerMethodField()
    lastModified = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ['id', 'title', 'description', 'logo', 'lastModified', 'access', 'sections']

    def create(self, validated_data):
        sections_data = validated_data.pop('sections', [])
        template = Template.objects.create(**validated_data)

        for section_data in sections_data:
            questions_data = section_data.pop('questions', [])
            section = Section.objects.create(template=template, **section_data)

            for question_data in questions_data:
                Question.objects.create(section=section, **question_data)

        return template

    def get_logo(self, obj):
        if obj.logo:
            try:
                return base64.b64encode(obj.logo.read()).decode('utf-8')
            except Exception:
                return None
        return None


    def get_lastModified(self, obj):
        return obj.updated_at.strftime("%B %d, %Y") if hasattr(obj, 'updated_at') and obj.updated_at else "Unknown"

    def get_access(self, obj):
        return obj.access if hasattr(obj, 'access') else "All users"

class TemplateDetailView(RetrieveAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer