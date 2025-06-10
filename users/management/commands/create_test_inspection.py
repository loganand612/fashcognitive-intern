from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Template, Section, Question, QuestionOption, Inspection, Response, InspectionResponse
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test inspection data for testing the report functionality'

    def handle(self, *args, **options):
        try:
            # Get or create a test user
            try:
                user = User.objects.get(email='test@example.com')
                created = False
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username='testinspector',
                    email='test@example.com',
                    first_name='Test',
                    last_name='Inspector',
                    user_role='inspector',
                    company_name='Test Company',
                    industry_type='Manufacturing',
                    job_title='Inspector',
                    company_size=100,
                    password='testpass123'
                )
                created = True
            if created:
                self.stdout.write(f"Created test user: {user.username}")
            else:
                self.stdout.write(f"Using existing user: {user.username}")

            # Get or create a test template
            template, created = Template.objects.get_or_create(
                title='Test Inspection Template',
                defaults={
                    'description': 'A test template for inspection reports',
                    'user': user
                }
            )
            if created:
                self.stdout.write(f"Created test template: {template.title}")

            # Create a test section
            section, created = Section.objects.get_or_create(
                template=template,
                title='General Questions',
                defaults={
                    'description': 'General inspection questions',
                    'order': 1
                }
            )
            if created:
                self.stdout.write(f"Created test section: {section.title}")

            # Create test questions with logic rules
            questions_data = [
                {
                    'text': 'Is the product quality acceptable?',
                    'response_type': 'Yes/No',
                    'required': True,
                    'logic_rules': [
                        {
                            "id": "rule1",
                            "condition": "is",
                            "value": "No",
                            "trigger": "require_evidence",
                            "message": "Please upload evidence of quality issues"
                        },
                        {
                            "id": "rule2",
                            "condition": "is",
                            "value": "No",
                            "trigger": "ask_questions",
                            "message": "Additional details required",
                            "subQuestion": {
                                "text": "What specific quality issues did you observe?",
                                "responseType": "Text"
                            }
                        }
                    ]
                },
                {
                    'text': 'Rate the overall condition (1-10)',
                    'response_type': 'Number',
                    'required': True,
                    'logic_rules': [
                        {
                            "id": "rule3",
                            "condition": "less than",
                            "value": 5,
                            "trigger": "display_message",
                            "message": "⚠️ Low rating detected - please review carefully"
                        },
                        {
                            "id": "rule4",
                            "condition": "equal to",
                            "value": 10,
                            "trigger": "display_message",
                            "message": "🎉 Perfect score! Excellent work!"
                        }
                    ]
                },
                {
                    'text': 'Additional comments',
                    'response_type': 'Text',
                    'required': False
                },
                {
                    'text': 'Select applicable issues',
                    'response_type': 'Multiple Choice',
                    'required': False,
                    'options': ['Defects', 'Packaging Issues', 'Color Mismatch', 'Size Issues']
                }
            ]

            questions = []
            for i, q_data in enumerate(questions_data):
                defaults = {
                    'response_type': q_data['response_type'],
                    'required': q_data['required'],
                    'order': i + 1
                }

                # Add logic rules if they exist
                if 'logic_rules' in q_data:
                    defaults['logic_rules'] = q_data['logic_rules']

                question, created = Question.objects.get_or_create(
                    section=section,
                    text=q_data['text'],
                    defaults=defaults
                )
                questions.append(question)
                if created:
                    self.stdout.write(f"Created test question: {question.text}")

                    # Create options for multiple choice questions
                    if 'options' in q_data and q_data['options']:
                        for j, option_text in enumerate(q_data['options']):
                            QuestionOption.objects.get_or_create(
                                question=question,
                                text=option_text,
                                defaults={'order': j + 1}
                            )

            # Create a test inspection
            inspection, created = Inspection.objects.get_or_create(
                template=template,
                title='Test Inspection Report',
                defaults={
                    'conducted_by': f"{user.first_name} {user.last_name}",
                    'location': 'Test Facility',
                    'site': 'Main Site',
                    'status': 'completed'
                }
            )
            if created:
                self.stdout.write(f"Created test inspection: {inspection.title}")

            # Create test responses (including some that trigger logic rules)
            responses_data = [
                {'question': questions[0], 'boolean_response': False},  # This will trigger evidence requirement and conditional question
                {'question': questions[1], 'number_response': 3},  # This will trigger low rating message
                {'question': questions[2], 'text_response': 'Overall poor quality with major issues'},
                {'question': questions[3], 'text_response': json.dumps(['Defects', 'Packaging Issues'])}
            ]

            for r_data in responses_data:
                # Create Response object
                response, created = Response.objects.get_or_create(
                    question=r_data['question'],
                    defaults=r_data
                )
                if created:
                    self.stdout.write(f"Created response for: {response.question.text}")

                # Create InspectionResponse linking
                inspection_response, created = InspectionResponse.objects.get_or_create(
                    inspection=inspection,
                    response=response
                )
                if created:
                    self.stdout.write(f"Linked response to inspection")

            # Add some conditional responses to simulate triggered logic rules
            # Conditional answer for the first question (quality not acceptable)
            conditional_response = Response(question=questions[0])
            conditional_response.text_response = f"CONDITIONAL_{questions[0].id}_rule2_conditional:Poor stitching and loose threads observed throughout the garment"
            conditional_response.save()

            InspectionResponse.objects.create(
                inspection=inspection,
                response=conditional_response
            )
            self.stdout.write("Created conditional answer for quality question")

            # Evidence for the first question
            evidence_response = Response(question=questions[0])
            evidence_response.text_response = f"EVIDENCE_{questions[0].id}_rule1:data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            evidence_response.save()

            InspectionResponse.objects.create(
                inspection=inspection,
                response=evidence_response
            )
            self.stdout.write("Created evidence for quality question")

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created test inspection with ID: {inspection.id}\n'
                    f'You can now test the report at: /inspection-report/{inspection.id}'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating test data: {str(e)}')
            )
