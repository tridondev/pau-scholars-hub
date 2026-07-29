import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models


def score_to_grade(score):
    """Standard 5-point Nigerian university grading scale."""
    if score is None:
        return "", Decimal("0.00")
    score = float(score)
    if score >= 70:
        return "A", Decimal("5.00")
    if score >= 60:
        return "B", Decimal("4.00")
    if score >= 50:
        return "C", Decimal("3.00")
    if score >= 45:
        return "D", Decimal("2.00")
    if score >= 40:
        return "E", Decimal("1.00")
    return "F", Decimal("0.00")


class Semester(models.TextChoices):
    FIRST = "first", "First semester"
    SECOND = "second", "Second semester"


class Course(models.Model):
    """A course a lecturer teaches in a given academic year/semester.
    Students register for these; results are recorded against them."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    credit_units = models.PositiveSmallIntegerField(default=3)
    institute = models.ForeignKey(
        "users.Institute", on_delete=models.SET_NULL, null=True, blank=True, related_name="courses"
    )
    lecturer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="courses_taught"
    )
    academic_year = models.CharField(max_length=20, default="2025/2026")  # e.g. "2025/2026"
    semester = models.CharField(max_length=10, choices=Semester.choices, default=Semester.FIRST)
    is_open_for_registration = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        unique_together = ["code", "academic_year", "semester"]

    def __str__(self):
        return f"{self.code} — {self.title}"


class CourseRegistration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "registered", "Registered"
        DROPPED = "dropped", "Dropped"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="registrations")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="registrations")
    academic_year = models.CharField(max_length=20)
    semester = models.CharField(max_length=10, choices=Semester.choices)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.REGISTERED)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-registered_at"]
        unique_together = ["student", "course", "academic_year", "semester"]

    def __str__(self):
        return f"{self.student} → {self.course}"


class Result(models.Model):
    """A student's grade for one course/semester. `is_published`
    gates visibility to the student — a lecturer can save a draft
    score before releasing it."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="results")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="results")
    academic_year = models.CharField(max_length=20)
    semester = models.CharField(max_length=10, choices=Semester.choices)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # 0–100
    grade = models.CharField(max_length=2, blank=True)
    grade_point = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal("0.00"))
    is_published = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="results_uploaded"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-academic_year", "semester"]
        unique_together = ["student", "course", "academic_year", "semester"]

    def save(self, *args, **kwargs):
        self.grade, self.grade_point = score_to_grade(self.score)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} — {self.course} ({self.grade})"


class CourseMaterial(models.Model):
    """A file a lecturer uploads for a course (notes, slides, past
    questions). Visible to any student registered on the course."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="materials")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="course_materials/%Y/%m/")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="materials_uploaded"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.title} ({self.course.code})"
