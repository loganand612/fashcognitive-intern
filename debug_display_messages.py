#!/usr/bin/env python3
"""
Script to debug display messages in inspection reports
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

from users.models import Inspection, InspectionResponse, Response as ResponseModel

def debug_latest_inspection():
    """Debug the latest inspection for display messages"""
    print("🔍 Debugging latest inspection for display messages...")
    
    try:
        # Get the latest inspection
        inspection = Inspection.objects.last()
        if not inspection:
            print("❌ No inspections found")
            return
            
        print(f"✅ Latest inspection: {inspection.id} - {inspection.title}")
        print(f"   Conducted by: {inspection.conducted_by}")
        print(f"   Created at: {inspection.created_at}")
        
        # Get all responses for this inspection
        responses = InspectionResponse.objects.filter(inspection=inspection)
        print(f"📊 Total responses: {responses.count()}")
        
        # Check for different types of responses
        regular_responses = 0
        conditional_responses = 0
        evidence_responses = 0
        display_message_responses = 0
        
        print("\n📋 Response breakdown:")
        for response in responses:
            text_response = response.response.text_response
            
            if text_response:
                if text_response.startswith('CONDITIONAL_'):
                    conditional_responses += 1
                    print(f"   🔄 Conditional: {text_response[:50]}...")
                elif text_response.startswith('EVIDENCE_'):
                    evidence_responses += 1
                    print(f"   📸 Evidence: {text_response[:50]}...")
                elif text_response.startswith('DISPLAY_MESSAGE_'):
                    display_message_responses += 1
                    print(f"   💬 Display Message: {text_response}")
                else:
                    regular_responses += 1
                    print(f"   ✅ Regular: Q{response.response.question.id} = {text_response[:30]}...")
            else:
                # Check other response types
                if response.response.number_response is not None:
                    regular_responses += 1
                    print(f"   🔢 Number: Q{response.response.question.id} = {response.response.number_response}")
                elif response.response.boolean_response is not None:
                    regular_responses += 1
                    print(f"   ✅ Boolean: Q{response.response.question.id} = {response.response.boolean_response}")
        
        print(f"\n📊 Summary:")
        print(f"   Regular responses: {regular_responses}")
        print(f"   Conditional responses: {conditional_responses}")
        print(f"   Evidence responses: {evidence_responses}")
        print(f"   Display message responses: {display_message_responses}")
        
        if display_message_responses == 0:
            print("\n❌ No display messages found! This means:")
            print("   1. No display message logic was triggered during inspection")
            print("   2. Display messages weren't submitted properly")
            print("   3. Display messages weren't stored properly")
            
            # Let's check if there are any templates with display message logic
            from users.models import Question
            questions_with_display_logic = Question.objects.filter(
                logic_rules__isnull=False
            ).exclude(logic_rules=[])
            
            display_message_count = 0
            for question in questions_with_display_logic:
                if isinstance(question.logic_rules, list):
                    for rule in question.logic_rules:
                        if rule.get('trigger') == 'display_message':
                            display_message_count += 1
                            print(f"   📋 Found display_message rule in Q{question.id}: {rule.get('message', 'NO MESSAGE')}")
            
            print(f"   Total display_message rules in database: {display_message_count}")
        
        return inspection.id
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_api_response(inspection_id):
    """Test the API response for display messages"""
    print(f"\n🔍 Testing API response for inspection {inspection_id}...")
    
    try:
        import requests
        
        # Test the API endpoint
        url = f"http://localhost:8000/api/users/inspection/{inspection_id}/"
        print(f"   Calling: {url}")
        
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            
            print(f"   ✅ API Response received")
            print(f"   📊 Keys in response: {list(data.keys())}")
            
            if 'display_messages' in data:
                display_messages = data['display_messages']
                print(f"   💬 Display messages: {display_messages}")
                
                if display_messages:
                    print(f"   ✅ Found {len(display_messages)} display messages!")
                    for question_id, message in display_messages.items():
                        print(f"      Q{question_id}: {message}")
                else:
                    print(f"   ❌ Display messages object is empty")
            else:
                print(f"   ❌ No 'display_messages' key in API response")
                
        else:
            print(f"   ❌ API call failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error testing API: {e}")

if __name__ == "__main__":
    inspection_id = debug_latest_inspection()
    if inspection_id:
        test_api_response(inspection_id)
