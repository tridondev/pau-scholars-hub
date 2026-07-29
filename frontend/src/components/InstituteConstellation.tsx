import { PAU_INSTITUTES } from "@/lib/institutes";

/**
 * The platform's signature motif: five dots, one per PAU thematic
 * institute, each labelled with its real acronym and region. Not
 * decoration — this is the actual shape of the network the platform
 * connects, reused wherever the page wants to say "the whole continent"
 * rather than one campus.
 */
export default function InstituteConstellation({ dark = false }: { dark?: boolean }) {
  // Shortest name first (Space Sciences -> ... -> the two longest),
  // per feedback that it reads cleaner scanning left to right. Sorted
  // here rather than in lib/institutes so the source ordering (whatever
  // it's used for elsewhere) is untouched.
  const sorted = [...PAU_INSTITUTES].sort((a, b) => a.name.length - b.name.length);

  return (
    <ul
      className="
        flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2
        sm:grid sm:grid-cols-5 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0
        gap-x-6 sm:gap-x-4 gap-y-5
      "
    >
      {sorted.map((inst, i) => (
        <li
          key={inst.acronym}
          className="flex flex-col gap-1.5 shrink-0 w-36 sm:w-auto snap-start"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: dark ? "#DFBA6C" : "#B08D4F",
              opacity: 0.55 + i * 0.11,
            }}
          />
          <span className={`font-mono text-xs tracking-wide ${dark ? "text-gold-300" : "text-gold-700"}`}>
            {inst.acronym}
          </span>
          <span className={`text-xs leading-snug ${dark ? "text-white/60" : "text-ink-secondary"}`}>
            {inst.name}
          </span>
          <span className={`text-[11px] ${dark ? "text-white/35" : "text-ink-muted"}`}>
            {inst.country} · {inst.region}
          </span>
        </li>
      ))}
    </ul>
  );
}