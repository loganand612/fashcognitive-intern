from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Template, Section, Question

CustomUser = get_user_model()

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



class QuestionSerializer(serializers.ModelSerializer):
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), required=False)

    class Meta:
        model = Question
        fields = '__all__'


class SectionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    template = serializers.PrimaryKeyRelatedField(queryset=Template.objects.all(), required=False)

    class Meta:
        model = Section
        fields = '__all__'


class TemplateSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, required=False)

    class Meta:
        model = Template
        fields = '__all__'

    def create(self, validated_data):
        sections_data = validated_data.pop('sections', [])
        template = Template.objects.create(**validated_data)

        for section_data in sections_data:
            questions_data = section_data.pop('questions', [])
            section = Section.objects.create(template=template, **section_data)

            for question_data in questions_data:
                Question.objects.create(section=section, **question_data)

        return template
