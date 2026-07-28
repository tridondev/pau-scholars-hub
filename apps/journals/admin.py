from django.contrib import admin
from .models import Journal, Volume, Issue, Article, EditorialBoardMember

admin.site.register(Journal)
admin.site.register(Volume)
admin.site.register(Issue)
admin.site.register(Article)
admin.site.register(EditorialBoardMember)
