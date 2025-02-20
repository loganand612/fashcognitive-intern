from django.db import models

class User(models.Model):
    email = models.EmailField(unique=True)
    f_name = models.CharField(max_length=255)
    l_name = models.CharField(max_length=255)
    phone_no = models.CharField(max_length=15, unique=True)
    password = models.CharField(max_length=255)  # Store hashed password
    company_name = models.CharField(max_length=255)
    industry_type = models.CharField(max_length=50)
    job_title = models.CharField(max_length=255)
    company_size = models.IntegerField()  # No. of people in the company

    def __str__(self):
        return f"{self.f_name} {self.l_name} - {self.email}"

class Inceptor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="inceptors")
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # Store hashed password

    def __str__(self):
        return self.email
