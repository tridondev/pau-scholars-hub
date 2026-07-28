from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AcademicProfile, Institute

User = get_user_model()


class InstituteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institute
        fields = ["id", "name", "acronym", "campus", "country"]


class AcademicProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProfile
        fields = [
            "id", "faculty", "department", "programme", "biography",
            "research_interests", "google_scholar_url", "linkedin_url",
            "cv_file", "profile_image", "updated_at",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = AcademicProfileSerializer(read_only=True)
    institute = InstituteSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "role",
            "institute", "student_staff_id", "country",
            "is_orcid_verified", "orcid_id", "profile", "is_role_manager",
        ]
        # role and email are never editable through this serializer — role
        # controls permissions (editor/admin/reviewer) so it must not be
        # settable by the user themselves; email is the login identifier.
        read_only_fields = ["id", "email", "role", "is_orcid_verified", "is_role_manager"]


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    """Used only for PATCH /api/users/me/ — a deliberately narrow set of
    self-editable fields. `role` is intentionally absent (not just
    read-only) so it can never be granted via this serializer."""
    institute = serializers.PrimaryKeyRelatedField(
        queryset=Institute.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = ["first_name", "last_name", "institute", "student_staff_id", "country", "orcid_id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)

    class Meta:
        model = User
        fields = ["email", "username", "password", "first_name", "last_name", "role", "institute"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        AcademicProfile.objects.create(user=user)
        return user

class UserManagementSerializer(serializers.ModelSerializer):
    """Role-manager-only: row shape for the admin user list."""
    institute = InstituteSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "institute", "date_joined"]


class RoleUpdateSerializer(serializers.ModelSerializer):
    """Role-manager-only: change an existing user's role. Deliberately
    excludes is_role_manager — that stays Django-admin-only, so a role
    manager can never grant themselves or others their own power."""
    class Meta:
        model = User
        fields = ["role"]
