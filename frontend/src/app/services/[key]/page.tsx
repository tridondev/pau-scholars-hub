"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getMyServices, UniversityServiceLite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import CourseRegistration from "@/components/academics/CourseRegistration";
import GpaCgpa from "@/components/academics/GpaCgpa";
import StudentResults from "@/components/academics/StudentResults";
import Transcript from "@/components/academics/Transcript";
import StudentPortal from "@/components/academics/StudentPortal";
import AlumniPortal from "@/components/academics/AlumniPortal";
import LecturerCourses from "@/components/academics/LecturerCourses";

const COMPONENTS: Record<string, React.ComponentType> = {
  course_registration: CourseRegistration,
  gpa_cgpa: GpaCgpa,
  student_results: StudentResults,
  academic_transcripts: Transcript,
  student_portal: StudentPortal,
  alumni_portal: AlumniPortal,
  course_management: LecturerCourses,
};

export default function ServiceDetailPage() {
  const { key } = useParams<{ key: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<UniversityServiceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getMyServices()
        .then((data) => setServices(Array.isArray(data) ? data : data.results))
        .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load services"))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || loading) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  const service = services.find((s) => s.key === key);
  const Component = COMPONENTS[key];

  if (error || !service || !Component) {
    return (
      <div>
        <p className="eyebrow mb-3">Services</p>
        <h1 className="font-display text-2xl mb-3">Not available</h1>
        <p className="text-sm text-ink-secondary mb-6">
          {error || "This service isn't available for your role, or it's currently inactive."}
        </p>
        <Link href="/services" className="btn-secondary">
          Back to services
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-3">
        <Link href="/services" className="hover:underline">
          Services
        </Link>
      </p>
      <h1 className="font-display text-3xl mb-2">{service.name}</h1>
      <p className="text-sm text-ink-secondary mb-8 max-w-xl">{service.description}</p>
      <Component />
    </div>
  );
}
