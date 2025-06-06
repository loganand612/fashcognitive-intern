#!/usr/bin/env python
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import TemplateAssignment, CustomUser, Template

print("=== ASSIGNMENT CHECK ===")
print(f"Total assignments in database: {TemplateAssignment.objects.count()}")
print(f"Total users in database: {CustomUser.objects.count()}")
print(f"Total templates in database: {Template.objects.count()}")

# Check for inspector users
inspectors = CustomUser.objects.filter(user_role='inspector')
print(f"\nInspector users found: {inspectors.count()}")
for inspector in inspectors:
    print(f"- Inspector: {inspector.email} (ID: {inspector.id})")
    
    # Check assignments for this inspector
    assignments = TemplateAssignment.objects.filter(inspector=inspector)
    print(f"  Assignments: {assignments.count()}")
    for assignment in assignments:
        print(f"    - Template: {assignment.template.title} | Status: {assignment.status} | Due: {assignment.due_date}")

# Check for admin users
admins = CustomUser.objects.filter(user_role='admin')
print(f"\nAdmin users found: {admins.count()}")
for admin in admins:
    print(f"- Admin: {admin.email} (ID: {admin.id})")
    
    # Check assignments created by this admin
    assignments = TemplateAssignment.objects.filter(assigned_by=admin)
    print(f"  Assignments created: {assignments.count()}")

print("\n=== ASSIGNMENT DETAILS ===")
if TemplateAssignment.objects.exists():
    print("All assignments:")
    for assignment in TemplateAssignment.objects.all():
        print(f"- ID: {assignment.id}")
        print(f"  Template: {assignment.template.title} (ID: {assignment.template.id})")
        print(f"  Inspector: {assignment.inspector.email} (ID: {assignment.inspector.id})")
        print(f"  Assigned by: {assignment.assigned_by.email} (ID: {assignment.assigned_by.id})")
        print(f"  Status: {assignment.status}")
        print(f"  Due date: {assignment.due_date}")
        print(f"  Assigned at: {assignment.assigned_at}")
        print()
else:
    print("No assignments found in database.")
    print("\nTo test inspector functionality, you need to:")
    print("1. Log in as an admin user")
    print("2. Go to the Schedule page")
    print("3. Assign some templates to the inspector user")
    print("4. Then log in as the inspector to see the assignments")
