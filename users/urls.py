# from django.urls import path
# from .views import home,register, dashboard_view, user_login
# from django.contrib.auth.decorators import login_required
# from .views import LoginView
# from django.urls import path, include

# urlpatterns = [
#     #path("", home, name="home"),
#     path("register/", register, name="register"),
#     path("login/", user_login, name="login"),
#     path("dashboard/", dashboard_view, name="dashboard"),
#     path('api/login/', LoginView.as_view(), name='login'),
#     path('', include('users.urls')),
# ]

from django.urls import path
from .views import RegisterUserView,login_user

urlpatterns = [
    path("login/", login_user, name="login"),
    path('register/', RegisterUserView.as_view(), name='register'),
]
