import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    STUDENT = "student", "Student"
    RESEARCHER = "researcher", "Researcher"
    LECTURER = "lecturer", "Lecturer"
    SUPERVISOR = "supervisor", "Supervisor"
    REVIEWER = "reviewer", "Reviewer"
    EDITOR = "editor", "Editor"
    ALUMNI = "alumni", "Alumni"
    ADMIN = "admin", "Institutional administrator"


class Institute(models.Model):
    """PAUSTI, PAUWES, PAUGMC, PAULESI, PAUCVSTA, etc."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    acronym = models.CharField(max_length=20, unique=True)
    campus = models.CharField(max_length=255)
    country = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.acronym


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    institute = models.ForeignKey(Institute, on_delete=models.SET_NULL, null=True, blank=True, related_name="users")
    student_staff_id = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=100, blank=True)
    is_orcid_verified = models.BooleanField(default=False)
    orcid_id = models.CharField(max_length=25, blank=True, unique=False, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class AcademicProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    faculty = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=255, blank=True)
    programme = models.CharField(max_length=255, blank=True)
    biography = models.TextField(blank=True)
    research_interests = models.JSONField(default=list, blank=True)  # list[str]
    google_scholar_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    cv_file = models.FileField(upload_to="cvs/", blank=True, null=True)
    profile_image = models.ImageField(upload_to="avatars/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"
