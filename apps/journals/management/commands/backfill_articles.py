from django.core.management.base import BaseCommand
from apps.submissions.models import Submission, SubmissionStatus
from apps.journals.models import Article


class Command(BaseCommand):
    help = (
        "One-off fix: create the missing journals.Article record for any "
        "Submission that is already marked 'published' but never got one "
        "(this was the underlying bug — advance_status used to flip the "
        "status string without ever creating the Article that the "
        "repository/search index is built from). Safe to re-run."
    )

    def handle(self, *args, **options):
        published = Submission.objects.filter(status=SubmissionStatus.PUBLISHED)
        created = 0
        skipped = 0

        for submission in published:
            _, was_created = Article.objects.get_or_create(submission=submission)
            if was_created:
                created += 1
                self.stdout.write(f"Created Article for: {submission.title!r}")
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done. Created {created} missing Article record(s), "
            f"{skipped} already had one."
        ))
        if created:
            self.stdout.write(
                "Now run: python manage.py rebuild_index  "
                "(to push these into Elasticsearch immediately, rather than "
                "waiting on the post_save signal from this command's saves)."
            )
