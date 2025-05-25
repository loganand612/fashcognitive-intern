from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
import uuid
import os


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('inspector', 'Inspector'),
        ('regular', 'Regular User'),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=100)
    industry_type = models.CharField(max_length=50)
    job_title = models.CharField(max_length=100)
    company_size = models.IntegerField()
    user_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='regular')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'phone', 'company_name', 'industry_type', 'job_title', 'company_size']

    def __str__(self):
        return self.email

    def is_admin(self):
        return self.user_role == 'admin'

    def is_inspector(self):
        return self.user_role == 'inspector'

    class Meta:
        verbose_name = "Custom User"
        verbose_name_plural = "Custom Users"


class Template(models.Model):
    TEMPLATE_TYPE_CHOICES = [
        ('standard', 'Standard'),
        ('garment', 'Garment'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    template_type = models.CharField(max_length=20,choices=TEMPLATE_TYPE_CHOICES,default='standard')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_published = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.title

    def publish(self):
        """Mark the template as published"""
        self.last_published = timezone.now()
        self.save()

    class Meta:
        db_table = 'templates'
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['updated_at']),
        ]


class Section(models.Model):
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField()
    is_collapsed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Garment-specific fields
    is_garment_section = models.BooleanField(default=False)
    aql_level = models.CharField(max_length=10, blank=True, null=True)
    inspection_level = models.CharField(max_length=10, blank=True, null=True)
    sampling_plan = models.CharField(max_length=10, blank=True, null=True)
    severity = models.CharField(max_length=15, blank=True, null=True)
    sizes = ArrayField(models.CharField(max_length=10), blank=True, default=list)
    colors = ArrayField(models.CharField(max_length=20), blank=True, default=list)
    default_defects = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    include_carton_offered = models.BooleanField(default=True)
    include_carton_inspected = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.template.title} - {self.title}"

    class Meta:
        db_table = 'sections'
        ordering = ['order']
        indexes = [
            models.Index(fields=['template']),
            models.Index(fields=['order']),
        ]


class Question(models.Model):
    RESPONSE_TYPE_CHOICES = [
        ('Text', 'Text'),
        ('Number', 'Number'),
        ('Checkbox', 'Checkbox'),
        ('Yes/No', 'Yes/No'),
        ('Multiple choice', 'Multiple choice'),
        ('Slider', 'Slider'),
        ('Media', 'Media'),
        ('Annotation', 'Annotation'),
        ('Date & Time', 'Date & Time'),
        ('Site', 'Site'),
        ('Inspection date', 'Inspection date'),
        ('Person', 'Person'),
        ('Inspection location', 'Inspection location'),
    ]

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)
    response_type = models.CharField(max_length=50, choices=RESPONSE_TYPE_CHOICES, default='Text')
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    min_value = models.IntegerField(default=0, blank=True, null=True)
    max_value = models.IntegerField(default=100, blank=True, null=True)
    # Add field for storing logic rules and triggers as JSON
    logic_rules = models.JSONField(blank=True, null=True)
    flagged = models.BooleanField(default=False)
    multiple_selection = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.section.title} - {self.text}"

    class Meta:
        db_table = 'questions'
        ordering = ['order']
        indexes = [
            models.Index(fields=['section']),
            models.Index(fields=['response_type']),
            models.Index(fields=['order']),
        ]



class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.text

    class Meta:
        db_table = 'question_options'
        ordering = ['order']
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['order']),
        ]


class MediaAttachment(models.Model):
    IMAGE = 'image'
    VIDEO = 'video'
    DOCUMENT = 'document'

    FILE_TYPE_CHOICES = [
        (IMAGE, 'Image'),
        (VIDEO, 'Video'),
        (DOCUMENT, 'Document'),
    ]

    def upload_to(instance, filename):
        ext = filename.split('.')[-1]
        return f'template_media/{uuid.uuid4()}.{ext}'

    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='media_attachments')
    file = models.FileField(upload_to=upload_to)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default=IMAGE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Media for {self.question.text}"

    class Meta:
        db_table = 'media_attachments'
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['file_type']),
        ]


