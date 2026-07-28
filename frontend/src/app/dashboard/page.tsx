"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMySubmissions, Submission } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";

const SUMMARY_GROUPS: { label: string; statuses: string[] }[] = [
  { label: "In progress", statuses: ["draft", "submitted", "editorial_screening", "peer_review", "revision_requested"] },
  { label: "Accepted", statuses: ["accepted"] },
  { label: "Published", statuses: ["published"] },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getMySubmissions()
        .then((data) => setSubmissions(data.results))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  return (
    <div>
      <p className="eyebrow mb-3">Your work</p>
      <h1 className="font-display text-3xl mb-1">Submissions dashboard</h1>
      <p className="text-sm text-ink-secondary mb-8">
        Welcome back, {user.first_name || user.email}.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg">
        {SUMMARY_GROUPS.map((g) => (
          <div key={g.label} className="card px-4 py-4">
            <p className="font-display text-2xl">
              {submissions.filter((s) => g.statuses.includes(s.status)).length}
            </p>
            <p className="text-xs text-ink-secondary mt-1">{g.label}</p>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-ink-secondary">Loading…</p>}
      {error && (
        <p className="text-sm text-alert-600 card px-4 py-3 border-alert-200 mb-6">
          Couldn&rsquo;t load submissions ({error}).
        </p>
      )}

      <div className="space-y-3">
        {submissions.map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/${s.id}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 card px-4 py-3.5 hover:border-primary-300 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium break-words">{s.title}</p>
              <p className="font-mono text-xs text-ink-muted mt-1">
                {s.submission_type.replace("_", " ")} · {s.corresponding_author_name}
              </p>
            </div>
            <div className="self-start sm:self-auto shrink-0">
              <StatusBadge status={s.status} />
            </div>
          </Link>
        ))}
        {!loading && !error && submissions.length === 0 && (
          <p className="text-sm text-ink-muted card px-5 py-8 text-center">
            No submissions yet — <a href="/submit" className="text-primary-600 underline">start your first one</a>.
          </p>
        )}
      </div>
    </div>
  );
}
