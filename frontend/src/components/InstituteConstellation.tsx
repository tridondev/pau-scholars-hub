import { PAU_INSTITUTES } from "@/lib/institutes";

/**
 * The platform's signature motif: five dots, one per PAU thematic
 * institute, each labelled with its real acronym and region. Not
 * decoration — this is the actual shape of the network the platform
 * connects, reused wherever the page wants to say "the whole continent"
 * rather than one campus.
 */
export default function InstituteConstellation({ dark = false }: { dark?: boolean }) {
  // Always a single row, on phone as much as desktop. Institutes are
  // pre-sorted shortest-to-longest name (see lib/institutes.ts) so the
  // row grows left to right instead of five uneven blocks fighting for
  // space — that's what keeps five items readable in one line even on
  // a narrow screen, rather than needing to fall back to a 2-column grid.
  return (
    <ul className="grid grid-cols-5 gap-x-2 sm:gap-x-4 gap-y-5">
      {PAU_INSTITUTES.map((inst, i) => (
        <li key={inst.acronym} className="flex flex-col gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: dark ? "#DFBA6C" : "#B08D4F",
              opacity: 0.55 + i * 0.11,
            }}
          />
          <span className={`font-mono text-[10px] sm:text-xs tracking-wide ${dark ? "text-gold-300" : "text-gold-700"}`}>
            {inst.acronym}
          </span>
          <span className={`text-[11px] sm:text-xs leading-snug ${dark ? "text-white/60" : "text-ink-secondary"}`}>
            {inst.name}
          </span>
          <span className={`hidden sm:block text-[11px] ${dark ? "text-white/35" : "text-ink-muted"}`}>
            {inst.country} · {inst.region}
          </span>
        </li>
      ))}
    </ul>
  );
}
