# Generated by Django 5.1.6 on 2025-04-28 13:38

import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="Inspection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                (
                    "conducted_by",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "conducted_at",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                ("location", models.CharField(blank=True, max_length=255, null=True)),
                ("site", models.CharField(blank=True, max_length=255, null=True)),
                ("status", models.CharField(default="draft", max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "inspections",
            },
        ),
        migrations.CreateModel(
            name="Question",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("text", models.CharField(max_length=500)),
                (
                    "response_type",
                    models.CharField(
                        choices=[
                            ("Text", "Text"),
                            ("Number", "Number"),
                            ("Checkbox", "Checkbox"),
                            ("Yes/No", "Yes/No"),
                            ("Multiple choice", "Multiple choice"),
                            ("Slider", "Slider"),
                            ("Media", "Media"),
                            ("Annotation", "Annotation"),
                            ("Date & Time", "Date & Time"),
                            ("Site", "Site"),
                            ("Inspection date", "Inspection date"),
                            ("Person", "Person"),
                            ("Inspection location", "Inspection location"),
                        ],
                        default="Text",
                        max_length=50,
                    ),
                ),
                ("required", models.BooleanField(default=False)),
                ("order", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("min_value", models.IntegerField(blank=True, default=0, null=True)),
                ("max_value", models.IntegerField(blank=True, default=100, null=True)),
            ],
            options={
                "db_table": "questions",
                "ordering": ["order"],
            },
        ),
        migrations.CreateModel(
            name="Section",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                ("order", models.PositiveIntegerField()),
                ("is_collapsed", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "sections",
                "ordering": ["order"],
            },
        ),
        migrations.CreateModel(
            name="CustomUser",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="last login"
                    ),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "username",
                    models.CharField(
                        error_messages={
                            "unique": "A user with that username already exists."
                        },
                        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
                        max_length=150,
                        unique=True,
                        validators=[
                            django.contrib.auth.validators.UnicodeUsernameValidator()
                        ],
                        verbose_name="username",
                    ),
                ),
                (
                    "first_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="first name"
                    ),
                ),
                (
                    "last_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="last name"
                    ),
                ),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Designates whether the user can log into this admin site.",
                        verbose_name="staff status",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.",
                        verbose_name="active",
                    ),
                ),
                (
                    "date_joined",
                    models.DateTimeField(
                        default=django.utils.timezone.now, verbose_name="date joined"
                    ),
                ),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("phone", models.CharField(blank=True, max_length=20, null=True)),
                ("company_name", models.CharField(max_length=100)),
                ("industry_type", models.CharField(max_length=50)),
                ("job_title", models.CharField(max_length=100)),
                ("company_size", models.IntegerField()),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "Custom User",
                "verbose_name_plural": "Custom Users",
            },
            managers=[
                ("objects", django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="QuestionOption",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("text", models.CharField(max_length=255)),
                ("order", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="users.question",
                    ),
                ),
            ],
            options={
                "db_table": "question_options",
                "ordering": ["order"],
            },
        ),
        migrations.CreateModel(
            name="Response",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("text_response", models.TextField(blank=True, null=True)),
                ("number_response", models.FloatField(blank=True, null=True)),
                ("boolean_response", models.BooleanField(blank=True, null=True)),
                ("date_response", models.DateTimeField(blank=True, null=True)),
                ("site_id", models.CharField(blank=True, max_length=255, null=True)),
                ("person_id", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "location_id",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "choice_response",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="responses",
                        to="users.questionoption",
                    ),
                ),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="responses",
                        to="users.question",
                    ),
                ),
            ],
            options={
                "db_table": "responses",
            },
        ),
        migrations.CreateModel(
            name="InspectionResponse",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "inspection",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inspection_responses",
                        to="users.inspection",
                    ),
                ),
                (
                    "response",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inspection_responses",
                        to="users.response",
                    ),
                ),
            ],
            options={
                "db_table": "inspection_responses",
            },
        ),
        migrations.AddField(
            model_name="question",
            name="section",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="questions",
                to="users.section",
            ),
        ),
        migrations.CreateModel(
            name="Template",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, null=True)),
                ("logo", models.ImageField(blank=True, null=True, upload_to="logos/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("last_published", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "templates",
            },
        ),
        migrations.AddField(
            model_name="section",
            name="template",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sections",
                to="users.template",
            ),
        ),
        migrations.AddField(
            model_name="inspection",
            name="template",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="inspections",
                to="users.template",
            ),
        ),
        migrations.CreateModel(
            name="MediaAttachment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("file", models.FileField(upload_to="template_media/")),
                (
                    "file_type",
                    models.CharField(
                        choices=[
                            ("image", "Image"),
                            ("video", "Video"),
                            ("document", "Document"),
                        ],
                        default="image",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="media_attachments",
                        to="users.question",
                    ),
                ),
            ],
            options={
                "db_table": "media_attachments",
                "indexes": [
                    models.Index(
                        fields=["question"], name="media_attac_questio_42a70d_idx"
                    ),
                    models.Index(
                        fields=["file_type"], name="media_attac_file_ty_33be64_idx"
                    ),
                ],
            },
        ),
        migrations.AddIndex(
            model_name="questionoption",
            index=models.Index(
                fields=["question"], name="question_op_questio_dc3834_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="questionoption",
            index=models.Index(fields=["order"], name="question_op_order_651cbd_idx"),
        ),
        migrations.AddIndex(
            model_name="response",
            index=models.Index(
                fields=["question"], name="responses_questio_956ae8_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="response",
            index=models.Index(
                fields=["created_at"], name="responses_created_616bff_idx"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="inspectionresponse",
            unique_together={("inspection", "response")},
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(fields=["section"], name="questions_section_222a53_idx"),
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(
                fields=["response_type"], name="questions_respons_90db80_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(fields=["order"], name="questions_order_2c3df8_idx"),
        ),
        migrations.AddIndex(
            model_name="template",
            index=models.Index(
                fields=["created_at"], name="templates_created_2dfe96_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="template",
            index=models.Index(
                fields=["updated_at"], name="templates_updated_30d236_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="section",
            index=models.Index(fields=["template"], name="sections_templat_61aeb5_idx"),
        ),
        migrations.AddIndex(
            model_name="section",
            index=models.Index(fields=["order"], name="sections_order_64336f_idx"),
        ),
        migrations.AddIndex(
            model_name="inspection",
            index=models.Index(
                fields=["template"], name="inspections_templat_8b563a_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="inspection",
            index=models.Index(
                fields=["conducted_at"], name="inspections_conduct_3f51a5_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="inspection",
            index=models.Index(fields=["status"], name="inspections_status_352e25_idx"),
        ),
    ]
