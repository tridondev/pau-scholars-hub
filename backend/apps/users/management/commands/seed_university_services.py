from django.core.management.base import BaseCommand
from apps.users.models import UniversityService

SERVICES = [
    ("student_results", "Student Results", "View published grades and course results.", ["student"]),
    ("gpa_cgpa", "GPA / CGPA", "Track cumulative and per-semester grade point average.", ["student"]),
    ("academic_transcripts", "Academic Transcripts", "Request and view official academic transcripts.", ["student", "alumni"]),
    ("course_registration", "Course Registration", "Register for courses each semester.", ["student"]),
    ("student_portal", "Student Portal", "Access the main student information system.", ["student"]),
    ("alumni_portal", "Alumni Portal", "Stay connected with PAU as a graduate.", ["alumni"]),
]


class Command(BaseCommand):
    help = (
        "One-off: seed the six Section 9 institutional-integration "
        "services (Student Results, GPA/CGPA, Transcripts, Course "
        "Registration, Student Portal, Alumni Portal). All start "
        "inactive until formally authorized. Safe to re-run — existing "
        "rows are left untouched, only missing ones are created."
    )

    def handle(self, *args, **options):
        created = 0
        for key, name, description, allowed_roles in SERVICES:
            _, was_created = UniversityService.objects.get_or_create(
                key=key,
                defaults={"name": name, "description": description, "allowed_roles": allowed_roles},
            )
            if was_created:
                created += 1
                self.stdout.write(f"Created: {name}")
        self.stdout.write(self.style.SUCCESS(
            f"Done. Created {created} service(s). All start inactive — "
            "activate them from /admin/services once PAU formally "
            "authorizes each integration."
        ))
