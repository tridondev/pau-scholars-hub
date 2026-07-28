from django.urls import path
from .views import RepositorySearchView

urlpatterns = [
    path("search/", RepositorySearchView.as_view(), name="repository-search"),
]
