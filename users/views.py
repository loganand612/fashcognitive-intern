from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import User
from django.http import HttpResponse

def register(request):
    if request.method == "POST":
        email = request.POST["email"]
        f_name = request.POST["f_name"]
        l_name = request.POST["l_name"]
        phone_no = request.POST.get("phone_no", "")
        password = request.POST["password"]  # Don't hash manually
        company_name = request.POST["company_name"]
        industry_type = request.POST["industry_type"]
        job_title = request.POST["job_title"]
        company_size = request.POST["company_size"]

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.")
            return redirect("register")

        user = User.objects.create_user(  # ✅ Use create_user
            email=email,
            password=password,  # ✅ Password will be hashed inside create_user
            f_name=f_name,
            l_name=l_name,
            phone_no=phone_no,
            company_name=company_name,
            industry_type=industry_type,
            job_title=job_title,
            company_size=company_size,
        )
        messages.success(request, "Account created successfully.")
        return redirect("login")

    return render(request, "register.html")


def user_login(request):
    if request.method == "POST":
        email = request.POST["email"]
        password = request.POST["password"]

        user = authenticate(request, username=email, password=password)

        if user is not None:
            print(f"Authenticated: {user}")  
            login(request, user)
            print("Logged in user:", request.user)
            next_url = request.GET.get("next")  # Get 'next' from URL parameters
            return redirect(next_url or "dashboard")
        else:
            print("Authentication failed")  
            messages.error(request, "Invalid email or password.")

    return render(request, "login.html")



@login_required
def dashboard_view(request):
    return render(request, "dashboard.html")
