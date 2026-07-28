"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import StatusBadge from "@/components/StatusBadge";
import {
  getSubmission, updateSubmission, submitForReview,
  addAuthor, removeAuthor, uploadSubmissionFile, removeSubmissionFile,
  advanceStatus, assignReviewer, getReviewers, getInstitutes,
  SubmissionDetail, Institute, ReviewerOption,
} from "@/lib/api";
import { SDGS } from "@/lib/sdgs";
import { AU_AGENDA_AREAS } from "@/lib/au_agenda";

const TYPES = [
  ["journal_article", "Journal article"], ["conference_paper", "Conference paper"],
  ["thesis", "Thesis"], ["dissertation", "Dissertation"], ["policy_brief", "Policy brief"],
  ["working_paper", "Working paper"], ["book_chapter", "Book chapter"],
  ["book", "Book"], ["dataset", "Dataset"],
];

const STATUSES = [
  "draft", "submitted", "editorial_screening", "peer_review",
  "revision_requested", "accepted", "published", "rejected",
];

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // Edit-form local state (populated once the submission loads)
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [type, setType] = useState("journal_article");
  const [institute, setInstitute] = useState("");
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [researchArea, setResearchArea] = useState("");
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [auAgendaAreas, setAuAgendaAreas] = useState<string[]>([]);
  const [references, setReferences] = useState("");

  // Co-author mini-form
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorInstitution, setAuthorInstitution] = useState("");

  // Editor controls
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getSubmission(id)
      .then((s) => {
        setSubmission(s);
        setTitle(s.title);
        setAbstract(s.abstract);
        setKeywords(s.keywords.join(", "));
        setType(s.submission_type);
        setInstitute(s.institute || "");
        setResearchArea(s.research_area);
        setSdgs(s.sdgs);
        setAuAgendaAreas(s.au_agenda_areas);
        setReferences(s.references);
        setNextStatus(s.status);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load this submission."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getInstitutes().then((data) => setInstitutes(Array.isArray(data) ? data : data.results)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === "editor" || user?.role === "admin") {
      getReviewers()
        .then((data) => setReviewers(Array.isArray(data) ? data : data.results))
        .catch(() => {});
    }
  }, [user]);

  function toggleSdg(code: string) {
    setSdgs((prev) => (prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]));
  }

  function toggleAuAgenda(code: string) {
    setAuAgendaAreas((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateSubmission(id, {
        title, abstract, submission_type: type,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        institute: institute || null,
        research_area: researchArea,
        au_agenda_areas: auAgendaAreas,
        sdgs,
        references,
      });
      setSubmission(updated);
      setNotice("Changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    setSaving(true);
    setError("");
    try {
      await submitForReview(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit for review.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAuthor(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim()) return;
    setError("");
    try {
      await addAuthor(id, { full_name: authorName, email: authorEmail, institution: authorInstitution });
      setAuthorName(""); setAuthorEmail(""); setAuthorInstitution("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add co-author.");
    }
  }

  async function handleRemoveAuthor(authorId: string) {
    setError("");
    try {
      await removeAuthor(id, authorId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove co-author.");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      await uploadSubmissionFile(id, file);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload file.");
    } finally {
      e.target.value = "";
    }
  }

  async function handleRemoveFile(fileId: string) {
    setError("");
    try {
      await removeSubmissionFile(id, fileId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove file.");
    }
  }

  async function handleAdvanceStatus() {
    setError("");
    try {
      const updated = await advanceStatus(id, nextStatus);
      setSubmission(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update status.");
    }
  }

  async function handleAssignReviewer(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewerId) return;
    setError("");
    try {
      await assignReviewer(id, reviewerId, dueDate || undefined);
      setReviewerId(""); setDueDate("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't assign reviewer.");
    }
  }

  if (authLoading || loading) return <p className="text-sm text-ink-secondary">Loading…</p>;
  if (error && !submission) return <p className="text-sm text-alert-600">{error}</p>;
  if (!submission) return null;

  const isEditor = user?.role === "editor" || user?.role === "admin";
  const isOwner = submission.corresponding_author === user?.id;
  const isDraft = submission.status === "draft";
  const canEdit = isOwner && isDraft;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="eyebrow">Submission</p>
        <StatusBadge status={submission.status} />
      </div>
      <h1 className="font-display text-3xl mb-6">{submission.title}</h1>

      {notice && <p className="text-sm text-secondary-700 mb-4">{notice}</p>}
      {error && <p className="text-sm text-alert-600 mb-4">{error}</p>}

      {/* --- Core fields --- */}
      <form onSubmit={handleSave} className="card p-6 sm:p-8 space-y-6 mb-8">
        <div>
          <label className="field-label">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" required disabled={!canEdit} />
        </div>
        <div>
          <label className="field-label">Submission type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="field-input" disabled={!canEdit}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Abstract</label>
          <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={6} className="field-input resize-y" required disabled={!canEdit} />
        </div>
        <div>
          <label className="field-label">Keywords</label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="field-input" disabled={!canEdit} />
        </div>
        <div>
          <label className="field-label">Institute</label>
          <select value={institute} onChange={(e) => setInstitute(e.target.value)} className="field-input" disabled={!canEdit}>
            <option value="">Select an institute</option>
            {institutes.map((inst) => <option key={inst.id} value={inst.id}>{inst.acronym} — {inst.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Research area</label>
          <input value={researchArea} onChange={(e) => setResearchArea(e.target.value)} className="field-input" disabled={!canEdit} />
        </div>
        <div>
          <label className="field-label">SDGs addressed</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SDGS.map((s) => (
              <label key={s.code} className="flex items-center gap-2 text-xs text-ink-secondary">
                <input type="checkbox" checked={sdgs.includes(s.code)} onChange={() => toggleSdg(s.code)} disabled={!canEdit} />
                {s.code} · {s.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">AU Agenda 2063 areas addressed</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AU_AGENDA_AREAS.map((a) => (
              <label key={a.code} className="flex items-center gap-2 text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={auAgendaAreas.includes(a.code)}
                  onChange={() => toggleAuAgenda(a.code)}
                />
                {a.code} · {a.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">References</label>
          <textarea value={references} onChange={(e) => setReferences(e.target.value)} rows={4} className="field-input resize-y" disabled={!canEdit} />
        </div>

        {canEdit && (
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            <button type="button" onClick={handleSubmitForReview} disabled={saving} className="btn-secondary">
              Submit for review
            </button>
          </div>
        )}
        {!canEdit && !isEditor && (
          <p className="text-xs text-ink-muted">
            This submission is past the draft stage and can no longer be edited.
          </p>
        )}
      </form>

      {/* --- Co-authors --- */}
      <section className="card p-6 sm:p-8 space-y-4 mb-8">
        <h2 className="font-display text-lg">Co-authors</h2>
        <ul className="space-y-2">
          {submission.authors.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-sm gap-3">
              <span>{a.full_name}{a.institution ? ` — ${a.institution}` : ""}{a.email ? ` (${a.email})` : ""}</span>
              {canEdit && (
                <button onClick={() => handleRemoveAuthor(a.id)} className="text-xs text-alert-600">Remove</button>
              )}
            </li>
          ))}
          {submission.authors.length === 0 && <p className="text-sm text-ink-muted">No co-authors added yet.</p>}
        </ul>
        {canEdit && (
          <form onSubmit={handleAddAuthor} className="grid sm:grid-cols-3 gap-2 pt-2">
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Full name" className="field-input" />
            <input value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="Email (optional)" className="field-input" />
            <input value={authorInstitution} onChange={(e) => setAuthorInstitution(e.target.value)} placeholder="Institution (optional)" className="field-input" />
            <button className="btn-secondary sm:col-span-3 w-fit">Add co-author</button>
          </form>
        )}
      </section>

      {/* --- Files --- */}
      <section className="card p-6 sm:p-8 space-y-4 mb-8">
        <h2 className="font-display text-lg">Files</h2>
        <ul className="space-y-2">
          {submission.files.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-sm gap-3">
              <a href={f.file} target="_blank" rel="noreferrer" className="text-primary-600 underline break-all">
                {f.label}
              </a>
              {canEdit && (
                <button onClick={() => handleRemoveFile(f.id)} className="text-xs text-alert-600 shrink-0">Remove</button>
              )}
            </li>
          ))}
          {submission.files.length === 0 && <p className="text-sm text-ink-muted">No files uploaded yet.</p>}
        </ul>
        {canEdit && (
          <div>
            <label className="field-label">Upload a file (manuscript, dataset, supplementary)</label>
            <input type="file" onChange={handleFileUpload} className="field-input" />
          </div>
        )}
      </section>

      {/* --- Reviews --- */}
      {submission.review_assignments.length > 0 && (
        <section className="card p-6 sm:p-8 space-y-3 mb-8">
          <h2 className="font-display text-lg">Peer review</h2>
          <ul className="space-y-2 text-sm">
            {submission.review_assignments.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span>{r.reviewer_name || "Reviewer"} — {r.decision.replace("_", " ")}</span>
                {r.due_date && <span className="text-xs text-ink-muted">Due {r.due_date}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Editor controls --- */}
      {isEditor && (
        <section className="card p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-lg">Editorial controls</h2>

          <div>
            <label className="field-label">Move to stage</label>
            <div className="flex items-center gap-3">
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="field-input">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              <button onClick={handleAdvanceStatus} className="btn-secondary shrink-0">Update</button>
            </div>
          </div>

          <form onSubmit={handleAssignReviewer} className="space-y-3">
            <label className="field-label">Assign a reviewer</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="field-input">
                <option value="">Select a reviewer</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>{r.first_name} {r.last_name} ({r.email})</option>
                ))}
              </select>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field-input" />
              <button className="btn-secondary shrink-0">Assign</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
