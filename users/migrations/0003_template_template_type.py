# Generated by Django 5.1.6 on 2025-05-09 04:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_section_aql_level_section_colors_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='template',
            name='template_type',
            field=models.CharField(choices=[('standard', 'Standard'), ('garment', 'Garment')], default='standard', max_length=20),
        ),
    ]
