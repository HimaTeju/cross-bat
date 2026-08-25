export const DIFFICULTIES = [
  {
    key: "fullToss",
    label: "Full Toss",
    tier: "Easy",
    min: 20,
    max: Infinity,
    blurb: "20+ players per cell — an easy ball to put away.",
  },
  {
    key: "goodLength",
    label: "Good Length",
    tier: "Normal",
    min: 7,
    max: 19,
    blurb: "A fair mix of stars and squad players — the standard test.",
  },
  {
    key: "yorker",
    label: "Yorker",
    tier: "Hard",
    min: 0,
    max: 6,
    blurb: "6 or fewer players per cell — dig deep or get bowled.",
  },
];

export const DEFAULT_DIFFICULTY = "goodLength";

export function getDifficulty(key) {
  return DIFFICULTIES.find((d) => d.key === key) || getDifficulty(DEFAULT_DIFFICULTY);
}
