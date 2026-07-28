from rest_framework import permissions


class IsRoleManager(permissions.BasePermission):
    """Superusers, or users explicitly granted the role-manager flag
    (set only via Django admin — never through the API)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_superuser or user.is_role_manager)
        )