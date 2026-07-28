from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, MeView, AcademicProfileViewSet, InstituteViewSet, ReviewerListView

router = DefaultRouter()
router.register("profiles", AcademicProfileViewSet, basename="profile")
router.register("institutes", InstituteViewSet, basename="institute")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("reviewers/", ReviewerListView.as_view(), name="reviewers"),
    path("", include(router.urls)),
]
