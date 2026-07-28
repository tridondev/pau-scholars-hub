"""
Bridges Django's Article model to the Elasticsearch document schema
defined in documents.py. This is the piece that was missing before:
the search endpoint existed, but nothing ever wrote documents into the
index, so every search returned "index unavailable" (there was no
index at all yet).
"""
from django.conf import settings
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError
from .documents import ArticleDocument


def get_es_client() -> Elasticsearch:
    return Elasticsearch(settings.ELASTICSEARCH_HOST)


def ensure_index_exists():
    """Create the pau_articles index with the right mapping if it doesn't exist yet."""
    es = get_es_client()
    if not es.indices.exists(index=ArticleDocument.Index.name):
        ArticleDocument.init(using=es)


def index_article(article):
    """
    Push a single journals.Article into Elasticsearch.
    Safe to call repeatedly — re-indexing just overwrites the existing doc.
    """
    submission = article.submission
    ensure_index_exists()

    doc = ArticleDocument(
        meta={"id": str(article.id)},
        title=submission.title,
        abstract=submission.abstract,
        authors=[a.full_name for a in submission.authors.all()] or [
            submission.corresponding_author.get_full_name() or submission.corresponding_author.email
        ],
        keywords=submission.keywords or [],
        institute=submission.institute.acronym if submission.institute else None,
        country=submission.institute.country if submission.institute else None,
        research_area=submission.research_area,
        sdgs=submission.sdgs or [],
        submission_type=submission.submission_type,
        year=submission.published_at.year if submission.published_at else None,
        published_at=submission.published_at,
        doi=submission.doi,
    )
    doc.save(using=get_es_client())
    return doc


def remove_article(article_id):
    es = get_es_client()
    try:
        es.delete(index=ArticleDocument.Index.name, id=str(article_id))
    except NotFoundError:
        pass
