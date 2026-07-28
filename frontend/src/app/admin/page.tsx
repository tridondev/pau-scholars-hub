"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import {
  listSubmissions, getSubmissionStats, getInstitutes, advanceStatus,
  Submission, SubmissionStats, Institute,
} from "@/lib/api";

const DEBOUNCE_MS = 350;

const STATUS_OPTIONS = [
  ["", "All statuses"],
  ["draft", "Draft"],
  ["submitted", "Submitted"],
  ["editorial_screening", "Editorial screening"],
  ["peer_review", "Peer review"],
  ["revision_requested", "Revisions due"],
  ["accepted", "Accepted"],
  ["published", "Published"],
  ["rejected", "Rejected"],
];

const TYPE_OPTIONS = [
  ["", "All types"],
  ["journal_article", "Journal article"], ["conference_paper", "Conference paper"],
  ["thesis", "Thesis"], ["dissertation", "Dissertation"], ["policy_brief", "Policy brief"],
  ["working_paper", "Working paper"], ["book_chapter", "Book chapter"],
  ["book", "Book"], ["dataset", "Dataset"],
];

const STAT_CARDS: { key: keyof SubmissionStats; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "editorial_screening", label: "Editorial screening" },
  { key: "peer_review", label: "Peer review" },
  { key: "revision_requested", label: "Revisions due" },
  { key: "accepted", label: "Accepted" },
  { key: "published", label: "Published" },
];

export default function AdminOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [instituteFilter, setInstituteFilter] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditor = user?.role === "editor" || user?.role === "admin";

  useEffect(() => {
    if (!authLoading && (!user || !isEditor)) router.push("/dashboard");
  }, [authLoading, user, isEditor, router]);

  useEffect(() => {
    if (!isEditor) return;
    getInstitutes()
      .then((data) => setInstitutes(Array.isArray(data) ? data : data.results))
      .catch(() => {});
    refreshStats();
  }, [isEditor]); // eslint-disable-line react-hooks/exhaustive-deps

  function refreshStats() {
    getSubmissionStats().then(setStats).catch(() => {});
  }

  const load = useCallback((opts: {
    search: string; status: string; type: string; institute: string; page: number;
  }) => {
    setLoading(true);
    setError("");
    listSubmissions({
      search: opts.search || undefined,
      status: opts.status || undefined,
      submission_type: opts.type || undefined,
      institute: opts.institute || undefined,
      page: opts.page,
    })
      .then((data) => {
        setSubmissions(data.results);
        setCount(data.count);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load submissions."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isEditor) return;
    load({ search, status: statusFilter, type: typeFilter, institute: instituteFilter, page });
  }, [isEditor, statusFilter, typeFilter, instituteFilter, page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      load({ search: value, status: statusFilter, type: typeFilter, institute: instituteFilter, page: 1 });
    }, DEBOUNCE_MS);
  }

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function handleQuickPublish(id: string) {
    setPublishingId(id);
    setError("");
    try {
      await advanceStatus(id, "published");
      load({ search, status: statusFilter, type: typeFilter, institute: instituteFilter, page });
      refreshStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't publish this submission.");
    } finally {
      setPublishingId(null);
    }
  }

  if (authLoading || !user || !isEditor) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  const totalPages = Math.max(1, Math.ceil(count / 20));

  return (
    <div>
      <p className="eyebrow mb-3">Editorial control</p>
      <h1 className="font-display text-3xl mb-1">Admin overview</h1>
      <p className="text-sm text-ink-secondary mb-8">
        Every submission across the network, in one place.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="card px-4 py-4">
            <p className="font-display text-2xl">{stats ? stats[c.key] : "–"}</p>
            <p className="text-xs text-ink-secondary mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by title, abstract, or author…"
          className="field-input flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          className="field-input sm:w-56"
        >
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
          className="field-input sm:w-56"
        >
          {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          value={instituteFilter}
          onChange={(e) => handleFilterChange(setInstituteFilter, e.target.value)}
          className="field-input sm:w-56"
        >
          <option value="">All institutes</option>
          {institutes.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.acronym}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-alert-600 mb-6 card px-4 py-3 border-alert-200">{error}</p>
      )}

      {/* Results table */}
      <div className="card overflow-hidden">
        {loading && (
          <p className="text-sm text-ink-muted px-5 py-4">Loading…</p>
        )}
        {!loading && submissions.length === 0 && (
          <p className="text-sm text-ink-muted px-5 py-8 text-center">
            No submissions match these filters.
          </p>
        )}
        {!loading && submissions.length > 0 && (
          <div className="divide-y divide-[color:var(--border)]">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link href={`/dashboard/${s.id}`} className="font-display text-base hover:underline block truncate">
                    {s.title}
                  </Link>
                  <p className="font-mono text-xs text-ink-muted mt-1">
                    {s.corresponding_author_name} · {s.submission_type.replace("_", " ")} ·{" "}
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={s.status} />
                  {s.status === "accepted" && (
                    <button
                      onClick={() => handleQuickPublish(s.id)}
                      disabled={publishingId === s.id}
                      className="btn-secondary shrink-0 text-xs px-3 py-1.5"
                    >
                      {publishingId === s.id ? "Publishing…" : "Publish"}
                    </button>
                  )}
                  <Link href={`/dashboard/${s.id}`} className="text-xs text-primary-600 hover:underline shrink-0">
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-ink-muted font-mono text-xs">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
