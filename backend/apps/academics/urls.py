from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseListView, MyRegistrationsView, RegistrationDetailView,
    MyResultsView, MyGpaView, MyTranscriptView, AlumniDirectoryView,
    LecturerCoursesView, CourseRosterView, LecturerResultViewSet, CourseMaterialViewSet,
)

router = DefaultRouter()
router.register("materials", CourseMaterialViewSet, basename="course-material")
router.register("lecturer/results", LecturerResultViewSet, basename="lecturer-result")

urlpatterns = [
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("registrations/", MyRegistrationsView.as_view(), name="my-registrations"),
    path("registrations/<uuid:pk>/", RegistrationDetailView.as_view(), name="registration-detail"),
    path("results/mine/", MyResultsView.as_view(), name="my-results"),
    path("gpa/mine/", MyGpaView.as_view(), name="my-gpa"),
    path("transcript/mine/", MyTranscriptView.as_view(), name="my-transcript"),
    path("alumni/directory/", AlumniDirectoryView.as_view(), name="alumni-directory"),
    path("lecturer/courses/", LecturerCoursesView.as_view(), name="lecturer-courses"),
    path("lecturer/courses/<uuid:course_id>/roster/", CourseRosterView.as_view(), name="course-roster"),
    path("", include(router.urls)),
]
