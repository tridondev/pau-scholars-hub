from django.core.management.base import BaseCommand
from apps.journals.models import Article
from apps.repository.indexing import ensure_index_exists, index_article


class Command(BaseCommand):
    help = "Build (or rebuild) the Elasticsearch repository search index from existing Article records."

    def handle(self, *args, **options):
        self.stdout.write("Ensuring the pau_articles index exists...")
        ensure_index_exists()

        articles = Article.objects.select_related("submission", "submission__institute")
        count = articles.count()

        if count == 0:
            self.stdout.write(self.style.WARNING(
                "No Article records found. The index now exists but is empty — "
                "search will return zero results until submissions are published "
                "and this command is re-run, or until new articles are created "
                "(auto-indexed via signal)."
            ))
            return

        indexed = 0
        for article in articles:
            try:
                index_article(article)
                indexed += 1
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"Failed to index article {article.id}: {exc}"))

        self.stdout.write(self.style.SUCCESS(f"Indexed {indexed}/{count} articles."))
