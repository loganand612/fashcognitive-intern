#!/usr/bin/env python3

import os
import sys
import django
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FC.settings')
django.setup()

from users.models import Template, Section, Question, Inspection, Response as ResponseModel, InspectionResponse, CustomUser

def test_garment_data_submission():
    """Test submitting and retrieving garment data"""
    
    # Create a test user
    user, created = CustomUser.objects.get_or_create(
        email='garment_test@example.com',
        defaults={
            'username': 'garment_test',
            'first_name': 'Garment',
            'last_name': 'Tester',
            'phone': '123-456-7890',
            'company_name': 'Test Company',
            'industry_type': 'Manufacturing',
            'job_title': 'Inspector',
            'company_size': 50
        }
    )
    
    # Create a test template with garment section
    template, created = Template.objects.get_or_create(
        title='Garment Test Template',
        defaults={
            'description': 'Template for testing garment data',
            'user': user
        }
    )
    
    # Create a garment section
    garment_section, created = Section.objects.get_or_create(
        template=template,
        title='Garment Inspection Details',
        defaults={
            'description': 'Garment inspection section',
            'order': 1,
            'is_garment_section': True,
            'aql_level': '2.5',
            'inspection_level': 'II',
            'sampling_plan': 'Single',
            'severity': 'Normal',
            'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
            'colors': ['BLUE', 'RED', 'BLACK'],
            'include_carton_offered': True,
            'include_carton_inspected': True,
            'default_defects': ['Stitching', 'Fabric', 'Color', 'Measurement', 'Packing']
        }
    )
    
    # Create an inspection
    inspection = Inspection.objects.create(
        template=template,
        title=f"Garment Test Inspection",
        conducted_by=user.email,
        status='completed'
    )
    
    # Create test garment data
    test_garment_data = {
        'quantities': {
            'BLUE': {
                'S': {'orderQty': '0', 'offeredQty': '0'},
                'M': {'orderQty': '0', 'offeredQty': '0'}
            },
            'RED': {
                'S': {'orderQty': '0', 'offeredQty': '0'},
                'M': {'orderQty': '0', 'offeredQty': '0'}
            }
        },
        'cartonOffered': '0',
        'cartonInspected': '0',
        'cartonToInspect': '0',
        'defects': [
            {'type': 'Stitching', 'remarks': 'Minor loose threads', 'critical': 0, 'major': 2, 'minor': 5},
            {'type': 'Fabric', 'remarks': 'Small stain', 'critical': 0, 'major': 1, 'minor': 3}
        ],
        'aqlSettings': {
            'aqlLevel': '2.5',
            'inspectionLevel': 'II',
            'samplingPlan': 'Single',
            'severity': 'Normal',
            'status': 'PASS'
        }
    }
    
    # Store garment data directly in inspection
    inspection.garment_data = test_garment_data
    inspection.save()
    
    print(f"Created test inspection with ID: {inspection.id}")
    print(f"Stored garment data: {test_garment_data}")
    
    # Now test retrieval
    print("\n--- Testing Retrieval ---")

    # Refresh the inspection from database
    inspection.refresh_from_db()
    garment_data = inspection.garment_data or {}

    if garment_data:
        print("✅ Garment data retrieval successful!")
        print(f"Retrieved garment data: {garment_data}")
        print(f"Quantities: {garment_data.get('quantities', {})}")
        print(f"Carton info: Offered={garment_data.get('cartonOffered')}, Inspected={garment_data.get('cartonInspected')}")
        print(f"Defects: {len(garment_data.get('defects', []))} defects found")
        print(f"AQL Status: {garment_data.get('aqlSettings', {}).get('status')}")
    else:
        print("❌ No garment data found!")
    
    return inspection.id

if __name__ == '__main__':
    inspection_id = test_garment_data_submission()
    print(f"\nYou can test the report at: http://localhost:3000/inspection-report/{inspection_id}")
