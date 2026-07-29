from rest_framework import serializers
from .models import Course, CourseRegistration, Result, CourseMaterial


class CourseSerializer(serializers.ModelSerializer):
    institute_name = serializers.CharField(source="institute.acronym", read_only=True, default="")
    lecturer_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "code", "title", "description", "credit_units",
            "institute", "institute_name", "lecturer", "lecturer_name",
            "academic_year", "semester", "is_open_for_registration",
        ]

    def get_lecturer_name(self, obj):
        if not obj.lecturer:
            return ""
        return f"{obj.lecturer.first_name} {obj.lecturer.last_name}".strip() or obj.lecturer.email


class CourseRegistrationSerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source="course", read_only=True)

    class Meta:
        model = CourseRegistration
        fields = ["id", "course", "course_detail", "academic_year", "semester", "status", "registered_at"]
        read_only_fields = ["id", "status", "registered_at"]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["student"] = request.user
        # Default the registration period to the course's own year/semester
        # unless the client explicitly overrides it.
        course = validated_data["course"]
        validated_data.setdefault("academic_year", course.academic_year)
        validated_data.setdefault("semester", course.semester)
        return super().create(validated_data)


class ResultSerializer(serializers.ModelSerializer):
    """Read-only, student-facing shape of a result."""
    course_detail = CourseSerializer(source="course", read_only=True)

    class Meta:
        model = Result
        fields = [
            "id", "course", "course_detail", "academic_year", "semester",
            "score", "grade", "grade_point", "is_published", "updated_at",
        ]
        read_only_fields = fields


class LecturerResultSerializer(serializers.ModelSerializer):
    """Write-enabled shape used by a lecturer to enter/update a grade
    for one of their own students. `course` is restricted to the
    lecturer's own courses at the view layer."""
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source="student.email", read_only=True)
    # Defaulted from the course in the view (perform_create/perform_update)
    # when omitted, so a lecturer doesn't have to repeat them per student.
    academic_year = serializers.CharField(required=False)
    semester = serializers.ChoiceField(choices=Result._meta.get_field("semester").choices, required=False)

    class Meta:
        model = Result
        fields = [
            "id", "student", "student_name", "student_email", "course",
            "academic_year", "semester", "score", "grade", "grade_point",
            "is_published", "updated_at",
        ]
        read_only_fields = ["id", "grade", "grade_point", "updated_at"]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.email

    def create(self, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().update(instance, validated_data)


class CourseMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    course_code = serializers.CharField(source="course.code", read_only=True)

    class Meta:
        model = CourseMaterial
        fields = ["id", "course", "course_code", "title", "file", "uploaded_by_name", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return ""
        return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.email

    def create(self, validated_data):
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)


class RosterEntrySerializer(serializers.Serializer):
    """One row of a lecturer's class list: the student plus their
    current (possibly absent) result for this course/period."""
    registration_id = serializers.UUIDField()
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    student_email = serializers.EmailField()
    student_staff_id = serializers.CharField()
    result_id = serializers.UUIDField(allow_null=True)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    grade = serializers.CharField(allow_blank=True)
    is_published = serializers.BooleanField()


class GpaSemesterSerializer(serializers.Serializer):
    academic_year = serializers.CharField()
    semester = serializers.CharField()
    gpa = serializers.DecimalField(max_digits=4, decimal_places=2)
    total_units = serializers.IntegerField()
    course_count = serializers.IntegerField()


class GpaSummarySerializer(serializers.Serializer):
    cgpa = serializers.DecimalField(max_digits=4, decimal_places=2)
    total_units = serializers.IntegerField()
    semesters = GpaSemesterSerializer(many=True)
