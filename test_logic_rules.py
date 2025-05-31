#!/usr/bin/env python
"""
Test script to verify logic rules functionality end-to-end
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import Template, Section, Question, QuestionOption, CustomUser
from users.serializers import TemplateSerializer
import json

def create_test_template():
    """Create a test template with logic rules"""
    print("🔧 Creating test template with logic rules...")
    
    # Get or create a test user
    user, created = CustomUser.objects.get_or_create(
        email='test@example.com',
        defaults={
            'username': 'testuser',
            'user_role': 'admin',
            'first_name': 'Test',
            'last_name': 'User',
            'company_size': 50,  # Integer value for company size
            'industry_type': 'technology',
            'job_title': 'Developer',
            'company_name': 'Test Company',
            'phone': '1234567890'
        }
    )
    
    # Create template
    template = Template.objects.create(
        user=user,
        title='Logic Rules Test Template',
        description='Template to test logic rules functionality'
    )
    
    # Create section
    section = Section.objects.create(
        template=template,
        title='Test Section',
        description='Section with logic rules',
        order=0
    )
    
    # Create question with logic rules
    logic_rules = [
        {
            "id": "rule1",
            "condition": "greater than",
            "value": 5,
            "trigger": "require_evidence",
            "message": "Please upload evidence for values greater than 5"
        },
        {
            "id": "rule2", 
            "condition": "equal to",
            "value": 10,
            "trigger": "display_message",
            "message": "Perfect score!"
        }
    ]
    
    question = Question.objects.create(
        section=section,
        text='Enter a number',
        response_type='Number',
        required=True,
        order=0,
        logic_rules=logic_rules
    )
    
    print(f"✅ Created template ID: {template.id}")
    print(f"✅ Created question ID: {question.id}")
    print(f"✅ Logic rules saved: {question.logic_rules}")
    
    return template

def test_template_serialization(template):
    """Test template serialization to ensure logic rules are included"""
    print("\n🔧 Testing template serialization...")
    
    serializer = TemplateSerializer(template)
    data = serializer.data
    
    print(f"✅ Template serialized successfully")
    
    # Check if logic rules are in the serialized data
    for section in data.get('sections', []):
        for question in section.get('questions', []):
            if question.get('logic_rules'):
                print(f"✅ Found logic_rules in serialized data: {question['logic_rules']}")
                return True
            else:
                print(f"❌ No logic_rules found in question: {question.get('text')}")
    
    return False

def test_api_response(template_id):
    """Test the API response for the template"""
    print(f"\n🔧 Testing API response for template ID: {template_id}")
    
    from django.test import Client
    from django.contrib.auth import get_user_model
    
    client = Client()
    User = get_user_model()
    
    # Get the test user
    user = User.objects.get(email='test@example.com')
    client.force_login(user)
    
    # Make API request
    response = client.get(f'/api/users/templates/{template_id}/')
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API response successful")
        
        # Check logic rules in response
        for section in data.get('sections', []):
            for question in section.get('questions', []):
                if question.get('logic_rules'):
                    print(f"✅ API returned logic_rules: {question['logic_rules']}")
                    return True
                else:
                    print(f"❌ API response missing logic_rules for: {question.get('text')}")
        return False
    else:
        print(f"❌ API request failed: {response.status_code}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Logic Rules End-to-End Test\n")
    
    # Clean up any existing test data
    Template.objects.filter(title='Logic Rules Test Template').delete()
    
    # Test 1: Create template with logic rules
    template = create_test_template()
    
    # Test 2: Verify serialization
    serialization_ok = test_template_serialization(template)
    
    # Test 3: Test API response
    api_ok = test_api_response(template.id)
    
    # Summary
    print("\n📊 Test Results:")
    print(f"Template Creation: ✅")
    print(f"Serialization: {'✅' if serialization_ok else '❌'}")
    print(f"API Response: {'✅' if api_ok else '❌'}")
    
    if serialization_ok and api_ok:
        print("\n🎉 All tests passed! Logic rules are working correctly.")
        print(f"\n🔗 Test the template in the browser:")
        print(f"   http://localhost:3000/inspection?templateId={template.id}")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
    
    return template

if __name__ == '__main__':
    template = main()
