from rest_framework import serializers
from .models import User  # Assuming you have a custom User model

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'f_name', 'l_name', 'phone_no', 'password', 'company_name', 'industry_type', 'job_title', 'company_size']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
