#!/usr/bin/env python3
"""
Script to check if display_message triggers are properly stored in the database
and verify the message content structure.
"""

import os
import sys
import django
import json

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import Template, Question

def check_template_117_messages():
    """Check template 117 specifically for message storage"""
    print("🔍 Checking Template 117 for message storage...")
    
    try:
        template = Template.objects.get(id=117)
        print(f"✅ Found template: {template.title}")
        
        # Get all questions with logic rules
        questions_with_logic = Question.objects.filter(
            section__template=template,
            logic_rules__isnull=False
        ).exclude(logic_rules=[])
        
        print(f"📊 Found {questions_with_logic.count()} questions with logic rules")
        
        for question in questions_with_logic:
            print(f"\n❓ Question: {question.text}")
            print(f"   Response Type: {question.response_type}")
            print(f"   Logic Rules Type: {type(question.logic_rules)}")
            print(f"   Logic Rules: {json.dumps(question.logic_rules, indent=2)}")
            
            # Check each rule for display_message triggers
            if isinstance(question.logic_rules, list):
                for i, rule in enumerate(question.logic_rules):
                    print(f"\n   🔧 Rule {i+1}:")
                    print(f"      ID: {rule.get('id', 'N/A')}")
                    print(f"      Condition: {rule.get('condition', 'N/A')}")
                    print(f"      Value: {rule.get('value', 'N/A')}")
                    print(f"      Trigger: {rule.get('trigger', 'N/A')}")
                    
                    if rule.get('trigger') == 'display_message':
                        print(f"      🎯 DISPLAY MESSAGE TRIGGER FOUND!")
                        print(f"      Message: {rule.get('message', 'NO MESSAGE FOUND')}")
                        print(f"      Message Type: {type(rule.get('message'))}")
                        print(f"      Has Message: {bool(rule.get('message'))}")
                        
                        # Check all possible message locations
                        message_locations = {
                            'rule.message': rule.get('message'),
                            'rule.triggerConfig.message': rule.get('triggerConfig', {}).get('message') if isinstance(rule.get('triggerConfig'), dict) else None,
                            'rule.trigger_config.message': rule.get('trigger_config', {}).get('message') if isinstance(rule.get('trigger_config'), dict) else None,
                            'rule.config.message': rule.get('config', {}).get('message') if isinstance(rule.get('config'), dict) else None,
                        }
                        
                        print(f"      📍 Message locations check:")
                        for location, value in message_locations.items():
                            print(f"         {location}: {value} (type: {type(value)})")
                            
                        # Check if message is stored in any nested structure
                        print(f"      🔍 Full rule structure:")
                        for key, value in rule.items():
                            print(f"         {key}: {value} (type: {type(value)})")
                            
    except Template.DoesNotExist:
        print("❌ Template 117 not found!")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
        
    return True

def check_all_display_message_rules():
    """Check all templates for display_message rules"""
    print("\n🔍 Checking all templates for display_message rules...")
    
    # Find all questions with display_message triggers
    all_questions = Question.objects.filter(
        logic_rules__isnull=False
    ).exclude(logic_rules=[])
    
    display_message_count = 0
    
    for question in all_questions:
        if isinstance(question.logic_rules, list):
            for rule in question.logic_rules:
                if rule.get('trigger') == 'display_message':
                    display_message_count += 1
                    print(f"\n📋 Template: {question.section.template.title} (ID: {question.section.template.id})")
                    print(f"   Question: {question.text}")
                    print(f"   Rule: {json.dumps(rule, indent=2)}")
                    
    print(f"\n📊 Total display_message rules found: {display_message_count}")

def create_test_question_with_message():
    """Create a test question with a display_message rule to verify storage"""
    print("\n🧪 Creating test question with display_message rule...")
    
    try:
        # Find template 117 or create a test template
        template = Template.objects.get(id=117)
        section = template.sections.first()
        
        if not section:
            print("❌ No sections found in template 117")
            return False
            
        # Create a test logic rule with display_message
        test_logic_rules = [
            {
                "id": "test-rule-123",
                "condition": "equal to",
                "value": 99,
                "trigger": "display_message",
                "message": "🎉 TEST MESSAGE: This is a test message created by the script!"
            }
        ]
        
        # Create or update a test question
        question, created = Question.objects.get_or_create(
            section=section,
            text="Test Question for Message Storage",
            defaults={
                'response_type': 'Number',
                'required': False,
                'order': 999,
                'logic_rules': test_logic_rules
            }
        )
        
        if not created:
            question.logic_rules = test_logic_rules
            question.save()
            
        print(f"✅ {'Created' if created else 'Updated'} test question with ID: {question.id}")
        print(f"   Logic rules stored: {json.dumps(question.logic_rules, indent=2)}")
        
        # Verify the storage by re-fetching
        question.refresh_from_db()
        stored_rule = question.logic_rules[0] if question.logic_rules else {}
        stored_message = stored_rule.get('message', 'NO MESSAGE')
        
        print(f"✅ Verification - stored message: {stored_message}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test question: {e}")
        return False

def main():
    """Run all checks"""
    print("🚀 Starting message storage verification...\n")
    
    # Check template 117 specifically
    template_117_ok = check_template_117_messages()
    
    # Check all display_message rules
    check_all_display_message_rules()
    
    # Create a test question to verify storage works
    test_creation_ok = create_test_question_with_message()
    
    print("\n📊 Summary:")
    print(f"   Template 117 check: {'✅ Success' if template_117_ok else '❌ Failed'}")
    print(f"   Test creation: {'✅ Success' if test_creation_ok else '❌ Failed'}")
    
    if template_117_ok and test_creation_ok:
        print("\n🎉 Message storage verification completed!")
    else:
        print("\n❌ Some checks failed. Please review the output above.")

if __name__ == '__main__':
    main()
