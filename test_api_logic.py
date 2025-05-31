#!/usr/bin/env python
"""
Test script to check if logic rules are properly stored in the database
"""
import os
import sys
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import Template, Section, Question, CustomUser
from users.serializers import TemplateSerializer

def test_database_logic_rules():
    """Test if logic rules are properly stored in database"""
    print("🔧 Testing database logic rules...")

    # Check all templates and their questions
    all_templates = Template.objects.all()
    print(f"📊 Total templates in database: {all_templates.count()}")

    for template in all_templates:
        print(f"\n🔍 Template: {template.title} (ID: {template.id})")
        questions = Question.objects.filter(section__template=template)

        for question in questions:
            if question.logic_rules and len(question.logic_rules) > 0:
                print(f"  ✅ Question with logic: {question.text}")
                print(f"     Logic rules: {question.logic_rules}")
            else:
                print(f"  ❌ Question without logic: {question.text}")

    # Find a template with actual logic rules (not empty arrays)
    templates_with_logic = Template.objects.filter(
        sections__questions__logic_rules__isnull=False
    ).exclude(
        sections__questions__logic_rules=[]
    ).distinct()

    if not templates_with_logic.exists():
        print("\n❌ No templates with actual logic rules found")
        return False

    template = templates_with_logic.first()
    print(f"\n✅ Found template with actual logic rules: {template.title} (ID: {template.id})")

    # Check questions with logic rules
    questions_with_logic = Question.objects.filter(
        section__template=template,
        logic_rules__isnull=False
    ).exclude(logic_rules=[])

    print(f"✅ Found {questions_with_logic.count()} questions with actual logic rules")

    for question in questions_with_logic:
        print(f"  - Question: {question.text}")
        print(f"    Logic rules: {question.logic_rules}")

    # Test serialization
    try:
        serializer = TemplateSerializer(template)
        data = serializer.data
        print("✅ Template serialized successfully")

        # Check if logic rules are in the serialized data
        logic_found = False
        for section in data.get('sections', []):
            for question in section.get('questions', []):
                if question.get('logic_rules'):
                    logic_found = True
                    print(f"✅ Logic rules found in serialized data for question: {question.get('text')}")
                    print(f"   Rules: {question.get('logic_rules')}")

        if not logic_found:
            print("❌ No logic rules found in serialized data")
            return False

        return True

    except Exception as e:
        print(f"❌ Serialization failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Database Logic Rules Test\n")

    db_test = test_database_logic_rules()

    print(f"\n📊 Test Results:")
    print(f"Database Logic Rules: {'✅' if db_test else '❌'}")

    if db_test:
        print("\n🎉 Database test passed! Logic rules are properly stored and serialized.")
    else:
        print("\n❌ Database test failed. Check the output above for details.")
