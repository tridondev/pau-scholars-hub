import { PAU_INSTITUTES } from "@/lib/institutes";

/**
 * The platform's signature motif: five dots, one per PAU thematic
 * institute, each labelled with its real acronym and region. Not
 * decoration — this is the actual shape of the network the platform
 * connects, reused wherever the page wants to say "the whole continent"
 * rather than one campus.
 */
export default function InstituteConstellation({ dark = false }: { dark?: boolean }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-5">
      {PAU_INSTITUTES.map((inst, i) => (
        <li key={inst.acronym} className="flex flex-col gap-1.5">
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
