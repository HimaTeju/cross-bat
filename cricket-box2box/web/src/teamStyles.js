const FLAGS_BASE = `${import.meta.env.BASE_URL}flags`;
const LOGOS_BASE = `${import.meta.env.BASE_URL}logos`;

export const NATION_STYLE = {
  India: { flag: `${FLAGS_BASE}/india.svg`, bg: "#FF9933", fg: "#0b2818" },
  Australia: { flag: `${FLAGS_BASE}/australia.svg`, bg: "#00843D", fg: "#f3ecd8" },
  England: { flag: `${FLAGS_BASE}/england.svg`, bg: "#1B3A6B", fg: "#f3ecd8" },
  "South Africa": { flag: `${FLAGS_BASE}/south-africa.svg`, bg: "#007A4D", fg: "#f3ecd8" },
  "West Indies": { flag: `${FLAGS_BASE}/west-indies.svg`, bg: "#7B0000", fg: "#f3ecd8" },
  "New Zealand": { flag: `${FLAGS_BASE}/new-zealand.svg`, bg: "#000000", fg: "#f3ecd8" },
  "Sri Lanka": { flag: `${FLAGS_BASE}/sri-lanka.svg`, bg: "#0B4EA2", fg: "#f3ecd8" },
  Afghanistan: { flag: `${FLAGS_BASE}/afghanistan.svg`, bg: "#0D6A3B", fg: "#f3ecd8" },
  Bangladesh: { flag: `${FLAGS_BASE}/bangladesh.svg`, bg: "#006A4E", fg: "#f3ecd8" },
  Zimbabwe: { flag: `${FLAGS_BASE}/zimbabwe.svg`, bg: "#5B7F33", fg: "#f3ecd8" },
};

export const FRANCHISE_STYLE = {
  "Mumbai Indians": { logo: `${LOGOS_BASE}/mumbai-indians.svg`, bg: "#045093", fg: "#f3ecd8" },
  "Chennai Super Kings": { logo: `${LOGOS_BASE}/chennai-super-kings.svg`, bg: "#F9CD05", fg: "#0b2818" },
  "Royal Challengers Bengaluru": { logo: `${LOGOS_BASE}/royal-challengers-bengaluru.svg`, bg: "#EC1C24", fg: "#f3ecd8" },
  "Kolkata Knight Riders": { logo: `${LOGOS_BASE}/kolkata-knight-riders.svg`, bg: "#3A225D", fg: "#D4AF37" },
  "Delhi Capitals": { logo: `${LOGOS_BASE}/delhi-capitals.svg`, bg: "#17479E", fg: "#f3ecd8" },
  "Punjab Kings": { logo: `${LOGOS_BASE}/punjab-kings.svg`, bg: "#ED1B24", fg: "#f3ecd8" },
  "Rajasthan Royals": { logo: `${LOGOS_BASE}/rajasthan-royals.svg`, bg: "#EA1A85", fg: "#f3ecd8" },
  "Sunrisers Hyderabad": { logo: `${LOGOS_BASE}/sunrisers-hyderabad.svg`, bg: "#FF822A", fg: "#0b2818" },
  "Gujarat Titans": { logo: `${LOGOS_BASE}/gujarat-titans.svg`, bg: "#1B2133", fg: "#D4AF37" },
  "Lucknow Super Giants": { logo: `${LOGOS_BASE}/lucknow-super-giants.svg`, bg: "#12A9BF", fg: "#f3ecd8" },
  "Deccan Chargers": { logo: `${LOGOS_BASE}/deccan-chargers.png`, bg: "#4B2E83", fg: "#f3ecd8" },
  "Pune Warriors": { logo: `${LOGOS_BASE}/pune-warriors.png`, bg: "#4A5A6B", fg: "#f3ecd8" },
  "Gujarat Lions": { logo: `${LOGOS_BASE}/gujarat-lions.png`, bg: "#E2662A", fg: "#f3ecd8" },
  "Rising Pune Supergiant": { logo: `${LOGOS_BASE}/rising-pune-supergiant.png`, bg: "#8B1E3F", fg: "#f3ecd8" },
  "Kochi Tuskers Kerala": { logo: `${LOGOS_BASE}/kochi-tuskers-kerala.svg`, bg: "#F76A1C", fg: "#0b2818" },
};

export function styleFor(cat) {
  return (cat.type === 1 ? NATION_STYLE[cat.name] : FRANCHISE_STYLE[cat.name]) || { bg: "#333", fg: "#fff" };
}
