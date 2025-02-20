from django.shortcuts import render, redirect
from django.contrib.auth.hashers import make_password
from .models import User
from django.contrib import messages

def register(request):
    if request.method == "POST":
        email = request.POST["email"]
        f_name = request.POST["f_name"]
        l_name = request.POST["l_name"]
        phone_no = request.POST.get("phone_no", "")
        password = make_password(request.POST["password"])  # Hash password
        company_name = request.POST["company_name"]
        industry_type = request.POST["industry_type"]
        job_title = request.POST["job_title"]
        company_size = request.POST["company_size"]

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.")
            return redirect("register")

        user = User.objects.create(
            email=email,
            f_name=f_name,
            l_name=l_name,
            phone_no=phone_no,
            password=password,
            company_name=company_name,
            industry_type=industry_type,
            job_title=job_title,
            company_size=company_size,
        )
        user.save()
        messages.success(request, "Account created successfully.")
        return redirect("login")  # Ensure 'login' exists in `urls.py`

    return render(request, "register.html")  # Ensure the template exists

def home(request):
    return render(request, "home.html")