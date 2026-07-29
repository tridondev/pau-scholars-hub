from collections import OrderedDict
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions, viewsets, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, CourseRegistration, Result, CourseMaterial
from .permissions import IsLecturer, IsStudentOrAlumni
from .serializers import (
    CourseSerializer, CourseRegistrationSerializer, ResultSerializer,
    LecturerResultSerializer, CourseMaterialSerializer, RosterEntrySerializer,
    GpaSummarySerializer,
)

User = get_user_model()


# --- Student: browse & register -------------------------------------------

class CourseListView(generics.ListAPIView):
    """Courses open for registration. Any authenticated user can browse
    (students use this to pick courses); optional filters via query
    params keep it usable without a heavier filter backend."""
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Course.objects.select_related("institute", "lecturer").all()
        params = self.request.query_params
        if params.get("academic_year"):
            qs = qs.filter(academic_year=params["academic_year"])
        if params.get("semester"):
            qs = qs.filter(semester=params["semester"])
        if params.get("institute"):
            qs = qs.filter(institute_id=params["institute"])
        if params.get("search"):
            s = params["search"]
            qs = qs.filter(Q(code__icontains=s) | Q(title__icontains=s))
        if params.get("open") == "true":
            qs = qs.filter(is_open_for_registration=True)
        return qs


class MyRegistrationsView(generics.ListCreateAPIView):
    """A student's own course registrations. POST registers for a
    course; dropping is a PATCH-free DELETE on the detail view below."""
    serializer_class = CourseRegistrationSerializer
    permission_classes = [IsStudentOrAlumni]

    def get_queryset(self):
        return (
            CourseRegistration.objects.select_related("course", "course__institute", "course__lecturer")
            .filter(student=self.request.user)
        )

    def perform_create(self, serializer):
        course = serializer.validated_data["course"]
        if not course.is_open_for_registration:
            raise ValidationError("This course is not currently open for registration.")
        existing = CourseRegistration.objects.filter(
            student=self.request.user, course=course,
            academic_year=course.academic_year, semester=course.semester,
        ).exclude(status=CourseRegistration.Status.DROPPED)
        if existing.exists():
            raise ValidationError("You are already registered for this course.")
        serializer.save()


class RegistrationDetailView(generics.RetrieveDestroyAPIView):
    """DELETE drops a registration (soft: flips status to dropped)."""
    serializer_class = CourseRegistrationSerializer
    permission_classes = [IsStudentOrAlumni]

    def get_queryset(self):
        return CourseRegistration.objects.filter(student=self.request.user)

    def destroy(self, request, *args, **kwargs):
        reg = self.get_object()
        reg.status = CourseRegistration.Status.DROPPED
        reg.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Student: results, GPA, transcript -------------------------------------

class MyResultsView(generics.ListAPIView):
    """A student's own published results only — unpublished (draft)
    scores stay invisible until a lecturer releases them."""
    serializer_class = ResultSerializer
    permission_classes = [IsStudentOrAlumni]

    def get_queryset(self):
        return (
            Result.objects.select_related("course", "course__institute")
            .filter(student=self.request.user, is_published=True)
        )


def _compute_gpa(results):
    """Groups published results by (academic_year, semester) and
    computes a weighted GPA per semester plus an overall CGPA."""
    by_period = OrderedDict()
    for r in results:
        key = (r.academic_year, r.semester)
        by_period.setdefault(key, []).append(r)

    semesters = []
    total_points = Decimal("0.00")
    total_units = 0
    for (year, sem), rows in by_period.items():
        period_points = Decimal("0.00")
        period_units = 0
        for r in rows:
            units = r.course.credit_units
            period_points += r.grade_point * units
            period_units += units
        gpa = (period_points / period_units) if period_units else Decimal("0.00")
        semesters.append({
            "academic_year": year, "semester": sem,
            "gpa": round(gpa, 2), "total_units": period_units, "course_count": len(rows),
        })
        total_points += period_points
        total_units += period_units

    cgpa = (total_points / total_units) if total_units else Decimal("0.00")
    return {"cgpa": round(cgpa, 2), "total_units": total_units, "semesters": semesters}


class MyGpaView(APIView):
    permission_classes = [IsStudentOrAlumni]

    def get(self, request):
        results = Result.objects.select_related("course").filter(student=request.user, is_published=True)
        data = _compute_gpa(list(results))
        return Response(GpaSummarySerializer(data).data)


class MyTranscriptView(APIView):
    """Full academic transcript: student/programme details, every
    published result grouped by semester, and the GPA/CGPA summary —
    everything the printable transcript view needs in one call."""
    permission_classes = [IsStudentOrAlumni]

    def get(self, request):
        user = request.user
        results = list(
            Result.objects.select_related("course", "course__institute")
            .filter(student=user, is_published=True)
            .order_by("academic_year", "semester")
        )
        gpa_data = _compute_gpa(results)

        by_period = OrderedDict()
        for r in results:
            key = f"{r.academic_year} · {r.get_semester_display()}"
            by_period.setdefault(key, []).append(ResultSerializer(r).data)

        profile = getattr(user, "profile", None)
        return Response({
            "student": {
                "full_name": f"{user.first_name} {user.last_name}".strip() or user.email,
                "email": user.email,
                "student_staff_id": user.student_staff_id,
                "institute": user.institute.name if user.institute else "",
                "programme": profile.programme if profile else "",
                "department": profile.department if profile else "",
            },
            "periods": [{"label": k, "results": v} for k, v in by_period.items()],
            "summary": GpaSummarySerializer(gpa_data).data,
        })


