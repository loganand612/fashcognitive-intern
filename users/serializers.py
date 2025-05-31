from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Template, Section, Question, QuestionOption, TemplateAccess,
    PermissionType, GranularPermission, PermissionAuditLog,
    TemplateAssignment, Inspection, Response, InspectionResponse
)
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
            'password', 'company_name', 'industry_type', 'job_title', 'company_size',
            'user_role'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id',
            'text',
            'response_type',
            'required',
            'order',
            'logic_rules',
            'flagged',
            'multiple_selection',
            'min_value',
            'max_value',
            'options',
        ]


# Basic Question serializer (for template creation)
class BasicQuestionSerializer(serializers.ModelSerializer):
    options = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)

    class Meta:
        model = Question
        fields = [
            'id',
            'text',
            'response_type',
            'required',
            'order',
            'logic_rules',
            'flagged',
            'multiple_selection',
            'min_value',
            'max_value',
            'options',
        ]


# Basic Section serializer
class BasicSectionSerializer(serializers.ModelSerializer):
    questions = BasicQuestionSerializer(many=True, required=False)

    class Meta:
        model = Section
        fields = ['id', 'title', 'description', 'order', 'questions']


# Basic Template serializer (for simple operations)
class BasicTemplateSerializer(serializers.ModelSerializer):
    sections = BasicSectionSerializer(many=True, required=False)
    logo = serializers.CharField(required=False, allow_blank=True)  # Accept base64 string for input
    lastModified = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()
    createdBy = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ['id', 'title', 'description', 'logo', 'lastModified', 'access', 'sections', 'createdBy', 'user']

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
                # Extract options before creating the question
                options_data = question_data.pop('options', [])

                # Create the question
                question = Question.objects.create(section=section, **question_data)

                # Create options for multiple choice questions
                if options_data and isinstance(options_data, list):
                    for o_index, option_text in enumerate(options_data):
                        QuestionOption.objects.create(
                            question=question,
                            text=option_text,
                            order=o_index
                        )

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

    def get_createdBy(self, obj):
        return obj.user.email


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

        serializer = BasicTemplateSerializer(data=data)

        if serializer.is_valid():
            template = serializer.save()
            return Response({"id": template.id, "message": "Template created successfully!"}, status=201)
        else:
            print("❌ serializer.errors:", serializer.errors)  # <---- this is what we need
            return Response(serializer.errors, status=400)



class AQLSettingsSerializer(serializers.Serializer):
    aqlLevel = serializers.CharField()
    inspectionLevel = serializers.CharField()
    samplingPlan = serializers.CharField()
    severity = serializers.CharField()



class SectionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    aqlSettings = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()  # "standard" or "garmentDetails"
    isCollapsed = serializers.BooleanField(source="is_collapsed")

    class Meta:
        model = Section
        fields = [
            'id',
            'title',
            'description',
            'order',
            'type',
            'isCollapsed',
            'questions',
            'aqlSettings',
        ]

    def get_type(self, obj):
        return "garmentDetails" if obj.is_garment_section else "standard"

    def get_aqlSettings(self, obj):
        if not obj.is_garment_section or not any([obj.aql_level, obj.inspection_level, obj.sampling_plan, obj.severity]):
            return None

        return {
            "aqlLevel": obj.aql_level or "",
            "inspectionLevel": obj.inspection_level or "",
            "samplingPlan": obj.sampling_plan or "",
            "severity": obj.severity or ""
        }


class TemplateSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True)
    logo = serializers.CharField(required=False, allow_blank=True)
    lastModified = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()
    createdBy = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = [
            'id',
            'title',
            'description',
            'logo',
            'sections',
            'template_type',
            'last_published',
            'lastModified',
            'access',
            'createdBy',
        ]

    def create(self, validated_data):
        sections_data = validated_data.pop('sections', [])
        logo_base64 = validated_data.pop('logo', None)

        # Handle base64 logo upload
        if logo_base64:
            format, imgstr = logo_base64.split(';base64,') if ';base64,' in logo_base64 else ('', logo_base64)
            ext = format.split('/')[-1] if '/' in format else 'png'
            file_name = f"{uuid.uuid4()}.{ext}"
            validated_data['logo'] = ContentFile(base64.b64decode(imgstr), name=file_name)

        template = Template.objects.create(**validated_data)

        for section_data in sections_data:
            type_ = section_data.pop("type", "standard")
            is_collapsed = section_data.pop("is_collapsed", False)
            aql_data = section_data.pop("aqlSettings", None)
            questions_data = section_data.pop("questions", [])

            section = Section.objects.create(
                template=template,
                is_collapsed=is_collapsed,
                is_garment_section=(type_ == "garmentDetails"),
                **section_data
            )

            if aql_data:
                section.aql_level = aql_data.get("aqlLevel")
                section.inspection_level = aql_data.get("inspectionLevel")
                section.sampling_plan = aql_data.get("samplingPlan")
                section.severity = aql_data.get("severity")
                section.save()

            for question_data in questions_data:
                # Extract options before creating the question
                options_data = question_data.pop('options', [])

                # Debug logic rules
                print(f"🔍 SERIALIZER: Creating question '{question_data.get('text')}' with logic_rules: {question_data.get('logic_rules')}")

                # Create the question with logic_rules
                question = Question.objects.create(section=section, **question_data)

                print(f"🔍 SERIALIZER: Created question ID {question.id} with logic_rules: {question.logic_rules}")

                # Create options for multiple choice questions
                if options_data and isinstance(options_data, list):
                    for o_index, option_text in enumerate(options_data):
                        QuestionOption.objects.create(
                            question=question,
                            text=option_text,
                            order=o_index
                        )

        return template

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Include base64 encoded logo in response
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
        # Check if there are any access permissions for this template
        if hasattr(obj, 'access_permissions'):
            # Count the number of users with access
            access_count = obj.access_permissions.count()
            if access_count == 0:
                return "Only you"
            elif access_count == 1:
                return "You and 1 other"
            else:
                return f"You and {access_count} others"
        return "All users"  # Fallback for backward compatibility

    def get_createdBy(self, obj):
        return obj.user.email if hasattr(obj, 'user') and obj.user else "Unknown"


class UserBasicSerializer(serializers.ModelSerializer):
    """Simplified user serializer for template access permissions"""
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserSerializer(serializers.ModelSerializer):
    """Full user serializer for user management"""
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'company_name', 'industry_type', 'job_title',
            'company_size', 'user_role', 'date_joined', 'last_login'
        ]


class TemplateAccessSerializer(serializers.ModelSerializer):
    """Serializer for template access permissions"""
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    granted_by_name = serializers.SerializerMethodField()
    granular_permissions = serializers.SerializerMethodField()

    class Meta:
        model = TemplateAccess
        fields = [
            'id',
            'template',
            'user',
            'user_email',
            'user_name',
            'permission_level',
            'status',
            'created_at',
            'updated_at',
            'last_accessed',
            'granted_by',
            'granted_by_name',
            'granular_permissions'
        ]

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_user_name(self, obj):
        if obj.user:
            if obj.user.first_name and obj.user.last_name:
                return f"{obj.user.first_name} {obj.user.last_name}"
            return obj.user.username
        return None

    def get_granted_by_name(self, obj):
        if obj.granted_by:
            if obj.granted_by.first_name and obj.granted_by.last_name:
                return f"{obj.granted_by.first_name} {obj.granted_by.last_name}"
            return obj.granted_by.username
        return None

    def get_granular_permissions(self, obj):
        """Get list of granular permissions for this access"""
        try:
            permissions = obj.granular_permissions.all()
            return [
                {
                    'id': perm.id,
                    'permission_type_id': perm.permission_type.id,
                    'permission_name': perm.permission_type.name,
                    'permission_codename': perm.permission_type.codename,
                    'granted_at': perm.granted_at,
                    'granted_by': perm.granted_by.email if perm.granted_by else None
                }
                for perm in permissions
            ]
        except Exception:
            return []


class PermissionTypeSerializer(serializers.ModelSerializer):
    """Serializer for permission types"""

    class Meta:
        model = PermissionType
        fields = ['id', 'name', 'codename', 'description']


