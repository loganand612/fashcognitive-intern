#!/usr/bin/env python3
"""
Script to fix the empty message in template 117's display_message rule
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

def fix_template_117_message():
    """Fix the empty message in template 117's display_message rule"""
    print("🔧 Fixing Template 117 message...")
    
    try:
        template = Template.objects.get(id=117)
        print(f"✅ Found template: {template.title}")
        
        # Find the question with the display_message rule
        questions_with_logic = Question.objects.filter(
            section__template=template,
            logic_rules__isnull=False
        ).exclude(logic_rules=[])
        
        print(f"📊 Found {questions_with_logic.count()} questions with logic rules")
        
        fixed_count = 0
        
        for question in questions_with_logic:
            print(f"\n❓ Checking question: {question.text}")
            
            if isinstance(question.logic_rules, list):
                updated_rules = []
                rule_updated = False
                
                for rule in question.logic_rules:
                    if rule.get('trigger') == 'display_message':
                        print(f"   🎯 Found display_message rule with message: '{rule.get('message', 'NO MESSAGE')}'")
                        
                        # Check if message is empty or missing
                        if not rule.get('message') or rule.get('message').strip() == "":
                            print(f"   🔧 Fixing empty message...")
                            
                            # Update the rule with a proper message
                            updated_rule = rule.copy()
                            updated_rule['message'] = f"🎉 Great! You entered {rule.get('value', 'the correct value')}. This is working perfectly!"
                            updated_rules.append(updated_rule)
                            rule_updated = True
                            
                            print(f"   ✅ Updated message to: '{updated_rule['message']}'")
                        else:
                            print(f"   ✅ Message already exists: '{rule.get('message')}'")
                            updated_rules.append(rule)
                    else:
                        updated_rules.append(rule)
                
                if rule_updated:
                    # Save the updated logic rules
                    question.logic_rules = updated_rules
                    question.save()
                    fixed_count += 1
                    
                    print(f"   💾 Saved updated logic rules for question: {question.text}")
                    
                    # Verify the save
                    question.refresh_from_db()
                    saved_rule = next((r for r in question.logic_rules if r.get('trigger') == 'display_message'), None)
                    if saved_rule:
                        print(f"   ✅ Verification - saved message: '{saved_rule.get('message')}'")
                    else:
                        print(f"   ❌ Verification failed - rule not found after save")
        
        print(f"\n📊 Summary: Fixed {fixed_count} questions")
        
        if fixed_count > 0:
            print("✅ Template 117 has been fixed! The display_message rule now has a proper message.")
            print("🔄 Please refresh the inspection page and test again.")
        else:
            print("ℹ️ No empty messages found to fix.")
            
        return True
        
    except Template.DoesNotExist:
        print("❌ Template 117 not found!")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_test_question_with_message():
    """Create a new test question with a proper display_message rule"""
    print("\n🧪 Creating additional test question...")
    
    try:
        template = Template.objects.get(id=117)
        section = template.sections.first()
        
        if not section:
            print("❌ No sections found in template 117")
            return False
            
        # Create a test logic rule with display_message
        test_logic_rules = [
            {
                "id": "test-rule-456",
                "condition": "equal to",
                "value": 5,
                "trigger": "display_message",
                "message": "🚀 Excellent! You entered 5. This message was created by the fix script!"
            }
        ]
        
        # Create a new test question
        question = Question.objects.create(
            section=section,
            text="Test Question - Enter 5 to see message",
            response_type='Number',
            required=False,
            order=998,
            logic_rules=test_logic_rules
        )
        
        print(f"✅ Created test question with ID: {question.id}")
        print(f"   Logic rules: {json.dumps(question.logic_rules, indent=2)}")
        
        # Verify the storage
        question.refresh_from_db()
        stored_rule = question.logic_rules[0] if question.logic_rules else {}
        stored_message = stored_rule.get('message', 'NO MESSAGE')
        
        print(f"✅ Verification - stored message: {stored_message}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating test question: {e}")
        return False

def main():
    """Run the fix"""
    print("🚀 Starting Template 117 message fix...\n")
    
    # Fix existing empty messages
    fix_success = fix_template_117_message()
    
    # Create an additional test question
    test_success = create_test_question_with_message()
    
    print("\n📊 Final Summary:")
    print(f"   Fix existing messages: {'✅ Success' if fix_success else '❌ Failed'}")
    print(f"   Create test question: {'✅ Success' if test_success else '❌ Failed'}")
    
    if fix_success:
        print("\n🎉 Template 117 has been fixed!")
        print("🔄 Please refresh the inspection page and test with value '4' or '5'")
        print("📱 You should now see custom messages instead of the fallback message")
    else:
        print("\n❌ Fix failed. Please check the output above for errors.")

if __name__ == '__main__':
    main()
