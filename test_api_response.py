#!/usr/bin/env python3
"""
Test script to check the API response for template 117
and verify message storage in logic rules.
"""

import requests
import json

def test_api_response():
    """Test the API response for template 117"""
    print("🔍 Testing API response for template 117...")
    
    # API endpoint - correct path based on URL patterns
    url = "http://localhost:8000/api/templates/templates/117/"
    
    try:
        # Make the API request
        response = requests.get(url)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response received successfully")
            
            # Check if template has sections
            if 'sections' in data:
                print(f"📋 Template has {len(data['sections'])} sections")
                
                for section_idx, section in enumerate(data['sections']):
                    print(f"\n📁 Section {section_idx + 1}: {section.get('title', 'No title')}")
                    
                    if 'questions' in section:
                        print(f"   Questions: {len(section['questions'])}")
                        
                        for q_idx, question in enumerate(section['questions']):
                            print(f"\n   ❓ Question {q_idx + 1}: {question.get('text', 'No text')}")
                            print(f"      Response Type: {question.get('response_type', 'Unknown')}")
                            
                            # Check logic rules
                            logic_rules = question.get('logic_rules')
                            if logic_rules:
                                print(f"      🔧 Logic Rules Found: {type(logic_rules)}")
                                print(f"      🔧 Logic Rules Content: {json.dumps(logic_rules, indent=8)}")
                                
                                # Check each rule for display_message triggers
                                if isinstance(logic_rules, list):
                                    for rule_idx, rule in enumerate(logic_rules):
                                        print(f"\n         🎯 Rule {rule_idx + 1}:")
                                        print(f"            ID: {rule.get('id', 'N/A')}")
                                        print(f"            Condition: {rule.get('condition', 'N/A')}")
                                        print(f"            Value: {rule.get('value', 'N/A')}")
                                        print(f"            Trigger: {rule.get('trigger', 'N/A')}")
                                        
                                        if rule.get('trigger') == 'display_message':
                                            print(f"            🎉 DISPLAY MESSAGE TRIGGER FOUND!")
                                            print(f"            Message: {rule.get('message', 'NO MESSAGE FOUND')}")
                                            print(f"            Message Type: {type(rule.get('message'))}")
                                            
                                            # Check all possible message locations
                                            message_checks = {
                                                'rule.message': rule.get('message'),
                                                'rule.triggerConfig': rule.get('triggerConfig'),
                                                'rule.trigger_config': rule.get('trigger_config'),
                                                'rule.config': rule.get('config'),
                                            }
                                            
                                            print(f"            📍 Message location checks:")
                                            for location, value in message_checks.items():
                                                print(f"               {location}: {value}")
                                                if isinstance(value, dict) and 'message' in value:
                                                    print(f"               {location}.message: {value['message']}")
                            else:
                                print(f"      ❌ No logic rules found")
                    else:
                        print(f"   ❌ No questions found in section")
            else:
                print(f"❌ No sections found in template")
                
        else:
            print(f"❌ API request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the Django server running on localhost:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_with_session():
    """Test with session authentication"""
    print("\n🔍 Testing with session authentication...")
    
    session = requests.Session()
    
    # First, try to get CSRF token
    csrf_url = "http://localhost:8000/api/templates/get-csrf-token/"
    try:
        csrf_response = session.get(csrf_url)
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            print(f"✅ CSRF Token obtained: {csrf_token[:20]}...")
            
            # Set CSRF token in headers
            session.headers.update({
                'X-CSRFToken': csrf_token,
                'Referer': 'http://localhost:8000'
            })
        else:
            print(f"❌ Failed to get CSRF token: {csrf_response.status_code}")
    except Exception as e:
        print(f"❌ CSRF token error: {e}")
    
    # Now try the template API
    template_url = "http://localhost:8000/api/templates/templates/117/"
    try:
        response = session.get(template_url)
        print(f"📊 Template API Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Template API successful with session")
            # Process the response similar to above
            data = response.json()
            
            # Quick check for logic rules
            logic_rules_found = 0
            display_message_rules = 0
            
            for section in data.get('sections', []):
                for question in section.get('questions', []):
                    if question.get('logic_rules'):
                        logic_rules_found += 1
                        for rule in question.get('logic_rules', []):
                            if rule.get('trigger') == 'display_message':
                                display_message_rules += 1
                                print(f"🎯 Display message rule found: {rule.get('message', 'NO MESSAGE')}")
            
            print(f"📊 Summary: {logic_rules_found} questions with logic rules, {display_message_rules} display_message rules")
            
        else:
            print(f"❌ Template API failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Template API error: {e}")

if __name__ == '__main__':
    print("🚀 Starting API response test...\n")
    
    # Test without authentication first
    test_api_response()
    
    # Test with session authentication
    test_with_session()
    
    print("\n✅ API response test completed!")
