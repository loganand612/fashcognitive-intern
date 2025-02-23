from django.contrib.auth.models import AbstractUser
from django.db import models

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
