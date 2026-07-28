"use client";
import Link from "next/link";
import Image from "next/image";
import InstituteConstellation from "@/components/InstituteConstellation";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  {
    label: "Submit",
    title: "Submit and track research",
    body: "Journal articles, theses, working papers, datasets, and more — moving through editorial screening and peer review with full visibility.",
    href: "/submit",
    cta: "Start a submission",
  },
  {
    label: "Discover",
    title: "Search the continental repository",
    body: "Filter published scholarship by institute, country, faculty, research area, and the SDGs it addresses.",
    href: "/repository",
    cta: "Browse the repository",
  },
  {
    label: "Track",
    title: "Follow your work end to end",
    body: "From draft to published article, with reviewer assignments, decisions, and DOI status in one dashboard.",
    href: "/dashboard",
    cta: "Open your dashboard",
  },
];

const STEPS = [
  { n: "01", title: "Submit", body: "Upload your manuscript, dataset, or thesis with abstract, keywords, and co-authors." },
  { n: "02", title: "Review", body: "Editors screen it in, reviewers weigh in, and you get clear, tracked feedback." },
  { n: "03", title: "Publish", body: "Accepted work gets a DOI, a permanent home, and a place in a journal issue." },
  { n: "04", title: "Discover", body: "It's searchable across the continent by institute, country, topic, SDG and the Agenda 2063." },
];

