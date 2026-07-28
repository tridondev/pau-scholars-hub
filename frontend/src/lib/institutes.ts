// The five PAU thematic institutes. Real, fixed data — one per African
// region — used as the platform's signature "network" motif (constellation
// dots in the hero/footer, the institute strip, the repository filter).
export interface PauInstitute {
  acronym: string;
  name: string;
  country: string;
  region: string;
}

export const PAU_INSTITUTES: PauInstitute[] = [
  { acronym: "PAUSTI", name: "Basic Sciences, Technology & Innovation", country: "Kenya", region: "Eastern Africa" },
  { acronym: "PAUWES", name: "Water & Energy Sciences", country: "Algeria", region: "Northern Africa" },
  { acronym: "PAULESI", name: "Life & Earth Sciences", country: "Nigeria", region: "Western Africa" },
  { acronym: "PAUGHSS", name: "Governance, Humanities & Social Sciences", country: "Cameroon", region: "Central Africa" },
  { acronym: "PAUSS", name: "Space Sciences", country: "South Africa", region: "Southern Africa" },
];
