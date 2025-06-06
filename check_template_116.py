#!/usr/bin/env python3
"""
Check what's actually stored for template 116
"""
import json
import sqlite3
import os

def check_template_116():
    print("🔍 Checking Template 116 Data")
    print("=" * 50)
    
    # Try to find the database file
    db_paths = [
        'db.sqlite3',
        'FC/db.sqlite3',
        '../db.sqlite3'
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ Could not find database file")
        return
    
    print(f"📁 Using database: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if template 116 exists
        cursor.execute("SELECT id, title, description FROM users_template WHERE id = 116")
        template = cursor.fetchone()
        
        if not template:
            print("❌ Template 116 not found")
            return
        
        print(f"✅ Found Template 116: {template[1]}")
        print(f"   Description: {template[2]}")
        
        # Get sections for this template
        cursor.execute("SELECT id, title FROM users_section WHERE template_id = 116")
        sections = cursor.fetchall()
        
        print(f"\n📋 Found {len(sections)} sections:")
        for section in sections:
            print(f"   Section {section[0]}: {section[1]}")
        
        # Get questions with logic rules
        cursor.execute("""
            SELECT q.id, q.text, q.response_type, q.logic_rules 
            FROM users_question q 
            JOIN users_section s ON q.section_id = s.id 
            WHERE s.template_id = 116 AND q.logic_rules IS NOT NULL AND q.logic_rules != '[]'
        """)
        questions = cursor.fetchall()
        
        print(f"\n❓ Found {len(questions)} questions with logic rules:")
        for question in questions:
            print(f"\n   Question {question[0]}: {question[1]}")
            print(f"   Response Type: {question[2]}")
            print(f"   Logic Rules: {question[3]}")
            
            # Try to parse the logic rules JSON
            try:
                if question[3]:
                    rules = json.loads(question[3])
                    if isinstance(rules, list):
                        for i, rule in enumerate(rules):
                            print(f"     Rule {i+1}:")
                            print(f"       - Trigger: {rule.get('trigger', 'N/A')}")
                            print(f"       - Condition: {rule.get('condition', 'N/A')}")
                            print(f"       - Value: {rule.get('value', 'N/A')}")
                            print(f"       - Message: '{rule.get('message', 'N/A')}'")
                            print(f"       - Message Type: {type(rule.get('message', 'N/A'))}")
                            
                            # Check for nested structures
                            if 'triggerConfig' in rule:
                                print(f"       - TriggerConfig: {rule['triggerConfig']}")
                            if 'trigger_config' in rule:
                                print(f"       - trigger_config: {rule['trigger_config']}")
                    else:
                        print(f"     ⚠️  Logic rules is not a list: {type(rules)}")
            except json.JSONDecodeError as e:
                print(f"     ❌ Failed to parse logic rules JSON: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error accessing database: {e}")

if __name__ == "__main__":
    check_template_116()
