#!/usr/bin/env python3
"""
Test script to simulate the data flow and identify where the message is lost
"""

import json

def simulate_frontend_to_snake_case(obj):
    """Simulate the toSnakeCase function from the frontend"""
    if isinstance(obj, list):
        return [simulate_frontend_to_snake_case(item) for item in obj]
    elif isinstance(obj, dict):
        new_obj = {}
        for key, value in obj.items():
            # Convert camelCase to snake_case
            snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
            new_obj[snake_key] = simulate_frontend_to_snake_case(value)
        return new_obj
    else:
        return obj

def simulate_frontend_logic_rule():
    """Simulate a logic rule as created by the frontend"""
    return {
        "id": "rule-123",
        "condition": "equal to",
        "value": 4,
        "trigger": "display_message",
        "message": "This is my custom trigger message!"  # Direct property, not nested
    }

def simulate_inspection_message_extraction(rule):
    """Simulate the message extraction logic from Inspection.tsx"""
    # Original logic (before fix) - should work now since message is direct property
    message_original = rule.get('message') or rule.get('triggerConfig', {}).get('message') or ''

    # Fixed logic (after fix) - same as original since message is direct
    message_fixed = (rule.get('message') or
                    rule.get('triggerConfig', {}).get('message') or
                    rule.get('trigger_config', {}).get('message') or '')

    return message_original, message_fixed

def main():
    print("🧪 Testing Message Structure Flow")
    print("=" * 50)
    
    # Step 1: Frontend creates logic rule
    frontend_rule = simulate_frontend_logic_rule()
    print("1. Frontend creates rule:")
    print(json.dumps(frontend_rule, indent=2))
    
    # Step 2: Frontend converts to snake_case before sending to backend
    snake_case_rule = simulate_frontend_to_snake_case(frontend_rule)
    print("\n2. After toSnakeCase conversion (sent to backend):")
    print(json.dumps(snake_case_rule, indent=2))
    
    # Step 3: Backend stores this in database (no change)
    database_rule = snake_case_rule
    print("\n3. Stored in database:")
    print(json.dumps(database_rule, indent=2))
    
    # Step 4: Backend returns this to inspection page (no change)
    api_response_rule = database_rule
    print("\n4. API returns to inspection page:")
    print(json.dumps(api_response_rule, indent=2))
    
    # Step 5: Inspection page tries to extract message
    message_original, message_fixed = simulate_inspection_message_extraction(api_response_rule)
    
    print("\n5. Message extraction results:")
    print(f"   Original logic result: '{message_original}'")
    print(f"   Fixed logic result: '{message_fixed}'")
    
    # Analysis
    print("\n📊 Analysis:")
    if message_original:
        print("   ✅ Original logic would work")
    else:
        print("   ❌ Original logic fails - message not found")
        
    if message_fixed:
        print("   ✅ Fixed logic works")
    else:
        print("   ❌ Fixed logic also fails")
        
    # Show the actual structure
    print("\n🔍 Detailed structure analysis:")
    print(f"   rule.message: {api_response_rule.get('message')}")
    print(f"   rule.triggerConfig: {api_response_rule.get('triggerConfig')}")
    print(f"   rule.trigger_config: {api_response_rule.get('trigger_config')}")
    
    if 'trigger_config' in api_response_rule:
        print(f"   rule.trigger_config.message: {api_response_rule['trigger_config'].get('message')}")

if __name__ == "__main__":
    main()
