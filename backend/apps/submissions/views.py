from django.db.models import Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Submission, SubmissionStatus, ReviewAssignment, Author, SubmissionFile
from .serializers import (
    SubmissionListSerializer, SubmissionDetailSerializer, ReviewAssignmentSerializer,
    AuthorSerializer, SubmissionFileSerializer,
)


class SubmissionViewSet(viewsets.ModelViewSet):
    """
    Handles the full research submission lifecycle:
    draft -> submitted -> editorial_screening -> peer_review ->
    revision_requested -> accepted -> published
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_fields = ["status", "submission_type", "institute"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    # Powers the editor/admin dashboard's search box — matches on title,
    # abstract, or the corresponding author's name/email.
    search_fields = ["title", "abstract", "corresponding_author__email", "corresponding_author__first_name", "corresponding_author__last_name"]

    def get_queryset(self):
        user = self.request.user
        qs = Submission.objects.select_related("corresponding_author", "institute")
        # Authors see their own; editors/admins see everything; reviewers see assigned.
        if user.role in ("editor", "admin"):
            return qs
        if user.role == "reviewer":
            return qs.filter(review_assignments__reviewer=user).distinct()
        return qs.filter(corresponding_author=user)

    def get_serializer_class(self):
        return SubmissionListSerializer if self.action == "list" else SubmissionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(corresponding_author=self.request.user)

    def _check_owns_draft(self, submission, request):
        """Authors may only keep editing their own submission while it's still a draft."""
        if request.user.role in ("editor", "admin"):
            return
        if submission.corresponding_author != request.user:
            raise PermissionDenied("Not your submission.")
        if submission.status != SubmissionStatus.DRAFT:
            raise ValidationError("This submission has already been sent for review and can no longer be edited.")

    def perform_update(self, serializer):
        self._check_owns_draft(serializer.instance, self.request)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_owns_draft(instance, self.request)
        instance.delete()

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Editor/admin-only: counts of submissions per status, for the
        overview dashboard's summary cards. Counts the same scope
        get_queryset() would return (i.e. everything, for editors/admins).
        """
        if request.user.role not in ("editor", "admin"):
            return Response({"detail": "Editor access required."}, status=status.HTTP_403_FORBIDDEN)
        counts = {row["status"]: row["count"] for row in self.get_queryset().values("status").annotate(count=Count("id"))}
        return Response({s: counts.get(s, 0) for s in SubmissionStatus.values})

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Move a draft into the editorial workflow."""
        submission = self.get_object()
        if submission.corresponding_author != request.user:
            return Response({"detail": "Not your submission."}, status=status.HTTP_403_FORBIDDEN)
        if submission.status != SubmissionStatus.DRAFT:
            return Response({"detail": "Only drafts can be submitted."}, status=status.HTTP_400_BAD_REQUEST)
        if not submission.files.exists():
            return Response({"detail": "Attach at least one manuscript file before submitting."}, status=status.HTTP_400_BAD_REQUEST)
        submission.status = SubmissionStatus.SUBMITTED
        submission.submitted_at = timezone.now()
        submission.save()
        return Response(SubmissionDetailSerializer(submission).data)

    @action(detail=True, methods=["post"])
    def advance_status(self, request, pk=None):
        """Editor-only: move a submission to the next workflow stage."""
        if request.user.role not in ("editor", "admin"):
            return Response({"detail": "Editor access required."}, status=status.HTTP_403_FORBIDDEN)
        submission = self.get_object()
        new_status = request.data.get("status")
        if new_status not in SubmissionStatus.values:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        was_published = submission.status == SubmissionStatus.PUBLISHED
        submission.status = new_status
        if new_status == SubmissionStatus.PUBLISHED:
            submission.published_at = timezone.now()
            submission.save()
            # Publishing a submission is what puts it in the public repository:
            # the repository/search index is built from journals.Article rows
            # (see journals/signals.py), so we need to create one here, not
            # just flip the status string.
            from apps.journals.models import Article
            Article.objects.get_or_create(submission=submission)
        else:
            submission.save()
            if was_published:
                # Moving a submission *away* from published (retraction,
                # correcting an editor mistake, etc.) must also pull it back
                # out of the public repository — otherwise it stays
                # discoverable in search forever even though its status no
                # longer says "published". Deleting the Article triggers
                # journals/signals.py's post_delete handler, which removes
                # the corresponding Elasticsearch document.
                from apps.journals.models import Article
                Article.objects.filter(submission=submission).delete()
        return Response(SubmissionDetailSerializer(submission).data)

    @action(detail=True, methods=["post"], url_path="assign-reviewer")
    def assign_reviewer(self, request, pk=None):
        if request.user.role not in ("editor", "admin"):
            return Response({"detail": "Editor access required."}, status=status.HTTP_403_FORBIDDEN)
        submission = self.get_object()
        reviewer_id = request.data.get("reviewer_id")
        due_date = request.data.get("due_date")
        assignment = ReviewAssignment.objects.create(
            submission=submission, reviewer_id=reviewer_id,
            assigned_by=request.user, due_date=due_date,
        )
        submission.status = SubmissionStatus.PEER_REVIEW
        submission.save()
        return Response(ReviewAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

    # --- Co-authors -----------------------------------------------------
    @action(detail=True, methods=["post"], url_path="authors")
    def add_author(self, request, pk=None):
        submission = self.get_object()
        self._check_owns_draft(submission, request)
        serializer = AuthorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(submission=submission, order=submission.authors.count())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"authors/(?P<author_id>[^/.]+)")
    def remove_author(self, request, pk=None, author_id=None):
        submission = self.get_object()
        self._check_owns_draft(submission, request)
        deleted, _ = submission.authors.filter(id=author_id).delete()
        if not deleted:
            return Response({"detail": "Author not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # --- Files ------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="files", parser_classes=[MultiPartParser, FormParser])
    def upload_file(self, request, pk=None):
        submission = self.get_object()
        self._check_owns_draft(submission, request)
        serializer = SubmissionFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(submission=submission)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"files/(?P<file_id>[^/.]+)")
    def remove_file(self, request, pk=None, file_id=None):
        submission = self.get_object()
        self._check_owns_draft(submission, request)
        deleted, _ = submission.files.filter(id=file_id).delete()
        if not deleted:
            return Response({"detail": "File not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReviewAssignmentViewSet(viewsets.ModelViewSet):
    """Reviewers submit their decisions here."""
    serializer_class = ReviewAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ReviewAssignment.objects.filter(reviewer=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.decision != "pending" and not instance.completed_at:
            instance.completed_at = timezone.now()
            instance.save()