# --- Alumni directory --------------------------------------------------------

class AlumniDirectoryView(generics.ListAPIView):
    """A light directory of fellow alumni, for the Alumni Portal —
    name, institute and programme only, nothing sensitive."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role="alumni").select_related("institute", "profile")

    def list(self, request, *args, **kwargs):
        rows = [
            {
                "id": str(u.id),
                "full_name": f"{u.first_name} {u.last_name}".strip() or u.email,
                "institute": u.institute.acronym if u.institute else "",
                "programme": getattr(u.profile, "programme", "") if hasattr(u, "profile") else "",
                "country": u.country,
            }
            for u in self.get_queryset()
        ]
        return Response(rows)


# --- Lecturer: courses, roster, results, materials --------------------------

class LecturerCoursesView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsLecturer]

    def get_queryset(self):
        qs = Course.objects.select_related("institute").all()
        if not self.request.user.is_superuser:
            qs = qs.filter(lecturer=self.request.user)
        return qs


class CourseRosterView(APIView):
    """A lecturer's class list for one of their own courses, each row
    showing the student's current result (if any) so grades can be
    entered inline."""
    permission_classes = [IsLecturer]

    def get(self, request, course_id):
        course = self._get_owned_course(request, course_id)
        regs = (
            CourseRegistration.objects.select_related("student")
            .filter(course=course, status=CourseRegistration.Status.REGISTERED)
        )
        results_by_student = {
            r.student_id: r
            for r in Result.objects.filter(course=course, academic_year=course.academic_year, semester=course.semester)
        }
        rows = []
        for reg in regs:
            s = reg.student
            result = results_by_student.get(s.id)
            rows.append({
                "registration_id": reg.id,
                "student_id": s.id,
                "student_name": f"{s.first_name} {s.last_name}".strip() or s.email,
                "student_email": s.email,
                "student_staff_id": s.student_staff_id,
                "result_id": result.id if result else None,
                "score": result.score if result else None,
                "grade": result.grade if result else "",
                "is_published": result.is_published if result else False,
            })
        return Response(RosterEntrySerializer(rows, many=True).data)

    def _get_owned_course(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise ValidationError("Course not found.")
        if not request.user.is_superuser and course.lecturer_id != request.user.id:
            raise PermissionDenied("You don't teach this course.")
        return course


class LecturerResultViewSet(viewsets.ModelViewSet):
    """Lecturers create/update grades for students on their own
    courses only — enforced both on write (validated below) and on
    read (queryset scoped to their courses)."""
    serializer_class = LecturerResultSerializer
    permission_classes = [IsLecturer]

    def get_queryset(self):
        qs = Result.objects.select_related("student", "course")
        if not self.request.user.is_superuser:
            qs = qs.filter(course__lecturer=self.request.user)
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def _check_course_ownership(self, course):
        if not self.request.user.is_superuser and course.lecturer_id != self.request.user.id:
            raise PermissionDenied("You don't teach this course.")

    def perform_create(self, serializer):
        course = serializer.validated_data["course"]
        self._check_course_ownership(course)
        serializer.save(
            academic_year=serializer.validated_data.get("academic_year") or course.academic_year,
            semester=serializer.validated_data.get("semester") or course.semester,
        )

    def perform_update(self, serializer):
        course = serializer.validated_data.get("course", serializer.instance.course)
        self._check_course_ownership(course)
        serializer.save()


class CourseMaterialViewSet(viewsets.ModelViewSet):
    """Lecturers manage materials on their own courses; students (and
    alumni) can read materials for courses they're registered on."""
    serializer_class = CourseMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CourseMaterial.objects.select_related("course", "uploaded_by")
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        if user.is_superuser:
            return qs
        if user.role == "lecturer":
            return qs.filter(course__lecturer=user)
        registered_course_ids = CourseRegistration.objects.filter(
            student=user, status=CourseRegistration.Status.REGISTERED
        ).values_list("course_id", flat=True)
        return qs.filter(course_id__in=registered_course_ids)

    def perform_create(self, serializer):
        course = serializer.validated_data["course"]
        user = self.request.user
        if not user.is_superuser and course.lecturer_id != user.id:
            raise PermissionDenied("You don't teach this course.")
        serializer.save()

    def perform_update(self, serializer):
        course = serializer.validated_data.get("course", serializer.instance.course)
        user = self.request.user
        if not user.is_superuser and course.lecturer_id != user.id:
            raise PermissionDenied("You don't teach this course.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.is_superuser and instance.course.lecturer_id != user.id:
            raise PermissionDenied("You don't teach this course.")
        instance.delete()
