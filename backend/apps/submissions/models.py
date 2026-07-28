import uuid
from django.conf import settings
from django.db import models


class SubmissionType(models.TextChoices):
    JOURNAL_ARTICLE = "journal_article", "Journal article"
    CONFERENCE_PAPER = "conference_paper", "Conference paper"
    THESIS = "thesis", "Thesis"
    DISSERTATION = "dissertation", "Dissertation"
    POLICY_BRIEF = "policy_brief", "Policy brief"
    WORKING_PAPER = "working_paper", "Working paper"
    BOOK_CHAPTER = "book_chapter", "Book chapter"
    BOOK = "book", "Book"
    DATASET = "dataset", "Dataset"


class SubmissionStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    EDITORIAL_SCREENING = "editorial_screening", "Editorial screening"
    PEER_REVIEW = "peer_review", "Peer review"
    REVISION_REQUESTED = "revision_requested", "Revision requested"
    ACCEPTED = "accepted", "Accepted"
    PUBLISHED = "published", "Published"
    REJECTED = "rejected", "Rejected"


class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    abstract = models.TextField()
    keywords = models.JSONField(default=list, blank=True)  # list[str]
    submission_type = models.CharField(max_length=30, choices=SubmissionType.choices)
    status = models.CharField(max_length=30, choices=SubmissionStatus.choices, default=SubmissionStatus.DRAFT)

    corresponding_author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    institute = models.ForeignKey("users.Institute", on_delete=models.SET_NULL, null=True, blank=True)
    research_area = models.CharField(max_length=255, blank=True)
    sdgs = models.JSONField(default=list, blank=True)  # e.g. ["SDG 4", "SDG 6"]
    au_agenda_areas = models.JSONField(default=list, blank=True)  # e.g. ["Aspiration 1", "Aspiration 6"]
    references = models.TextField(blank=True)

    doi = models.CharField(max_length=100, blank=True, null=True, unique=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Author(models.Model):
    """Co-authors, who may or may not have platform accounts."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="authors")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    institution = models.CharField(max_length=255, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]


class SubmissionFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="submissions/%Y/%m/")
    label = models.CharField(max_length=100, default="manuscript")  # manuscript, dataset, supplementary
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ReviewAssignment(models.Model):
    class ReviewDecision(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPT = "accept", "Accept"
        MINOR_REVISIONS = "minor_revisions", "Minor revisions"
        MAJOR_REVISIONS = "major_revisions", "Major revisions"
        REJECT = "reject", "Reject"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="review_assignments")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_assignments")
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="assigned_reviews"
    )
    decision = models.CharField(max_length=20, choices=ReviewDecision.choices, default=ReviewDecision.PENDING)
    comments_to_author = models.TextField(blank=True)
    comments_to_editor = models.TextField(blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ["submission", "reviewer"]
