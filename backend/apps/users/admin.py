from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AcademicProfile, Institute , UniversityService


class UserAdmin(BaseUserAdmin):
    """
    Django's default UserAdmin fieldsets only cover the built-in auth
    fields (username, permissions, dates) — they don't know about the
    custom `role` and `institute` fields on our User model, so those
    were previously invisible/uneditable here. This adds them so an
    admin can actually promote a user to editor/admin/reviewer, etc.
    """
    fieldsets = BaseUserAdmin.fieldsets + (
        ("PAU Scholars Hub", {"fields": ("role", "institute", "student_staff_id", "country", "orcid_id", "is_orcid_verified")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("PAU Scholars Hub", {"fields": ("role", "institute")}),
    )
    list_display = ("email", "username", "role", "institute", "is_staff")
    list_filter = BaseUserAdmin.list_filter + ("role",)


admin.site.register(User, UserAdmin)
admin.site.register(AcademicProfile)
admin.site.register(Institute)
admin.site.register(UniversityService)
