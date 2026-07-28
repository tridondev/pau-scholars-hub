from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Article


@receiver(post_save, sender=Article)
def index_article_on_save(sender, instance, **kwargs):
    # Imported here (not at module top) to avoid Elasticsearch being
    # required at Django startup if it isn't running yet — indexing
    # failures shouldn't take down the whole app, just log and move on.
    from apps.repository.indexing import index_article
    try:
        index_article(instance)
    except Exception as exc:  # pragma: no cover - best-effort indexing
        import logging
        logging.getLogger(__name__).warning("Failed to index article %s: %s", instance.id, exc)


@receiver(post_delete, sender=Article)
def remove_article_on_delete(sender, instance, **kwargs):
    from apps.repository.indexing import remove_article
    try:
        remove_article(instance.id)
    except Exception as exc:  # pragma: no cover
        import logging
        logging.getLogger(__name__).warning("Failed to remove article %s from index: %s", instance.id, exc)
