"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getMyReviews, submitReviewDecision, ReviewAssignment } from "@/lib/api";

const DECISIONS = [
  ["pending", "Pending"],
  ["accept", "Accept"],
  ["minor_revisions", "Minor revisions"],
  ["major_revisions", "Major revisions"],
  ["reject", "Reject"],
];

function ReviewRow({ review, onSaved }: { review: ReviewAssignment; onSaved: () => void }) {
  const [decision, setDecision] = useState(review.decision);
  const [commentsToAuthor, setCommentsToAuthor] = useState(review.comments_to_author);
  const [commentsToEditor, setCommentsToEditor] = useState(review.comments_to_editor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await submitReviewDecision(review.id, {
        decision, comments_to_author: commentsToAuthor, comments_to_editor: commentsToEditor,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/dashboard/${review.submission}`} className="font-medium text-sm text-primary-600 underline break-words">
          {review.submission_title}
        </Link>
        {review.due_date && <span className="text-xs text-ink-muted shrink-0">Due {review.due_date}</span>}
      </div>

      <div>
        <label className="field-label">Decision</label>
        <select value={decision} onChange={(e) => setDecision(e.target.value)} className="field-input">
          {DECISIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label">Comments to author</label>
        <textarea value={commentsToAuthor} onChange={(e) => setCommentsToAuthor(e.target.value)} rows={3} className="field-input resize-y" />
      </div>
      <div>
        <label className="field-label">Comments to editor (private)</label>
        <textarea value={commentsToEditor} onChange={(e) => setCommentsToEditor(e.target.value)} rows={3} className="field-input resize-y" />
      </div>

      {error && <p className="text-sm text-alert-600">{error}</p>}
      <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save review"}</button>
    </form>
  );
}

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getMyReviews()
      .then((data) => setReviews(Array.isArray(data) ? data : data.results))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load reviews."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => { load(); }, []);

  if (authLoading || !user) return <p className="text-sm text-ink-secondary">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <p className="eyebrow mb-3">Peer review</p>
      <h1 className="font-display text-3xl mb-8">Your assigned reviews</h1>

      {loading && <p className="text-sm text-ink-secondary">Loading…</p>}
      {error && <p className="text-sm text-alert-600">{error}</p>}

      <div className="space-y-6">
        {reviews.map((r) => <ReviewRow key={r.id} review={r} onSaved={load} />)}
        {!loading && !error && reviews.length === 0 && (
          <p className="text-sm text-ink-muted card px-5 py-8 text-center">No reviews assigned to you yet.</p>
        )}
      </div>
    </div>
  );
}
