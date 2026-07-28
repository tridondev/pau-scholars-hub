from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet, ReviewAssignmentViewSet

router = DefaultRouter()
router.register("", SubmissionViewSet, basename="submission")
router.register("reviews/mine", ReviewAssignmentViewSet, basename="my-review")

urlpatterns = [path("", include(router.urls))]
