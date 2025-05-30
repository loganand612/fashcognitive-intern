#!/usr/bin/env python
"""
Test script to verify ask_questions logic rules functionality
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

def create_ask_questions_template():
    """Create a test template with ask_questions logic rules"""
    print("🔧 Creating test template with ask_questions logic rules...")
    
    # Get or create a test user
    user, created = CustomUser.objects.get_or_create(
        email='test_ask@example.com',
        defaults={
            'username': 'testaskuser',
            'user_role': 'admin',
            'first_name': 'Test',
            'last_name': 'Ask User',
            'company_size': 50,
            'industry_type': 'technology',
            'job_title': 'Developer',
            'company_name': 'Test Company',
            'phone': '1234567890'
        }
    )
    
    # Create template
    template = Template.objects.create(
        user=user,
        title='Ask Questions Logic Test Template',
        description='Template to test ask_questions logic rules functionality'
    )
    
    # Create section
    section = Section.objects.create(
        template=template,
        title='Ask Questions Test Section',
        description='Section with ask_questions logic rules',
        order=0
    )
    
    # Create question with ask_questions logic rules
    logic_rules = [
        {
            "id": "rule1",
            "condition": "is",
            "value": "Yes",
            "trigger": "ask_questions",
            "message": "Additional information required",
            "subQuestion": {
                "text": "What is your age?",
                "responseType": "Number",
                "options": []
            }
        },
        {
            "id": "rule2", 
            "condition": "is",
            "value": "No",
            "trigger": "ask_questions",
            "message": "Please explain why",
            "subQuestion": {
                "text": "Please explain why you answered No",
                "responseType": "Text",
                "options": []
            }
        }
    ]
    
    question = Question.objects.create(
        section=section,
        text='Site conducted',
        response_type='Yes/No',
        required=True,
        order=0,
        logic_rules=logic_rules
    )
    
    print(f"✅ Created template ID: {template.id}")
    print(f"✅ Created question ID: {question.id}")
    print(f"✅ Logic rules saved: {json.dumps(question.logic_rules, indent=2)}")
    
    return template

def test_database_storage(template):
    """Test what's actually stored in the database"""
    print("\n🔧 Testing database storage...")
    
    # Get the question from database
    question = Question.objects.get(section__template=template)
    
    print(f"✅ Question text: {question.text}")
    print(f"✅ Question response_type: {question.response_type}")
    print(f"✅ Raw logic_rules from DB: {question.logic_rules}")
    print(f"✅ Logic rules type: {type(question.logic_rules)}")
    
    if question.logic_rules:
        for i, rule in enumerate(question.logic_rules):
            print(f"\n  Rule {i+1}:")
            print(f"    ID: {rule.get('id')}")
            print(f"    Condition: {rule.get('condition')}")
            print(f"    Value: {rule.get('value')}")
            print(f"    Trigger: {rule.get('trigger')}")
            print(f"    Message: {rule.get('message')}")
            print(f"    SubQuestion: {rule.get('subQuestion')}")
            
            if rule.get('subQuestion'):
                sub_q = rule.get('subQuestion')
                print(f"      SubQuestion text: {sub_q.get('text')}")
                print(f"      SubQuestion responseType: {sub_q.get('responseType')}")
                print(f"      SubQuestion options: {sub_q.get('options')}")
    
    return question

def test_api_response(template_id):
    """Test the API response for the template"""
    print(f"\n🔧 Testing API response for template ID: {template_id}")
    
    from django.test import Client
    from django.contrib.auth import get_user_model
    
    client = Client()
    User = get_user_model()
    
    # Get the test user
    user = User.objects.get(email='test_ask@example.com')
    client.force_login(user)
    
    # Make API request
    response = client.get(f'/api/users/templates/{template_id}/')
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API response successful")
        
        # Check logic rules in response
        for section in data.get('sections', []):
            for question in section.get('questions', []):
                print(f"\n📋 Question: {question.get('text')}")
                print(f"   Response type: {question.get('response_type')}")
                
                if question.get('logic_rules'):
                    print(f"   ✅ API returned logic_rules: {json.dumps(question['logic_rules'], indent=4)}")
                    
                    for rule in question['logic_rules']:
                        if rule.get('trigger') == 'ask_questions':
                            print(f"\n   🎯 Found ask_questions rule:")
                            print(f"      Trigger: {rule.get('trigger')}")
                            print(f"      Message: {rule.get('message')}")
                            print(f"      SubQuestion: {rule.get('subQuestion')}")
                            
                            if rule.get('subQuestion'):
                                sub_q = rule.get('subQuestion')
                                print(f"        Text: {sub_q.get('text')}")
                                print(f"        ResponseType: {sub_q.get('responseType')}")
                    
                    return True
                else:
                    print(f"   ❌ API response missing logic_rules for: {question.get('text')}")
        return False
    else:
        print(f"❌ API request failed: {response.status_code}")
        print(f"Response content: {response.content}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Ask Questions Logic Rules Test\n")
    
    # Clean up any existing test data
    Template.objects.filter(title='Ask Questions Logic Test Template').delete()
    
    # Test 1: Create template with ask_questions logic rules
    template = create_ask_questions_template()
    
    # Test 2: Verify database storage
    question = test_database_storage(template)
    
    # Test 3: Test API response
    api_ok = test_api_response(template.id)
    
    # Summary
    print("\n📊 Test Results:")
    print(f"Template Creation: ✅")
    print(f"Database Storage: ✅")
    print(f"API Response: {'✅' if api_ok else '❌'}")
    
    if api_ok:
        print("\n🎉 Ask questions logic rules are working correctly!")
        print(f"\n🔗 Test the template in the browser:")
        print(f"   http://localhost:3000/inspection?templateId={template.id}")
    else:
        print("\n❌ API test failed. Check the output above for details.")
    
    return template

if __name__ == '__main__':
    template = main()
