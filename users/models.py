from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=100)
    industry_type = models.CharField(max_length=50)
    job_title = models.CharField(max_length=100)
    company_size = models.IntegerField()

    # Use email as the primary login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'phone', 'company_name', 'industry_type', 'job_title', 'company_size']

    def __str__(self):
        return self.email  # Use email for better clarity in admin

    class Meta:
        verbose_name = "Custom User"
        verbose_name_plural = "Custom Users"
        

class Template(models.Model):
    title = models.CharField(max_length=255)  # Changed from 'name' to match your React component
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='template_logos/', blank=True, null=True)
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
    # Response type choices
    TEXT = 'Text'
    NUMBER = 'Number'
    CHECKBOX = 'Checkbox'
    YES_NO = 'Yes/No'
    MULTIPLE_CHOICE = 'Multiple choice'
    SLIDER = 'Slider'
    MEDIA = 'Media'
    ANNOTATION = 'Annotation'
    DATE_TIME = 'Date & Time'
    SITE = 'Site'
    INSPECTION_DATE = 'Inspection date'
    PERSON = 'Person'
    INSPECTION_LOCATION = 'Inspection location'
    
    RESPONSE_TYPE_CHOICES = [
        (TEXT, 'Text'),
        (NUMBER, 'Number'),
        (CHECKBOX, 'Checkbox'),
        (YES_NO, 'Yes/No'),
        (MULTIPLE_CHOICE, 'Multiple choice'),
        (SLIDER, 'Slider'),
        (MEDIA, 'Media'),
        (ANNOTATION, 'Annotation'),
        (DATE_TIME, 'Date & Time'),
        (SITE, 'Site'),
        (INSPECTION_DATE, 'Inspection date'),
        (PERSON, 'Person'),
        (INSPECTION_LOCATION, 'Inspection location'),
    ]
    
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)
    response_type = models.CharField(max_length=50, choices=RESPONSE_TYPE_CHOICES, default=TEXT)
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # For slider questions
    min_value = models.IntegerField(default=0, blank=True, null=True)
    max_value = models.IntegerField(default=100, blank=True, null=True)
    
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
    
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='media_attachments')
    file = models.FileField(upload_to='template_media/')
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
    
    # For storing references to other entities
    site_id = models.CharField(max_length=255, blank=True, null=True)
    person_id = models.CharField(max_length=255, blank=True, null=True)
    location_id = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Response to {self.question.text}"
    
    class Meta:
        db_table = 'responses'
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['created_at']),
        ]


class Inspection(models.Model):
    """Model to group responses for a completed inspection"""
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='inspections')
    title = models.CharField(max_length=255)
    conducted_by = models.CharField(max_length=255, blank=True, null=True)
    conducted_at = models.DateTimeField(default=timezone.now)
    location = models.CharField(max_length=255, blank=True, null=True)
    site = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default='draft')
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