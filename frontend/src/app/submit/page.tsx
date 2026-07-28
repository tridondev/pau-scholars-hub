"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSubmission, getInstitutes, Institute } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SDGS } from "@/lib/sdgs";

const TYPES = [
  ["journal_article", "Journal article"], ["conference_paper", "Conference paper"],
  ["thesis", "Thesis"], ["dissertation", "Dissertation"], ["policy_brief", "Policy brief"],
  ["working_paper", "Working paper"], ["book_chapter", "Book chapter"],
  ["book", "Book"], ["dataset", "Dataset"],
];

const STAGES = ["Draft", "Submitted", "Peer review", "Published"];

export default function SubmitPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [type, setType] = useState("journal_article");
  const [institute, setInstitute] = useState("");
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [researchArea, setResearchArea] = useState("");
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [references, setReferences] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    getInstitutes()
      .then((data) => setInstitutes(Array.isArray(data) ? data : data.results))
      .catch(() => setInstitutes([]));
  }, []);

  function toggleSdg(code: string) {
    setSdgs((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createSubmission({
        title, abstract, submission_type: type,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        institute: institute || null,
        research_area: researchArea,
        sdgs,
        references,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !user) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow mb-3">New submission</p>
      <h1 className="font-display text-3xl mb-2">Submit your research</h1>
      <p className="text-sm text-ink-secondary mb-8">
        Saved as a draft first — you can review and send it for editorial
        screening from your dashboard.
      </p>

      {/* Stage rail, for orientation — this submission starts at "Draft" */}
      <ol className="flex items-center gap-2 mb-10 text-xs font-mono">
        {STAGES.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 ${i === 0 ? "text-primary-600 font-medium" : "text-ink-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-primary-500" : "bg-ink-muted/40"}`} />
              {s.toUpperCase()}
            </span>
            {i < STAGES.length - 1 && <span className="text-ink-muted/40">—</span>}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        <div>
          <label className="field-label">Title</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="field-input" required
            placeholder="The title readers will cite"
          />
        </div>

        <div>
          <label className="field-label">Submission type</label>
          <select
            value={type} onChange={(e) => setType(e.target.value)}
            className="field-input"
          >
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="field-label">Abstract</label>
          <textarea
            value={abstract} onChange={(e) => setAbstract(e.target.value)}
            rows={6} className="field-input resize-y" required
            placeholder="A concise summary of the research question, method, and findings"
          />
        </div>

        <div>
          <label className="field-label">Keywords</label>
          <input
            value={keywords} onChange={(e) => setKeywords(e.target.value)}
            className="field-input"
            placeholder="Separate with commas — e.g. water security, climate adaptation"
          />
        </div>

        <div>
          <label className="field-label">Institute</label>
          <select
            value={institute} onChange={(e) => setInstitute(e.target.value)}
            className="field-input"
          >
            <option value="">Select an institute</option>
            {institutes.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.acronym} — {inst.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Research area</label>
          <input
            value={researchArea} onChange={(e) => setResearchArea(e.target.value)}
            className="field-input"
            placeholder="e.g. Renewable energy systems"
          />
        </div>

        <div>
          <label className="field-label">SDGs addressed</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SDGS.map((s) => (
              <label key={s.code} className="flex items-center gap-2 text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={sdgs.includes(s.code)}
                  onChange={() => toggleSdg(s.code)}
                />
                {s.code} · {s.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">References</label>
          <textarea
            value={references} onChange={(e) => setReferences(e.target.value)}
            rows={4} className="field-input resize-y"
            placeholder="One reference per line"
          />
        </div>

        {error && <p className="text-sm text-alert-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save as draft"}
          </button>
          <span className="text-xs text-ink-muted">You can add co-authors and files after saving.</span>
        </div>
      </form>
    </div>
  );
}
