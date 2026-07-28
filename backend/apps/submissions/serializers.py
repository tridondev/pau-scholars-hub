from rest_framework import serializers
from .models import Submission, Author, SubmissionFile, ReviewAssignment


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "full_name", "email", "institution", "order"]


class SubmissionFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionFile
        fields = ["id", "file", "label", "uploaded_at"]


class ReviewAssignmentSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)
    submission_title = serializers.CharField(source="submission.title", read_only=True)

    class Meta:
        model = ReviewAssignment
        fields = [
            "id", "submission", "submission_title", "reviewer", "reviewer_name", "decision",
            "comments_to_author", "comments_to_editor",
            "assigned_at", "completed_at", "due_date",
        ]
        read_only_fields = ["assigned_at", "submission", "reviewer"]


class SubmissionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard/list views."""
    corresponding_author_name = serializers.CharField(source="corresponding_author.get_full_name", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "title", "submission_type", "status",
            "corresponding_author_name", "sdgs", "created_at", "published_at",
        ]


class SubmissionDetailSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, required=False)
    files = SubmissionFileSerializer(many=True, read_only=True)
    review_assignments = ReviewAssignmentSerializer(many=True, read_only=True)
    corresponding_author_name = serializers.CharField(source="corresponding_author.get_full_name", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id", "title", "abstract", "keywords", "submission_type", "status",
            "corresponding_author", "corresponding_author_name", "institute", "research_area", "sdgs",
            "references", "doi", "authors", "files", "review_assignments",
            "submitted_at", "published_at", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "doi", "submitted_at", "published_at", "created_at", "updated_at",
            "corresponding_author",
        ]

    def create(self, validated_data):
        authors_data = validated_data.pop("authors", [])
        submission = Submission.objects.create(**validated_data)
        for i, author_data in enumerate(authors_data):
            Author.objects.create(submission=submission, order=i, **author_data)
        return submission
