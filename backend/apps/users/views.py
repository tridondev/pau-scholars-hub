import csv
from django.db.models import Q
from django.http import HttpResponse
from rest_framework.views import APIView
from .permissions import IsRoleManager
from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import AcademicProfile, Institute
from .serializers import (
    RegisterSerializer, UserSerializer, UserSelfUpdateSerializer,
    AcademicProfileSerializer, InstituteSerializer,
    UserManagementSerializer, RoleUpdateSerializer,
)

User = get_user_model()


class ReviewerListView(generics.ListAPIView):
    """Editor/admin-only: list reviewers, for the assign-reviewer picker."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ("editor", "admin"):
            raise PermissionDenied("Editor access required.")
        return User.objects.filter(role="reviewer")


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserSelfUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        # Respond with the full nested representation (institute, profile)
        # regardless of which serializer handled the write.
        return Response(UserSerializer(self.get_object()).data)


class AcademicProfileViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AcademicProfile.objects.filter(user=self.request.user)


class InstituteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Institute.objects.all()
    serializer_class = InstituteSerializer
    permission_classes = [permissions.AllowAny]


class UserManagementListView(generics.ListAPIView):
    """Role-manager-only: searchable list of all users, for the admin
    role-management page."""
    serializer_class = UserManagementSerializer
    permission_classes = [IsRoleManager]

    def get_queryset(self):
        qs = User.objects.select_related("institute").order_by("email")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))
        return qs


class UserRoleUpdateView(generics.UpdateAPIView):
    """Role-manager-only: change an existing user's role."""
    queryset = User.objects.all()
    serializer_class = RoleUpdateSerializer
    permission_classes = [IsRoleManager]


class CreateUserWithRoleView(generics.CreateAPIView):
    """Role-manager-only: create a brand-new account (e.g. a reviewer)
    with an admin-set password directly, instead of assigning an
    existing user. Reuses RegisterSerializer's create() logic."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsRoleManager]


class UserRoleExportView(APIView):
    """Role-manager-only: CSV export of every user and their role."""
    permission_classes = [IsRoleManager]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="pau_users_roles.csv"'
        writer = csv.writer(response)
        writer.writerow(["Email", "First name", "Last name", "Role", "Institute", "Date joined"])
        for u in User.objects.select_related("institute").order_by("email"):
            writer.writerow([
                u.email, u.first_name, u.last_name, u.get_role_display(),
                u.institute.acronym if u.institute else "",
                u.date_joined.strftime("%Y-%m-%d"),
            ])
        return response