from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import NotFoundError, RequestError
from .indexing import ensure_index_exists


class RepositorySearchView(APIView):
    """
    GET /api/repository/search/?q=&institute=&country=&sdg=&year=&page=

    Full-text + faceted search across the published repository.
    Falls back to a clear error if Elasticsearch isn't reachable yet
    (e.g. fresh dev environment before the index is built) rather than
    crashing the whole API.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "")
        filters = []
        for field in ["institute", "country", "faculty", "department", "research_area"]:
            value = request.query_params.get(field)
            if value:
                filters.append({"term": {field: value}})
        sdg = request.query_params.get("sdg")
        if sdg:
            filters.append({"term": {"sdgs": sdg}})
        year = request.query_params.get("year")
        if year:
            filters.append({"term": {"year": int(year)}})

        es_query = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": ["title^3", "abstract", "authors", "keywords"],
                                "fuzziness": "AUTO",
                            }
                        }
                    ] if query else [{"match_all": {}}],
                    "filter": filters,
                }
            },
            "highlight": {"fields": {"abstract": {}}},
            # No query text (plain browsing, or an institute filter with
            # nothing typed) → alphabetical by title. With a query, keep
            # relevance ranking but break ties alphabetically rather than
            # leaving equally-scored results in arbitrary order.
            "sort": (
                [{"title.raw": "asc"}]
                if not query
                else ["_score", {"title.raw": "asc"}]
            ),
        }

        try:
            es = Elasticsearch(settings.ELASTICSEARCH_HOST)
            try:
                result = es.search(index="pau_articles", body=es_query, size=20)
            except NotFoundError:
                # Index hasn't been created yet — create it and return an
                # empty, non-error result rather than failing the request.
                ensure_index_exists()
                return Response({"count": 0, "results": []})
            except RequestError:
                # Most likely cause: the index mapping doesn't have the
                # 'title.raw' sort field yet (e.g. it was built before that
                # field was added, and the index needs a rebuild — see
                # `python manage.py rebuild_index`). Rather than fail the
                # whole search, retry once without sorting so results still
                # come back, just not alphabetized.
                fallback_query = {k: v for k, v in es_query.items() if k != "sort"}
                result = es.search(index="pau_articles", body=fallback_query, size=20)

            hits = [
                {"id": h["_id"], "score": h["_score"], **h["_source"]}
                for h in result["hits"]["hits"]
            ]
            return Response({"count": result["hits"]["total"]["value"], "results": hits})
        except Exception as exc:
            return Response(
                {
                    "detail": "Search is temporarily unavailable — the Elasticsearch service may not be running.",
                    "error": str(exc),
                },
                status=503,
            )
