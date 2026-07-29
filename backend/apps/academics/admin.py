from django.contrib import admin
from .models import Course, CourseRegistration, Result, CourseMaterial


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "lecturer", "institute", "academic_year", "semester", "is_open_for_registration")
    list_filter = ("academic_year", "semester", "institute", "is_open_for_registration")
    search_fields = ("code", "title", "lecturer__email")


@admin.register(CourseRegistration)
class CourseRegistrationAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "academic_year", "semester", "status", "registered_at")
    list_filter = ("academic_year", "semester", "status")
    search_fields = ("student__email", "course__code")


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "academic_year", "semester", "score", "grade", "is_published")
    list_filter = ("academic_year", "semester", "is_published", "grade")
    search_fields = ("student__email", "course__code")


@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "uploaded_by", "uploaded_at")
    search_fields = ("title", "course__code")
