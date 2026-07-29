from rest_framework import permissions


class IsLecturer(permissions.BasePermission):
    """Lecturers (or superusers, for support/admin purposes)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role == "lecturer"))


class IsStudentOrAlumni(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_superuser or user.role in ("student", "alumni"))
        )
