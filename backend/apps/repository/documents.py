"""
Elasticsearch index definition for repository search.

Run `python manage.py search_index --rebuild` (after adding
django-elasticsearch-dsl to requirements, or wiring this manually via
elasticsearch-dsl) to build the index. Kept as a plain elasticsearch-dsl
Document here so it's usable standalone without extra Django wiring.
"""
from elasticsearch_dsl import Document, Text, Keyword, Date, Integer


class ArticleDocument(Document):
    # 'raw' is an un-analyzed keyword copy of title, needed because Text
    # fields are tokenized/scored and can't be sorted on directly in
    # Elasticsearch — this is what lets us sort results A→Z.
    title = Text(fields={"raw": Keyword()})
    abstract = Text()
    authors = Text(multi=True)
    keywords = Keyword(multi=True)
    institute = Keyword()
    country = Keyword()
    faculty = Keyword()
    department = Keyword()
    programme = Keyword()
    research_area = Keyword()
    sdgs = Keyword(multi=True)
    au_agenda_areas = Keyword(multi=True)
    submission_type = Keyword()
    year = Integer()
    published_at = Date()
    doi = Keyword()

    class Index:
        name = "pau_articles"
