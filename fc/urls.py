

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),  # Include users app URLs
    path('api/templates/', include('users.urls')),  # Include template URLs under /api/templates/
]
