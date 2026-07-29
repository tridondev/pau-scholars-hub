"use client";
import { useEffect, useState } from "react";
import { getMyResults, Result } from "@/lib/api";

const GRADE_STYLES: Record<string, string> = {
  A: "bg-secondary-100 text-secondary-800",
  B: "bg-secondary-100 text-secondary-800",
  C: "bg-gold-100 text-gold-800",
  D: "bg-gold-100 text-gold-800",
  E: "bg-alert-100 text-alert-700",
  F: "bg-alert-100 text-alert-700",
};

export default function StudentResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyResults()
      .then(setResults)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load results"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-secondary">Loading…</p>;
  if (error) return <p className="text-sm text-alert-600">{error}</p>;

  return (
    <div className="space-y-2.5">
      {results.map((r) => (
        <div key={r.id} className="card px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {r.course_detail.code} — {r.course_detail.title}
            </p>
            <p className="font-mono text-xs text-ink-muted mt-1">
              {r.academic_year} · {r.semester === "first" ? "First semester" : "Second semester"} ·{" "}
              {r.course_detail.credit_units} units
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium ${
              GRADE_STYLES[r.grade] || "bg-surface-1 text-ink-secondary"
            }`}
          >
            {r.grade}
          </span>
        </div>
      ))}
      {results.length === 0 && (
        <p className="text-sm text-ink-muted card px-5 py-8 text-center">
          No published results yet.
        </p>
      )}
    </div>
  );
}
