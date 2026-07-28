from rest_framework import viewsets, permissions
from .models import Journal, Volume, Issue, Article
from .serializers import JournalSerializer, VolumeSerializer, IssueSerializer, ArticleSerializer


class JournalViewSet(viewsets.ModelViewSet):
    queryset = Journal.objects.all()
    serializer_class = JournalSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class VolumeViewSet(viewsets.ModelViewSet):
    queryset = Volume.objects.all()
    serializer_class = VolumeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Article.objects.select_related("submission", "issue")
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=["view_count"])
        return super().retrieve(request, *args, **kwargs)
