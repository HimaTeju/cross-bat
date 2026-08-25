export const NATION_STYLE = {
  India: { flag: "🇮🇳", bg: "#FF9933", fg: "#0b2818" },
  Australia: { flag: "🇦🇺", bg: "#00843D", fg: "#f3ecd8" },
  England: { flag: "🏴", bg: "#1B3A6B", fg: "#f3ecd8" },
  "South Africa": { flag: "🇿🇦", bg: "#007A4D", fg: "#f3ecd8" },
  "West Indies": { flag: "🏏", bg: "#7B0000", fg: "#f3ecd8" },
  "New Zealand": { flag: "🇳🇿", bg: "#000000", fg: "#f3ecd8" },
  "Sri Lanka": { flag: "🇱🇰", bg: "#0B4EA2", fg: "#f3ecd8" },
  Afghanistan: { flag: "🇦🇫", bg: "#0D6A3B", fg: "#f3ecd8" },
  Bangladesh: { flag: "🇧🇩", bg: "#006A4E", fg: "#f3ecd8" },
  Zimbabwe: { flag: "🇿🇼", bg: "#5B7F33", fg: "#f3ecd8" },
};

export const FRANCHISE_STYLE = {
  "Mumbai Indians": { bg: "#045093", fg: "#f3ecd8" },
  "Chennai Super Kings": { bg: "#F9CD05", fg: "#0b2818" },
  "Royal Challengers Bengaluru": { bg: "#EC1C24", fg: "#f3ecd8" },
  "Kolkata Knight Riders": { bg: "#3A225D", fg: "#D4AF37" },
  "Delhi Capitals": { bg: "#17479E", fg: "#f3ecd8" },
  "Punjab Kings": { bg: "#ED1B24", fg: "#f3ecd8" },
  "Rajasthan Royals": { bg: "#EA1A85", fg: "#f3ecd8" },
  "Sunrisers Hyderabad": { bg: "#FF822A", fg: "#0b2818" },
  "Gujarat Titans": { bg: "#1B2133", fg: "#D4AF37" },
  "Lucknow Super Giants": { bg: "#12A9BF", fg: "#f3ecd8" },
  "Deccan Chargers": { bg: "#4B2E83", fg: "#f3ecd8" },
  "Pune Warriors": { bg: "#4A5A6B", fg: "#f3ecd8" },
  "Gujarat Lions": { bg: "#E2662A", fg: "#f3ecd8" },
  "Rising Pune Supergiant": { bg: "#8B1E3F", fg: "#f3ecd8" },
  "Kochi Tuskers Kerala": { bg: "#F76A1C", fg: "#0b2818" },
};

export function styleFor(cat) {
  return (cat.type === 1 ? NATION_STYLE[cat.name] : FRANCHISE_STYLE[cat.name]) || { bg: "#333", fg: "#fff" };
}
