const STYLES: Record<string, string> = {
  draft: "bg-surface-1 text-ink-secondary",
  submitted: "bg-gold-100 text-gold-800",
  editorial_screening: "bg-gold-100 text-gold-800",
  peer_review: "bg-gold-100 text-gold-800",
  revision_requested: "bg-alert-100 text-alert-700",
  accepted: "bg-secondary-100 text-secondary-800",
  published: "bg-secondary-100 text-secondary-800",
  rejected: "bg-alert-100 text-alert-700",
};

const DOT: Record<string, string> = {
  draft: "bg-ink-muted",
  submitted: "bg-gold-500",
  editorial_screening: "bg-gold-500",
  peer_review: "bg-gold-500",
  revision_requested: "bg-alert-500",
  accepted: "bg-secondary-500",
  published: "bg-secondary-500",
  rejected: "bg-alert-500",
};

const LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  editorial_screening: "Editorial screening",
  peer_review: "Peer review",
  revision_requested: "Revisions due",
  accepted: "Accepted",
  published: "Published",
  rejected: "Rejected",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium ${STYLES[status] || STYLES.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status] || DOT.draft}`} />
      {LABELS[status] || status}
    </span>
  );
}
