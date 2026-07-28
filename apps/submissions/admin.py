from django.contrib import admin
from .models import Submission, Author, SubmissionFile, ReviewAssignment

admin.site.register(Submission)
admin.site.register(Author)
admin.site.register(SubmissionFile)
admin.site.register(ReviewAssignment)
