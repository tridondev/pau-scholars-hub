"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { key: "course_registration", title: "Course registration", body: "Browse open courses and register for the semester." },
  { key: "student_results", title: "Results", body: "View your published grades by course." },
  { key: "gpa_cgpa", title: "GPA / CGPA", body: "Track your grade point average per semester and overall." },
  { key: "academic_transcripts", title: "Transcript", body: "View or print your official-format transcript." },
];

export default function StudentPortal() {
  const { user } = useAuth();

  return (
    <div>
      <p className="text-sm text-ink-secondary mb-8">
        Welcome, {user?.first_name || "there"}. Everything you need to manage your
        academic record lives across these four tools.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {LINKS.map((l) => (
          <Link
            key={l.key}
            href={`/services/${l.key}`}
            className="card p-5 flex flex-col hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-display text-lg mb-1.5">{l.title}</h3>
            <p className="text-sm text-ink-secondary leading-relaxed flex-1">{l.body}</p>
            <span className="text-sm font-medium text-primary-600 mt-4 inline-flex items-center gap-1">
              Open <span aria-hidden>&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
