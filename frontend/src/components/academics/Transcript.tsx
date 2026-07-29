"use client";
import { useEffect, useState } from "react";
import { getMyTranscript, TranscriptData } from "@/lib/api";

export default function Transcript() {
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyTranscript()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load transcript"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-secondary">Loading…</p>;
  if (error) return <p className="text-sm text-alert-600">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <p className="text-xs text-ink-muted">
          Official-format transcript, generated from published results.
        </p>
        <button onClick={() => window.print()} className="btn-secondary">
          Print / save as PDF
        </button>
      </div>

      <div className="card p-6 sm:p-8 print:border-0 print:shadow-none">
        <div className="border-b border-[color:var(--border)] pb-5 mb-6">
          <p className="eyebrow mb-2">Academic transcript</p>
          <h2 className="font-display text-2xl mb-1">{data.student.full_name}</h2>
          <p className="text-sm text-ink-secondary">
            {data.student.student_staff_id} · {data.student.email}
          </p>
          {(data.student.institute || data.student.programme) && (
            <p className="text-sm text-ink-secondary mt-1">
              {[data.student.institute, data.student.programme, data.student.department]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {data.periods.map((period) => (
            <div key={period.label}>
              <p className="font-mono text-xs uppercase tracking-wide text-ink-secondary mb-3">
                {period.label}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-muted border-b border-[color:var(--border)]">
                    <th className="font-medium pb-2 pr-3">Code</th>
                    <th className="font-medium pb-2 pr-3">Course title</th>
                    <th className="font-medium pb-2 pr-3 text-right">Units</th>
                    <th className="font-medium pb-2 pr-3 text-right">Score</th>
                    <th className="font-medium pb-2 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {period.results.map((r) => (
                    <tr key={r.id} className="border-b border-[color:var(--border)] last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{r.course_detail.code}</td>
                      <td className="py-2 pr-3">{r.course_detail.title}</td>
                      <td className="py-2 pr-3 text-right">{r.course_detail.credit_units}</td>
                      <td className="py-2 pr-3 text-right">{r.score ?? "—"}</td>
                      <td className="py-2 text-right font-medium">{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {data.periods.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-8">
              No published results yet — your transcript will populate as grades are released.
            </p>
          )}
        </div>

        <div className="border-t border-[color:var(--border)] mt-8 pt-5 flex items-center gap-8">
          <div>
            <p className="font-display text-2xl">{data.summary.cgpa}</p>
            <p className="text-xs text-ink-secondary mt-1">Cumulative GPA</p>
          </div>
          <div>
            <p className="font-display text-2xl">{data.summary.total_units}</p>
            <p className="text-xs text-ink-secondary mt-1">Total units</p>
          </div>
        </div>
      </div>
    </div>
  );
}
