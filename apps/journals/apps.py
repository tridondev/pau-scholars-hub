from django.apps import AppConfig


class JournalsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.journals"

    def ready(self):
        from . import signals  # noqa: F401 — registers the post_save/post_delete handlers