class Response(models.Model):
    """Model to store actual responses to questions when templates are filled out"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='responses')

    # Different types of responses stored in separate fields
    text_response = models.TextField(blank=True, null=True)
    number_response = models.FloatField(blank=True, null=True)
    boolean_response = models.BooleanField(blank=True, null=True)
    choice_response = models.ForeignKey(QuestionOption, on_delete=models.SET_NULL, blank=True, null=True, related_name='responses')
    date_response = models.DateTimeField(blank=True, null=True)

    # Media attachments for responses
    media_attachments = models.ManyToManyField(MediaAttachment, blank=True, related_name='responses')


class TemplateAccess(models.Model):
    """
    Model to manage access permissions between templates and users.
    This allows template owners to share templates with other users
    with different permission levels.
    """
    PERMISSION_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Administrator'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('expired', 'Expired'),
    ]

    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='access_permissions'
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='template_accesses'
    )
    permission_level = models.CharField(
        max_length=20,
        choices=PERMISSION_CHOICES,
        default='viewer'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed = models.DateTimeField(null=True, blank=True)
    granted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name='granted_permissions',
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ('template', 'user')
        verbose_name = "Template Access"
        verbose_name_plural = "Template Access Permissions"
        indexes = [
            models.Index(fields=['template', 'user']),
            models.Index(fields=['user', 'permission_level']),
            models.Index(fields=['template', 'permission_level']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_permission_level_display()} access to {self.template.title}"

    def record_access(self):
        """Record when a user accesses a template"""
        self.last_accessed = timezone.now()
        self.save(update_fields=['last_accessed'])


class PermissionType(models.Model):
    """
    Model to define different types of granular permissions that can be assigned.
    """
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Permission Type"
        verbose_name_plural = "Permission Types"

    def __str__(self):
        return self.name


class GranularPermission(models.Model):
    """
    Model to assign specific granular permissions to users beyond the role-based permissions.
    """
    template_access = models.ForeignKey(
        TemplateAccess,
        on_delete=models.CASCADE,
        related_name='granular_permissions'
    )
    permission_type = models.ForeignKey(
        PermissionType,
        on_delete=models.CASCADE,
        related_name='assigned_permissions'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        related_name='granted_granular_permissions',
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ('template_access', 'permission_type')
        verbose_name = "Granular Permission"
        verbose_name_plural = "Granular Permissions"

    def __str__(self):
        return f"{self.template_access.user.email} - {self.permission_type.name} for {self.template_access.template.title}"


class PermissionAuditLog(models.Model):
    """
    Model to track changes to permissions for audit purposes.
    """
    ACTION_CHOICES = [
        ('grant', 'Permission Granted'),
        ('revoke', 'Permission Revoked'),
        ('modify', 'Permission Modified'),
        ('access', 'Resource Accessed'),
    ]

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='permission_audit_logs'
    )
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='permission_audit_logs',
        null=True,
        blank=True
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    performed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='performed_permission_actions'
    )
    old_permission = models.CharField(max_length=100, blank=True, null=True)
    new_permission = models.CharField(max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    additional_data = models.JSONField(blank=True, null=True)

    class Meta:
        verbose_name = "Permission Audit Log"
        verbose_name_plural = "Permission Audit Logs"
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['template']),
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.action} - {self.user.email} - {self.timestamp}"


class Inspection(models.Model):
    """Model to group responses for a completed inspection"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
    ]

    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='inspections')
    title = models.CharField(max_length=255)
    conducted_by = models.CharField(max_length=255, blank=True, null=True)
    conducted_at = models.DateTimeField(default=timezone.now)
    location = models.CharField(max_length=255, blank=True, null=True)
    site = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'inspections'
        indexes = [
            models.Index(fields=['template']),
            models.Index(fields=['conducted_at']),
            models.Index(fields=['status']),
        ]


class InspectionResponse(models.Model):
    """Links responses to a specific inspection"""
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='inspection_responses')
    response = models.ForeignKey(Response, on_delete=models.CASCADE, related_name='inspection_responses')

    class Meta:
        db_table = 'inspection_responses'
        unique_together = ('inspection', 'response')


class TemplateAssignment(models.Model):
    """
    Model to track template assignments between admin users and inspectors.
    Only assigned inspectors can complete templates, and admins can revoke access if needed.
    """
    STATUS_CHOICES = [
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('revoked', 'Revoked'),
        ('expired', 'Expired'),
    ]

    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    inspector = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='assigned_templates',
        limit_choices_to={'user_role': 'inspector'}
    )
    assigned_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='template_assignments',
        limit_choices_to={'user_role': 'admin'}
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='assigned'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'template_assignments'
        verbose_name = "Template Assignment"
        verbose_name_plural = "Template Assignments"
        unique_together = ('template', 'inspector')
        indexes = [
            models.Index(fields=['template']),
            models.Index(fields=['inspector']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_at']),
        ]

    def __str__(self):
        return f"{self.template.title} assigned to {self.inspector.email}"

    def is_expired(self):
        """Check if the assignment has expired based on due date"""
        if self.due_date and timezone.now() > self.due_date:
            # If it's expired but not marked as expired yet, mark it
            if self.status not in ['completed', 'revoked', 'expired']:
                self.expire()
            return True
        return False

    def expire(self):
        """Mark the assignment as expired"""
        self.status = 'expired'
        self.expired_at = timezone.now()
        self.save()

    def start(self):
        """Mark the assignment as in progress"""
        # Check if expired first
        if self.is_expired():
            return False

        if self.status == 'assigned':
            self.status = 'in_progress'
            self.started_at = timezone.now()
            self.save()
            return True
        return False

    def complete(self):
        """Mark the assignment as completed"""
        # Check if expired first
        if self.is_expired():
            return False

        if self.status in ['assigned', 'in_progress']:
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save()
            return True
        return False

    def revoke(self):
        """Revoke the assignment"""
        self.status = 'revoked'
        self.revoked_at = timezone.now()
        self.save()
        return True

