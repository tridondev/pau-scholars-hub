from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import AcademicProfile, Institute
from .serializers import (
    RegisterSerializer, UserSerializer, UserSelfUpdateSerializer,
    AcademicProfileSerializer, InstituteSerializer,
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
