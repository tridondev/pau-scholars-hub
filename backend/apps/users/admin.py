from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AcademicProfile, Institute , UniversityService


class UserAdmin(BaseUserAdmin):
    """
    Django's default UserAdmin fieldsets only cover the built-in auth
    fields (username, permissions, dates) — they don't know about the
    custom `role`, `institute`, and `is_role_manager` fields on our User
    model, so those were previously invisible/uneditable here. This adds
    them so a superuser can actually promote a user to editor/admin/
    reviewer, and — separately — grant someone `is_role_manager` so
    *they* can assign roles to other users from the frontend's
    /admin/roles page without needing full Django superuser access.
    """
    fieldsets = BaseUserAdmin.fieldsets + (
        ("PAU Scholars Hub", {
            "fields": (
                "role", "institute", "student_staff_id", "country",
                "orcid_id", "is_orcid_verified", "is_role_manager",
            ),
            "description": (
                "Tick 'Is role manager' to let this user assign roles "
                "(reviewer, editor, admin, etc.) to other users from the "
                "site's Manage user roles page — without making them a "
                "full Django superuser."
            ),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("PAU Scholars Hub", {"fields": ("role", "institute", "is_role_manager")}),
    )
    list_display = ("email", "username", "role", "institute", "is_role_manager", "is_staff")
    list_filter = BaseUserAdmin.list_filter + ("role", "is_role_manager")


admin.site.register(User, UserAdmin)
admin.site.register(AcademicProfile)
admin.site.register(Institute)
admin.site.register(UniversityService)
