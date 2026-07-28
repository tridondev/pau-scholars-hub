from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, MeView, AcademicProfileViewSet, InstituteViewSet, ReviewerListView,
    UserManagementListView, UserRoleUpdateView, CreateUserWithRoleView, UserRoleExportView, UniversityServiceViewSet, MyServicesView,
)

router = DefaultRouter()
router.register("profiles", AcademicProfileViewSet, basename="profile")
router.register("institutes", InstituteViewSet, basename="institute")
router.register("services", UniversityServiceViewSet, basename="university-service")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("reviewers/", ReviewerListView.as_view(), name="reviewers"),
    path("manage/", UserManagementListView.as_view(), name="user-manage-list"),
    path("manage/<uuid:pk>/role/", UserRoleUpdateView.as_view(), name="user-manage-role"),
    path("manage/create/", CreateUserWithRoleView.as_view(), name="user-manage-create"),
    path("manage/export/", UserRoleExportView.as_view(), name="user-manage-export"),
    path("services/mine/", MyServicesView.as_view(), name="my-services"),
    path("", include(router.urls)),
]