"use client";
import { useEffect, useState } from "react";
import { getMyGpa, GpaSummary } from "@/lib/api";

export default function GpaCgpa() {
  const [data, setData] = useState<GpaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyGpa()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load GPA"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-secondary">Loading…</p>;
  if (error) return <p className="text-sm text-alert-600">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
        <div className="card px-5 py-5">
          <p className="font-display text-3xl">{data.cgpa}</p>
          <p className="text-xs text-ink-secondary mt-1">Cumulative GPA</p>
        </div>
        <div className="card px-5 py-5">
          <p className="font-display text-3xl">{data.total_units}</p>
          <p className="text-xs text-ink-secondary mt-1">Total units completed</p>
        </div>
      </div>

      <p className="eyebrow mb-3">Per semester</p>
      <div className="space-y-2.5">
        {data.semesters.map((s) => (
          <div
            key={`${s.academic_year}-${s.semester}`}
            className="card px-4 py-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">
                {s.academic_year} · {s.semester === "first" ? "First semester" : "Second semester"}
              </p>
              <p className="font-mono text-xs text-ink-muted mt-1">
                {s.course_count} course{s.course_count === 1 ? "" : "s"} · {s.total_units} units
              </p>
            </div>
            <p className="font-display text-xl">{s.gpa}</p>
          </div>
        ))}
        {data.semesters.length === 0 && (
          <p className="text-sm text-ink-muted card px-5 py-8 text-center">
            No published results yet — your GPA appears here once a semester is graded.
          </p>
        )}
      </div>
    </div>
  );
}
