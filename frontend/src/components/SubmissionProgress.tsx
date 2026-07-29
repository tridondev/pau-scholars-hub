// The linear "happy path" a submission travels through. `revision_requested`
// isn't its own step — it's a flag on top of `peer_review` (the author is
// still at the peer-review stage, just waiting on their own revisions), and
// `rejected` is a terminal exit rather than a forward step (see below).
const STAGES = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "editorial_screening", label: "Editorial screening" },
  { key: "peer_review", label: "Peer review" },
  { key: "accepted", label: "Accepted" },
  { key: "published", label: "Published" },
];

export default function SubmissionProgress({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const isRevisionRequested = status === "revision_requested";
  const effectiveStatus = isRevisionRequested ? "peer_review" : status;
  const currentIndex = STAGES.findIndex((s) => s.key === effectiveStatus);

  if (isRejected) {
    return (
      <div className="card px-4 py-3.5 border-alert-200 bg-alert-50/40">
        <p className="text-sm font-medium text-alert-700">Not accepted for publication</p>
        <p className="text-xs text-ink-secondary mt-1">
          This submission was reviewed and was not accepted to move forward in the pipeline.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ol className="flex items-start">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={stage.key} className="flex-1 flex flex-col items-center min-w-0 relative">
              {i > 0 && (
                <span
                  className={`absolute top-3 right-1/2 w-full h-0.5 ${
                    i <= currentIndex ? "bg-secondary-500" : "bg-[color:var(--border)]"
                  }`}
                />
              )}
              <span
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${
                  isDone
                    ? "bg-secondary-500 text-white"
                    : isCurrent
                    ? "bg-primary-600 text-white ring-4 ring-primary-100"
                    : "bg-surface-1 text-ink-muted border border-[color:var(--border)]"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={`mt-2 text-[11px] text-center leading-tight px-1 ${
                  isCurrent ? "font-medium text-ink-primary" : "text-ink-muted"
                }`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
      {isRevisionRequested && (
        <p className="mt-4 text-xs text-alert-700 bg-alert-50 border border-alert-200 rounded-md px-3 py-2">
          Revisions requested — the editors are waiting on updates from you before peer review can continue.
        </p>
      )}
    </div>
  );
}
