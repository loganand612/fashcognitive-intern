#!/usr/bin/env python
"""
Debug script to check what's actually stored in the database for logic rules
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import Template, Question

def debug_logic_rules():
    print("🔍 Debugging Logic Rules in Database")
    print("=" * 50)
    
    # Get all templates
    templates = Template.objects.all()
    print(f"Found {templates.count()} templates")
    
    for template in templates:
        print(f"\n📋 Template: {template.title} (ID: {template.id})")
        
        # Get all questions with logic rules
        questions_with_logic = Question.objects.filter(
            section__template=template,
            logic_rules__isnull=False
        ).exclude(logic_rules={})
        
        if questions_with_logic.exists():
            print(f"  Found {questions_with_logic.count()} questions with logic rules:")
            
            for question in questions_with_logic:
                print(f"\n  ❓ Question: {question.text}")
                print(f"     Response Type: {question.response_type}")
                print(f"     Logic Rules: {question.logic_rules}")
                
                # Check if logic_rules is a list and examine each rule
                if isinstance(question.logic_rules, list):
                    for i, rule in enumerate(question.logic_rules):
                        print(f"     Rule {i+1}:")
                        print(f"       - ID: {rule.get('id', 'N/A')}")
                        print(f"       - Condition: {rule.get('condition', 'N/A')}")
                        print(f"       - Value: {rule.get('value', 'N/A')}")
                        print(f"       - Trigger: {rule.get('trigger', 'N/A')}")
                        print(f"       - Message: '{rule.get('message', 'N/A')}'")
                        print(f"       - Message Type: {type(rule.get('message', 'N/A'))}")
                        
                        # Check for triggerConfig
                        trigger_config = rule.get('triggerConfig')
                        if trigger_config:
                            print(f"       - TriggerConfig: {trigger_config}")
                            if isinstance(trigger_config, dict):
                                print(f"         - TriggerConfig Message: '{trigger_config.get('message', 'N/A')}'")
                else:
                    print(f"     ⚠️  Logic rules is not a list: {type(question.logic_rules)}")
        else:
            print("  No questions with logic rules found")

if __name__ == "__main__":
    debug_logic_rules()
