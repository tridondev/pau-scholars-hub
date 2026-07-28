import uuid
from django.db import models
from apps.submissions.models import Submission


class Journal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    issn = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    institute = models.ForeignKey("users.Institute", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name


class EditorialBoardMember(models.Model):
    journal = models.ForeignKey(Journal, on_delete=models.CASCADE, related_name="editorial_board")
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="Editor")  # e.g. Editor-in-chief, Associate editor


class Volume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    journal = models.ForeignKey(Journal, on_delete=models.CASCADE, related_name="volumes")
    number = models.PositiveIntegerField()
    year = models.PositiveIntegerField()

    class Meta:
        unique_together = ["journal", "number"]


class Issue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volume = models.ForeignKey(Volume, on_delete=models.CASCADE, related_name="issues")
    number = models.PositiveIntegerField()
    published_at = models.DateField(null=True, blank=True)


class Article(models.Model):
    """A published Submission, linked into an Issue with citation metadata."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name="article")
    issue = models.ForeignKey(Issue, on_delete=models.SET_NULL, null=True, blank=True, related_name="articles")
    page_start = models.PositiveIntegerField(null=True, blank=True)
    page_end = models.PositiveIntegerField(null=True, blank=True)
    view_count = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)
    citation_count = models.PositiveIntegerField(default=0)