// A representative sample of the UN Sustainable Development Goals research
// on the platform is tagged against — real framework, not invented data.
const SAMPLE_SDGS = [
  "SDG 1 · No poverty",
  "SDG 2 · Zero hunger",
  "SDG 3 · Good health & well-being",
  "SDG 4 · Quality education",
  "SDG 5 · Gender equality",
  "SDG 6 · Clean water & sanitation",
  "SDG 7 · Affordable & clean energy",
  "SDG 8 · Decent work & economic growth",
  "SDG 9 · Industry, innovation & infrastructure",
  "SDG 10 · Reduced inequalities",
  "SDG 11 · Sustainable cities & communities",
  "SDG 12 · Responsible consumption & production",
  "SDG 13 · Climate action",
  "SDG 14 · Life below water",
  "SDG 15 · Life on land",
  "SDG 16 · Peace, justice & strong institutions",
  "SDG 17 · Partnerships for the goals",
];
// The full set of AU Agenda 2063 aspirations research on the platform
// is tagged against â€” real framework, not invented data.
const SAMPLE_AU_AGENDA = [
  "Aspiration 1 · A prosperous Africa",
  "Aspiration 2 · An integrated continent",
  "Aspiration 3 · Good governance, democracy & human rights",
  "Aspiration 4 · A peaceful & secure Africa",
  "Aspiration 5 · Strong cultural identity & shared values",
  "Aspiration 6 · People-driven development",
  "Aspiration 7 · Africa as a global player & partner",
];

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div>
      {/* Masthead hero — full-bleed regardless of the max-w-6xl content
          column it sits inside. `-mx-4 sm:-mx-6` alone only cancels the
          <main> element's own padding, so the colour stopped at the
          content column's edge instead of reaching the viewport edge.
          The left-1/2 / -ml-[50vw] pairing breaks it out to true full
          width no matter how deep it's nested, then an inner max-w-6xl
          wrapper re-centers the actual content. */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen -mt-8 sm:-mt-12 bg-masthead-gradient text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-20 relative">
          <div className="max-w-3xl rise-in">
            {/* Institutional lockup — PAU + African Union wordmarks, each
                on its own white chip since both logos are dark-on-white
                and would disappear against the masthead gradient. Widths
                are left to scale (h-* + w-auto) since these are wide
                horizontal lockups, not square icons. */}
            <div className="flex items-center gap-4 mb-7">
              <span className="bg-white rounded-md px-2.5 py-1.5 flex items-center">
                <Image
                  src="/logos/pau-logo.jpeg"
                  alt="Pan African University"
                  width={588}
                  height={294}
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </span>
              <span className="h-8 w-px bg-white/20" aria-hidden />
              <span className="bg-white rounded-md px-2.5 py-1.5 flex items-center">
                <Image
                  src="/logos/au-logo.png"
                  alt="African Union"
                  width={1157}
                  height={409}
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </span>
            </div>

            <p className="eyebrow text-gold-400 mb-5">
              The Pan African University · Continental Research Network
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.08] mb-6">
              Connecting African scholars.
              <br />
              <span className="italic text-gold-300">Advancing African knowledge.</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mb-9">
              One platform for submission, peer review, publishing, and
              discovery built for every student, researcher, and faculty
              member across PAU&rsquo;s five institutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {!loading && user ? (
                <>
                  <Link href="/submit" className="btn-primary bg-secondary-500 hover:bg-secondary-600 px-6 py-3">
                    Submit research
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 border border-white/25 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Go to dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn-primary bg-secondary-500 hover:bg-secondary-600 px-6 py-3">
                    Create your free account
                  </Link>
                  <Link
                    href="/repository"
                    className="inline-flex items-center justify-center gap-2 border border-white/25 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    Browse the repository
                  </Link>
                </>
              )}
            </div>
            {!loading && !user && (
              <p className="text-xs text-white/40 mt-5 font-mono">
                ALREADY HAVE AN ACCOUNT? <Link href="/login" className="underline hover:text-white">SIGN IN &rarr;</Link>
              </p>
            )}
          </div>

          {/* decorative constellation, echoing the 5-institute motif */}
          <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 w-64 h-64 opacity-70 constellation-drift" aria-hidden>
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="40" cy="150" r="4" fill="#DFBA6C" opacity="0.55" />
              <circle cx="95" cy="40" r="5" fill="#DFBA6C" opacity="0.7" />
              <circle cx="160" cy="90" r="6" fill="#DFBA6C" opacity="0.85" />
              <circle cx="120" cy="170" r="4.5" fill="#DFBA6C" opacity="0.6" />
              <circle cx="175" cy="30" r="3.5" fill="#DFBA6C" opacity="0.5" />
              <line x1="40" y1="150" x2="95" y2="40" stroke="#DFBA6C" strokeOpacity="0.2" />
              <line x1="95" y1="40" x2="160" y2="90" stroke="#DFBA6C" strokeOpacity="0.2" />
              <line x1="160" y1="90" x2="120" y2="170" stroke="#DFBA6C" strokeOpacity="0.2" />
              <line x1="160" y1="90" x2="175" y2="30" stroke="#DFBA6C" strokeOpacity="0.2" />
            </svg>
          </div>
        </div>
      </section>

      {/* Institute strip */}
      <section className="py-12 sm:py-14 border-b border-[color:var(--border)]">
        <p className="eyebrow mb-6">Five institutes, one vision</p>
        <InstituteConstellation />
      </section>

      {/* How it works — a real sequence, so numbering earns its keep here */}
      <section className="py-12 sm:py-16 border-b border-[color:var(--border)]">
        <p className="eyebrow mb-3">How it works</p>
        <h2 className="font-display text-2xl sm:text-3xl mb-10 max-w-lg">
          From first draft to a permanent, citable record.
        </h2>
        <div className="grid sm:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="relative pl-0">
              <span className="font-display text-3xl text-gold-500/70">{s.n}</span>
              <h3 className="font-medium text-sm mt-2 mb-1.5">{s.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature / module cards */}
      <section className="py-12 sm:py-16 border-b border-[color:var(--border)]">
        <p className="eyebrow mb-3">What the Hub does</p>
        <h2 className="font-display text-2xl sm:text-3xl mb-10 max-w-lg">
          Everything a scholarly ecosystem needs, in one place.
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="card p-6 flex flex-col hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <span className="font-mono text-[11px] uppercase tracking-wide text-secondary-600 mb-4">
                {f.label}
              </span>
              <h3 className="font-display text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed flex-1">{f.body}</p>
              <span className="text-sm font-medium text-primary-600 mt-5 inline-flex items-center gap-1">
                {f.cta} <span aria-hidden>&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quote — illustrative voice of a scholar using the platform */}
      <section className="py-12 sm:py-16 border-b border-[color:var(--border)]">
        <div className="max-w-2xl">
          <p className="font-display italic text-2xl sm:text-3xl leading-snug text-ink-primary mb-5">
            &ldquo;My thesis, my reviewers, and my published article all live
            in one place now — and it&rsquo;s searchable by anyone on the
            continent, not just my own campus.&rdquo;
          </p>
          <p className="font-mono text-xs text-ink-muted uppercase tracking-wide">
            Illustrative voice · A PAU doctoral researcher
          </p>
        </div>
      </section>

      {/* SDG chips — real framework, grounds "research areas" in something concrete */}
      <section className="py-12 sm:py-16 border-b border-[color:var(--border)]">
        <p className="eyebrow mb-3">Research, grounded in outcomes</p>
        <h2 className="font-display text-2xl sm:text-3xl mb-8 max-w-lg">
          Every submission is mapped to the Sustainable Development Goals it addresses.
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {SAMPLE_SDGS.map((s) => (
            <span key={s} className="font-mono text-xs px-3 py-1.5 rounded-full border border-[color:var(--border-strong)] text-ink-secondary">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* AU Agenda 2063 chips â€” same pattern as the SDG chips above */}
      <section className="py-12 sm:py-16 border-b border-[color:var(--border)]">
        <p className="eyebrow mb-3">Aligned with the continent&rsquo;s vision</p>
        <h2 className="font-display text-2xl sm:text-3xl mb-8 max-w-lg">
          Every submission is also mapped to the AU Agenda 2063 aspirations it advances.
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {SAMPLE_AU_AGENDA.map((a) => (
            <span key={a} className="font-mono text-xs px-3 py-1.5 rounded-full border border-[color:var(--border-strong)] text-ink-secondary">
              {a}
            </span>
          ))}
        </div>
      </section>

      {/* Closing CTA band — same full-bleed fix as the hero above */}
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-masthead-gradient text-white text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <p className="eyebrow text-gold-400 mb-4 justify-center flex">Join the network</p>
          <h2 className="font-display text-3xl sm:text-4xl max-w-lg mx-auto mb-8 leading-snug">
            Your research belongs to the whole continent. Give it a home.
          </h2>
          <Link
            href={!loading && user ? "/submit" : "/signup"}
            className="btn-primary bg-secondary-500 hover:bg-secondary-600 px-7 py-3 inline-flex"
          >
            {!loading && user ? "Submit your research" : "Create your free account"}
          </Link>
        </div>
      </section>
    </div>
  );
}