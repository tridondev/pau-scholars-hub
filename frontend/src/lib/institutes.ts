// The five PAU thematic institutes. Real, fixed data — one per African
// region — used as the platform's signature "network" motif (constellation
// dots in the hero/footer, the institute strip, the repository filter).
export interface PauInstitute {
  acronym: string;
  name: string;
  country: string;
  region: string;
}

// Ordered shortest to longest by `name`, not alphabetically or by acronym —
// this is what lets the institute strip sit in a single clean row instead
// of wrapping unevenly, since the shortest labels come first and the row
// grows in width left to right rather than jumping around.
export const PAU_INSTITUTES: PauInstitute[] = [
  { acronym: "PAUSS", name: "Space Sciences", country: "South Africa", region: "Southern Africa" },
  { acronym: "PAULESI", name: "Life & Earth Sciences", country: "Nigeria", region: "Western Africa" },
  { acronym: "PAUWES", name: "Water & Energy Sciences", country: "Algeria", region: "Northern Africa" },
  { acronym: "PAUSTI", name: "Basic Sciences, Technology & Innovation", country: "Kenya", region: "Eastern Africa" },
  { acronym: "PAUGHSS", name: "Governance, Humanities & Social Sciences", country: "Cameroon", region: "Central Africa" },
];
