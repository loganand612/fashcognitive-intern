from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from .models import CustomUser
from .serializers import UserSerializer
from .permissions import IsAdmin


class InspectorListView(APIView):
    """
    API view to list all users with the inspector role
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all users with the inspector role"""
        inspectors = CustomUser.objects.filter(user_role='inspector')
        serializer = UserSerializer(inspectors, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_inspectors(request):
    """Get all users with the inspector role"""
    inspectors = CustomUser.objects.filter(user_role='inspector')
    serializer = UserSerializer(inspectors, many=True)
    return Response(serializer.data)