class GranularPermissionSerializer(serializers.ModelSerializer):
    """Serializer for granular permissions"""
    permission_name = serializers.SerializerMethodField()
    permission_codename = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    template_id = serializers.SerializerMethodField()
    granted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GranularPermission
        fields = [
            'id',
            'template_access',
            'permission_type',
            'permission_name',
            'permission_codename',
            'granted_at',
            'granted_by',
            'granted_by_name',
            'user_email',
            'template_id'
        ]

    def get_permission_name(self, obj):
        return obj.permission_type.name if obj.permission_type else None

    def get_permission_codename(self, obj):
        return obj.permission_type.codename if obj.permission_type else None

    def get_user_email(self, obj):
        return obj.template_access.user.email if obj.template_access and obj.template_access.user else None

    def get_template_id(self, obj):
        return obj.template_access.template.id if obj.template_access and obj.template_access.template else None

    def get_granted_by_name(self, obj):
        if obj.granted_by:
            if obj.granted_by.first_name and obj.granted_by.last_name:
                return f"{obj.granted_by.first_name} {obj.granted_by.last_name}"
            return obj.granted_by.username
        return None


class PermissionAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for permission audit logs"""
    user_email = serializers.SerializerMethodField()
    performed_by_email = serializers.SerializerMethodField()
    template_title = serializers.SerializerMethodField()

    class Meta:
        model = PermissionAuditLog
        fields = [
            'id',
            'user',
            'user_email',
            'template',
            'template_title',
            'action',
            'timestamp',
            'performed_by',
            'performed_by_email',
            'old_permission',
            'new_permission',
            'ip_address',
            'additional_data'
        ]

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_performed_by_email(self, obj):
        return obj.performed_by.email if obj.performed_by else None

    def get_template_title(self, obj):
        return obj.template.title if obj.template else None


class TemplateAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for template assignments"""
    inspector_email = serializers.SerializerMethodField()
    inspector_name = serializers.SerializerMethodField()
    assigned_by_email = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    template_title = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = TemplateAssignment
        fields = [
            'id',
            'template',
            'template_title',
            'inspector',
            'inspector_email',
            'inspector_name',
            'assigned_by',
            'assigned_by_email',
            'assigned_by_name',
            'status',
            'status_display',
            'assigned_at',
            'started_at',
            'completed_at',
            'revoked_at',
            'expired_at',
            'due_date',
            'notes'
        ]

    def get_inspector_email(self, obj):
        return obj.inspector.email if obj.inspector else None

    def get_inspector_name(self, obj):
        if obj.inspector:
            if obj.inspector.first_name and obj.inspector.last_name:
                return f"{obj.inspector.first_name} {obj.inspector.last_name}"
            return obj.inspector.username
        return None

    def get_assigned_by_email(self, obj):
        return obj.assigned_by.email if obj.assigned_by else None

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            if obj.assigned_by.first_name and obj.assigned_by.last_name:
                return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}"
            return obj.assigned_by.username
        return None

    def get_template_title(self, obj):
        return obj.template.title if obj.template else None

    def get_status_display(self, obj):
        return dict(TemplateAssignment.STATUS_CHOICES).get(obj.status, obj.status)


class InspectionSerializer(serializers.ModelSerializer):
    """Serializer for inspections"""
    template_title = serializers.SerializerMethodField()
    responses = serializers.SerializerMethodField()

    class Meta:
        model = Inspection
        fields = [
            'id',
            'template',
            'template_title',
            'title',
            'conducted_by',
            'conducted_at',
            'location',
            'site',
            'status',
            'created_at',
            'updated_at',
            'responses'
        ]

    def get_template_title(self, obj):
        return obj.template.title if obj.template else None

    def get_responses(self, obj):
        """Get all responses for this inspection"""
        try:
            inspection_responses = obj.inspection_responses.all()
            return [
                {
                    'id': ir.response.id,
                    'question_id': ir.response.question.id,
                    'question_text': ir.response.question.text,
                    'response_type': ir.response.question.response_type,
                    'text_response': ir.response.text_response,
                    'number_response': ir.response.number_response,
                    'boolean_response': ir.response.boolean_response,
                    'date_response': ir.response.date_response,
                    'choice_response': ir.response.choice_response.text if ir.response.choice_response else None,
                }
                for ir in inspection_responses
            ]
        except Exception as e:
            print(f"Error getting responses: {e}")
            return []
