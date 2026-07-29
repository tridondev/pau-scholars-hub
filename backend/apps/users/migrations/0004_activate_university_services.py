from django.db import migrations

SERVICES = [
    ("student_results", "Student Results", "View published grades and course results.", ["student"]),
    ("gpa_cgpa", "GPA / CGPA", "Track cumulative and per-semester grade point average.", ["student"]),
    ("academic_transcripts", "Academic Transcripts", "View and print an official-format academic transcript.", ["student", "alumni"]),
    ("course_registration", "Course Registration", "Register for courses each semester.", ["student"]),
    ("student_portal", "Student Portal", "Access the main student information system.", ["student"]),
    ("alumni_portal", "Alumni Portal", "Stay connected with PAU as a graduate - directory and transcript access.", ["alumni"]),
    ("course_management", "Course Management", "View your assigned courses, upload materials, and enter student grades.", ["lecturer"]),
]


def activate_services(apps, schema_editor):
    """The six Section 9 services were seeded inactive as placeholders.
    They are now backed by real functionality (apps.academics), so
    activate them here for databases that already ran the old seed
    command, and add the new lecturer-facing course_management row."""
    UniversityService = apps.get_model("users", "UniversityService")
    for key, name, description, allowed_roles in SERVICES:
        obj, created = UniversityService.objects.get_or_create(
            key=key,
            defaults={
                "name": name, "description": description,
                "allowed_roles": allowed_roles, "is_active": True,
            },
        )
        if not created and not obj.is_active:
            obj.is_active = True
            obj.save(update_fields=["is_active"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_universityservice"),
    ]

    operations = [
        migrations.RunPython(activate_services, noop_reverse),
    ]
