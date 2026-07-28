"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { searchRepository, SearchResult } from "@/lib/api";
import { PAU_INSTITUTES } from "@/lib/institutes";

const DEBOUNCE_MS = 350;

export default function RepositoryPage() {
  const [query, setQuery] = useState("");
  const [instituteFilter, setInstituteFilter] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, institute: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await searchRepository(q, institute ? { institute } : {});
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Show the full published repository (alphabetical) as soon as the page loads,
  // rather than requiring the user to search first.
  useEffect(() => {
    runSearch("", "");
  }, [runSearch]);

  // Search-as-you-type: re-run automatically a moment after the user stops
  // typing, instead of waiting for the Search button or Enter.
  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      runSearch(value, instituteFilter);
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    runSearch(query, instituteFilter);
  }

  function handleInstituteClick(acronym: string) {
    setInstituteFilter(acronym);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    runSearch(query, acronym); // re-run immediately with the new value, not the stale state
  }

  return (
    <div>
      <p className="eyebrow mb-3">Continental research repository</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-8 max-w-xl">
        Search published work across the network.
      </h1>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-10">
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search titles, authors, keywords…"
          className="field-input flex-1"
        />
        <button className="btn-primary shrink-0">Search</button>
      </form>

      {error && (
        <p className="text-sm text-alert-600 mb-6 card px-4 py-3 border-alert-200">
          {error} — the Elasticsearch index may not be built yet in this environment.
        </p>
      )}

      <div className="grid md:grid-cols-[220px_1fr] gap-10">
        {/* Filter rail */}
        <aside className="md:space-y-6">
                  <div>
                    <p className="eyebrow mb-3">Institute</p>
                    <ul className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 md:flex-col md:gap-1.5 md:overflow-visible md:pb-0 md:mx-0 md:px-0 text-sm">
                      <li className="shrink-0 md:shrink">
                        <button
                          onClick={() => handleInstituteClick("")}
                          className={`px-3 py-1.5 rounded-full md:rounded-md md:w-full text-left whitespace-nowrap border md:border-0 ${!instituteFilter ? "bg-surface-1 font-medium border-[color:var(--border)]" : "text-ink-secondary hover:bg-surface-1 border-transparent"}`}
                        >
                          All institutes
                        </button>
                      </li>
                      {PAU_INSTITUTES.map((inst) => (
                        <li key={inst.acronym} className="shrink-0 md:shrink">
                          <button
                            onClick={() => handleInstituteClick(inst.acronym)}
                            className={`px-3 py-1.5 rounded-full md:rounded-md md:w-full text-left whitespace-nowrap border md:border-0 flex items-baseline gap-1.5 md:justify-between md:gap-2 ${instituteFilter === inst.acronym ? "bg-surface-1 font-medium border-[color:var(--border)]" : "text-ink-secondary hover:bg-surface-1 border-transparent"}`}
                          >
                            <span className="font-mono text-xs">{inst.acronym}</span>
                            <span className="text-xs text-ink-muted">{inst.country}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>

        {/* Results */}
        <div>
          {loading && (
            <p className="text-sm text-ink-muted px-1 mb-4">Loading…</p>
          )}
          <div className="divide-y divide-[color:var(--border)]">
            {results.map((r) => (
              <article key={r.id} className="py-5 first:pt-0">
                <h2 className="font-display text-lg mb-1.5">{r.title}</h2>
                <p className="text-sm text-ink-secondary leading-relaxed line-clamp-2 mb-2">
                  {r.abstract}
                </p>
                <p className="font-mono text-xs text-ink-muted">
                  {r.authors?.join(", ")} · {r.institute} · {r.year}
                </p>
              </article>
            ))}
          </div>
          {!loading && !error && results.length === 0 && (
            <p className="text-sm text-ink-muted card px-5 py-8 text-center">
              {query || instituteFilter
                ? <>No results for &ldquo;{query}&rdquo;. Try a different keyword or clear the institute filter.</>
                : "No published work in the repository yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
