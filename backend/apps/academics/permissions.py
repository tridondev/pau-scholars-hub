from rest_framework import permissions


class IsLecturer(permissions.BasePermission):
    """Lecturers (or superusers, for support/admin purposes)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or user.role == "lecturer"))


class CanManageResults(permissions.BasePermission):
    """Lecturers manage grades for their own courses; institutional
    administrators (role='admin') manage grades across their whole
    institute instead, since they don't teach specific courses
    themselves. Superusers can always act, for support purposes."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated
            and (user.is_superuser or user.role in ("lecturer", "admin"))
        )


class IsStudentOrAlumni(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_superuser or user.role in ("student", "alumni"))
        )
