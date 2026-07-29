from django.core.management.base import BaseCommand
from apps.users.models import UniversityService

SERVICES = [
    ("student_results", "Student Results", "View published grades and course results.", ["student"]),
    ("gpa_cgpa", "GPA / CGPA", "Track cumulative and per-semester grade point average.", ["student"]),
    ("academic_transcripts", "Academic Transcripts", "View and print an official-format academic transcript.", ["student", "alumni"]),
    ("course_registration", "Course Registration", "Register for courses each semester.", ["student"]),
    ("student_portal", "Student Portal", "Access the main student information system.", ["student"]),
    ("alumni_portal", "Alumni Portal", "Stay connected with PAU as a graduate - directory and transcript access.", ["alumni"]),
    ("course_management", "Course Management", "View your assigned courses, upload materials, and enter student grades.", ["lecturer"]),
]


class Command(BaseCommand):
    help = (
        "Seed the Section 9 institutional-integration services (Student "
        "Results, GPA/CGPA, Transcripts, Course Registration, Student "
        "Portal, Alumni Portal, Course Management). These are now backed "
        "by the apps.academics module, so they are activated by default. "
        "Safe to re-run - existing rows are left untouched, only missing "
        "ones are created."
    )

    def handle(self, *args, **options):
        created = 0
        for key, name, description, allowed_roles in SERVICES:
            _, was_created = UniversityService.objects.get_or_create(
                key=key,
                defaults={
                    "name": name, "description": description,
                    "allowed_roles": allowed_roles, "is_active": True,
                },
            )
            if was_created:
                created += 1
                self.stdout.write(f"Created: {name}")
        self.stdout.write(self.style.SUCCESS(
            f"Done. Created {created} service(s). Toggle availability any "
            "time from /admin/services."
        ))
