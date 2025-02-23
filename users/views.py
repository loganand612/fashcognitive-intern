# from django.shortcuts import render, redirect
# from django.contrib.auth import authenticate, login
# from django.contrib.auth.decorators import login_required
# from django.contrib import messages
# from .models import User
# from django.http import HttpResponse
# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from .models import User
# #from .serializers import UserSerializer


# def register(request):
#     if request.method == "POST":
#         email = request.POST["email"]
#         f_name = request.POST["f_name"]
#         l_name = request.POST["l_name"]
#         phone_no = request.POST.get("phone_no", "")
#         password = request.POST["password"]  # Don't hash manually
#         company_name = request.POST["company_name"]
#         industry_type = request.POST["industry_type"]
#         job_title = request.POST["job_title"]
#         company_size = request.POST["company_size"]

#         if User.objects.filter(email=email).exists():
#             messages.error(request, "Email already exists.")
#             return redirect("register")

#         user = User.objects.create_user(  # ✅ Use create_user # type: ignore
#             email=email,
#             password=password,  # ✅ Password will be hashed inside create_user
#             f_name=f_name,
#             l_name=l_name,
#             phone_no=phone_no,
#             company_name=company_name,
#             industry_type=industry_type,
#             job_title=job_title,
#             company_size=company_size,
#         )
#         messages.success(request, "Account created successfully.")
#         return redirect("login")

#     return render(request, "register.html")


# def user_login(request):
#     if request.method == "POST":
#         email = request.POST["email"]
#         password = request.POST["password"]

#         user = authenticate(request, username=email, password=password)

#         if user is not None:
#             print(f"Authenticated: {user}")  
#             login(request, user)
#             print("Logged in user:", request.user)
#             next_url = request.GET.get("next")  # Get 'next' from URL parameters
#             return redirect(next_url or "dashboard")
#         else:
#             print("Authentication failed")  
#             messages.error(request, "Invalid email or password.")

#     return render(request, "login.html")



# @login_required
# def dashboard_view(request):
#     return render(request, "dashboard.html")

# def home(request):
#     return render(request, "home.html")

# from django.contrib.auth import authenticate
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status

# class LoginView(APIView):
#     def post(self, request):
#         email = request.data.get("email")
#         password = request.data.get("password")

#         user = authenticate(request, username=email, password=password)

#         if user is not None:
#             # Successful authentication
#             return Response({"message": "Login successful", "user_id": user.id}, status=status.HTTP_200_OK)
#         else:
#             # Invalid credentials
#             return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)


from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt  # Disable CSRF for API (since React handles it differently)
def user_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            user = authenticate(request, username=email, password=password)

            if user is not None:
                login(request, user)
                return JsonResponse({"message": "Login successful"}, status=200)
            else:
                return JsonResponse({"error": "Invalid email or password"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
    else:
        return JsonResponse({"error": "Only POST requests are allowed"}, status=405)


from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import RegisterSerializer

@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
