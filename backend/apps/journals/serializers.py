from rest_framework import serializers
from .models import Journal, Volume, Issue, Article, EditorialBoardMember


class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Journal
        fields = ["id", "name", "issn", "description", "institute"]


class VolumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volume
        fields = ["id", "journal", "number", "year"]


class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ["id", "volume", "number", "published_at"]


class ArticleSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="submission.title", read_only=True)
    abstract = serializers.CharField(source="submission.abstract", read_only=True)
    doi = serializers.CharField(source="submission.doi", read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "submission", "title", "abstract", "doi", "issue",
            "page_start", "page_end", "view_count", "download_count", "citation_count",
        ]
