from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JournalViewSet, VolumeViewSet, IssueViewSet, ArticleViewSet

router = DefaultRouter()
router.register("journals", JournalViewSet, basename="journal")
router.register("volumes", VolumeViewSet, basename="volume")
router.register("issues", IssueViewSet, basename="issue")
router.register("articles", ArticleViewSet, basename="article")

urlpatterns = [path("", include(router.urls))]
