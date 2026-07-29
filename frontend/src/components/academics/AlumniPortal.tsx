"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAlumniDirectory, AlumniDirectoryEntry } from "@/lib/api";

export default function AlumniPortal() {
  const [entries, setEntries] = useState<AlumniDirectoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAlumniDirectory()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the directory"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.full_name.toLowerCase().includes(q) ||
      e.institute.toLowerCase().includes(q) ||
      e.programme.toLowerCase().includes(q) ||
      e.country.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <Link
        href="/services/academic_transcripts"
        className="card px-4 py-3.5 flex items-center justify-between mb-8 hover:border-primary-300 transition-colors"
      >
        <div>
          <p className="text-sm font-medium">Your academic transcript</p>
          <p className="text-xs text-ink-secondary mt-1">
            View or print your official-format transcript
          </p>
        </div>
        <span className="text-sm text-primary-600" aria-hidden>
          &rarr;
        </span>
      </Link>

      <p className="eyebrow mb-3">Alumni directory</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="field-input max-w-sm mb-5"
        placeholder="Search by name, institute, or country"
      />

      {error && <p className="text-sm text-alert-600 mb-4">{error}</p>}
      {loading && <p className="text-sm text-ink-secondary">Loading…</p>}

      {!loading && (
        <div className="space-y-2.5">
          {filtered.map((e) => (
            <div key={e.id} className="card px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.full_name}</p>
                <p className="font-mono text-xs text-ink-muted mt-1">
                  {[e.programme, e.institute, e.country].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-ink-muted card px-5 py-8 text-center">
              No alumni match your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
