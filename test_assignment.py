#!/usr/bin/env python
"""
Test script to verify template assignment functionality
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import CustomUser, Template, TemplateAssignment
from users.template_assignment_views import TemplateAssignmentListView
from rest_framework.test import APIRequestFactory
import json

def test_template_assignment():
    print("🔍 Testing Template Assignment Functionality")
    print("=" * 50)

    # Get the admin user
    try:
        user = CustomUser.objects.get(email='sloganand10@gmail.com')
        print(f"✅ Found user: {user.email} with role: {user.user_role}")
    except CustomUser.DoesNotExist:
        print("❌ User not found")
        return

    # Get a template to test with
    try:
        template = Template.objects.filter(user=user).first()
        if template:
            print(f"✅ Found template: {template.title} (ID: {template.id})")
        else:
            print("❌ No templates found for user")
            return
    except Exception as e:
        print(f"❌ Error finding template: {e}")
        return

    # Get an inspector to assign to
    try:
        inspector = CustomUser.objects.filter(user_role='inspector').first()
        if inspector:
            print(f"✅ Found inspector: {inspector.email}")
        else:
            print("❌ No inspectors found")
            return
    except Exception as e:
        print(f"❌ Error finding inspector: {e}")
        return

    # Create a mock request with JSON data using DRF's APIRequestFactory
    factory = APIRequestFactory()
    data = {
        'template': str(template.id),
        'inspector': str(inspector.id),
        'notes': 'Test assignment'
    }
    request = factory.post('/api/users/template-assignments/', data)

    # Set the user
    request.user = user

    print(f"🔍 Request user: {request.user}")
    print(f"🔍 Request user authenticated: {request.user.is_authenticated}")
    print(f"🔍 Request user role: {request.user.user_role}")

    # Test the view
    view = TemplateAssignmentListView()
    try:
        response = view.post(request)
        print(f"✅ Response status: {response.status_code}")
        print(f"✅ Response data: {response.data}")

        # If successful, check if assignment was created
        if response.status_code == 201:
            assignment_id = response.data.get('id')
            if assignment_id:
                assignment = TemplateAssignment.objects.get(id=assignment_id)
                print(f"✅ Assignment created: Template {assignment.template.title} assigned to {assignment.inspector.email}")

    except Exception as e:
        print(f"❌ Error in view: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_template_assignment()
