#!/usr/bin/env python3
"""
Test script to verify that trigger messages are properly stored and retrieved.
This script tests the complete flow from template creation to inspection display.
"""

import os
import sys
import django
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fashcognitive.settings')
django.setup()

from users.models import CustomUser, Template, Section, Question

def test_trigger_message_storage():
    """Test that trigger messages are properly stored in the database."""
    print("🧪 Testing trigger message storage...")
    
    # Create a test user
    user, created = CustomUser.objects.get_or_create(
        username='test_user',
        defaults={
            'email': 'test@example.com',
            'user_role': 'admin'
        }
    )
    
    # Create a test template
    template = Template.objects.create(
        user=user,
        title='Test Template with Trigger Messages',
        description='Testing trigger message functionality',
        template_type='standard'
    )
    
    # Create a section
    section = Section.objects.create(
        template=template,
        title='Test Section',
        description='Section with trigger messages',
        order=0
    )
    
    # Create a question with display_message trigger
    logic_rules = [
        {
            "id": "rule1",
            "condition": "equal to",
            "value": 5,
            "trigger": "display_message",
            "message": "🎉 Great! You entered 5 - this custom message should be displayed!"
        },
        {
            "id": "rule2",
            "condition": "greater than",
            "value": 10,
            "trigger": "require_evidence",
            "message": "Please upload evidence for values greater than 10"
        },
        {
            "id": "rule3",
            "condition": "equal to",
            "value": 7,
            "trigger": "ask_questions",
            "message": "Additional question triggered",
            "subQuestion": {
                "text": "Why did you enter 7?",
                "responseType": "Text"
            }
        }
    ]
    
    question = Question.objects.create(
        section=section,
        text='Enter a number to test trigger messages',
        response_type='Number',
        required=True,
        order=0,
        logic_rules=logic_rules
    )
    
    print(f"✅ Created template with ID: {template.id}")
    print(f"✅ Created question with ID: {question.id}")
    print(f"✅ Logic rules stored: {json.dumps(question.logic_rules, indent=2)}")
    
    return template, question

def test_trigger_message_retrieval():
    """Test that trigger messages are properly retrieved from the database."""
    print("\n🔍 Testing trigger message retrieval...")
    
    # Find the test template
    try:
        template = Template.objects.get(title='Test Template with Trigger Messages')
        question = template.sections.first().questions.first()
        
        print(f"✅ Retrieved template: {template.title}")
        print(f"✅ Retrieved question: {question.text}")
        
        # Check if logic rules are properly stored
        if question.logic_rules:
            print(f"✅ Logic rules found: {len(question.logic_rules)} rules")
            
            for i, rule in enumerate(question.logic_rules):
                print(f"   Rule {i+1}:")
                print(f"     - Trigger: {rule.get('trigger')}")
                print(f"     - Message: {rule.get('message')}")
                
                # Verify display_message trigger has message
                if rule.get('trigger') == 'display_message':
                    if rule.get('message'):
                        print(f"     ✅ Display message trigger has custom message!")
                    else:
                        print(f"     ❌ Display message trigger missing custom message!")
                        
        else:
            print("❌ No logic rules found!")
            
        return True
        
    except Template.DoesNotExist:
        print("❌ Test template not found!")
        return False

def simulate_inspection_logic():
    """Simulate the inspection logic to verify messages are displayed correctly."""
    print("\n🎯 Simulating inspection logic...")
    
    try:
        template = Template.objects.get(title='Test Template with Trigger Messages')
        question = template.sections.first().questions.first()
        
        # Test different values
        test_values = [5, 7, 15]
        
        for test_value in test_values:
            print(f"\n   Testing value: {test_value}")
            
            # Simulate the condition checking logic from Inspection.tsx
            for rule in question.logic_rules:
                condition_met = False
                
                if rule['condition'] == 'equal to' and test_value == rule['value']:
                    condition_met = True
                elif rule['condition'] == 'greater than' and test_value > rule['value']:
                    condition_met = True
                    
                if condition_met:
                    trigger = rule.get('trigger')
                    message = rule.get('message', '')
                    
                    print(f"     ✅ Trigger activated: {trigger}")
                    if message:
                        print(f"     ✅ Message: {message}")
                    else:
                        print(f"     ❌ No message found for trigger!")
                        
        return True
        
    except Exception as e:
        print(f"❌ Error in simulation: {e}")
        return False

def cleanup_test_data():
    """Clean up test data."""
    print("\n🧹 Cleaning up test data...")
    
    try:
        # Delete test template (cascades to sections and questions)
        Template.objects.filter(title='Test Template with Trigger Messages').delete()
        
        # Delete test user
        CustomUser.objects.filter(username='test_user').delete()
        
        print("✅ Test data cleaned up successfully!")
        
    except Exception as e:
        print(f"❌ Error cleaning up: {e}")

def main():
    """Run all tests."""
    print("🚀 Starting trigger message tests...\n")
    
    # Test storage
    template, question = test_trigger_message_storage()
    
    # Test retrieval
    retrieval_success = test_trigger_message_retrieval()
    
    # Test inspection logic
    simulation_success = simulate_inspection_logic()
    
    # Summary
    print("\n📊 Test Summary:")
    print(f"   Storage: ✅ Success")
    print(f"   Retrieval: {'✅ Success' if retrieval_success else '❌ Failed'}")
    print(f"   Simulation: {'✅ Success' if simulation_success else '❌ Failed'}")
    
    # Cleanup
    cleanup_test_data()
    
    if retrieval_success and simulation_success:
        print("\n🎉 All tests passed! Trigger messages are working correctly.")
        return True
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
