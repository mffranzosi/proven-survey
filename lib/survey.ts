export const SURVEY_VERSION = "2026-09-v1";
export const CONSENT_VERSION = "2026-09-v1";

export type Track = "b2b" | "b2c";
export type CardKey =
  | "mishire"
  | "trust"
  | "noise"
  | "rejected"
  | "interviews"
  | "cvdead"
  | "notproof";

export interface Role {
  id: string;
  label: string;
  track: Track;
}

export const ROLES: Role[] = [
  { id: "recruiter", label: "Recruiter (agency, freelance)", track: "b2b" },
  { id: "talent_acquisition", label: "Talent acquisition at a company", track: "b2b" },
  { id: "hiring_manager", label: "Hiring manager", track: "b2b" },
  { id: "candidate", label: "Candidate", track: "b2c" },
  { id: "career_advisor", label: "Career advisor", track: "b2c" },
  { id: "other", label: "Other", track: "b2b" },
];

export interface Question {
  title: string;
  options: string[];
}

export const QUESTIONS: Record<Track, Question[]> = {
  b2b: [
    {
      title:
        "AI now shapes many applications.\nDid it change your confidence in judging real skills?",
      options: ["More confident now", "No change", "A bit less confident", "Much less confident"],
    },
    {
      title:
        "The volume of applications has generally increased.\nHas the quality of your shortlists changed?",
      options: ["Better", "Same", "Worse", "Much worse"],
    },
    {
      title:
        "Think back to your last 10 hires or placements.\nHow many turned out weaker than their application suggested?",
      options: ["0", "1–2", "3–4", "5 or more"],
    },
    {
      title: "When hiring goes wrong or gets harder, what hurts the most?",
      options: [
        "Refund or replacement cost",
        "Time lost re-running the search",
        "Client trust, repeat work",
        "Sifting through too many similar applications",
      ],
    },
  ],
  b2c: [
    {
      title:
        "How has the use of AI in recruitment and hiring processes affected your experience?",
      options: [
        "Positively: it's helped me stand out",
        "No real change",
        "Negatively: harder to show my real skills",
        "Very negatively: I feel invisible in the process",
      ],
    },
    {
      title: "In your applications, do you feel evaluated by a person or by an algorithm?",
      options: [
        "Mostly by people who take the time",
        "A mix of both",
        "Mostly automated screening, little human review",
        "I have no idea what's evaluating me",
      ],
    },
    {
      title:
        "Think back to your last 10 applications.\nHow many times did you feel your real skills were not fairly assessed?",
      options: ["0", "1–2", "3–4", "5 or more"],
    },
    {
      title: "When a job search doesn't go your way, what hurts the most?",
      options: [
        "Rejected despite being clearly qualified",
        "Losing out to someone who “interviews well” but isn't better at the job",
        "Feeling my CV doesn't show who I really am",
        "No way to prove my real experience beyond claims and keywords",
      ],
    },
  ],
};

export const COACH_HINT = "Answer for yourself, or for the people you coach.";

export const CARDS: Record<CardKey, { headline: string; line: string }> = {
  mishire: {
    headline: "One bad hire can cost up to one year's salary.",
    line: "Interview only PROVEN talent.",
  },
  trust: {
    headline: "Every application looks polished.",
    line: "Add a trust layer to your screening.",
  },
  noise: {
    headline: "A new opening, 250 applicants.",
    line: "Screen smarter.\nScreen with PROVEN.",
  },
  rejected: {
    headline: "Do you feel invisible on the job market?",
    line: "It's normal.\nPROVEN will show who you are.",
  },
  interviews: {
    headline: "Your network knows your worth.",
    line: "Let them speak about you.",
  },
  cvdead: {
    headline: "The CV is dead.",
    line: "Get your PROVEN Profile here.",
  },
  notproof: {
    headline: "A polished LinkedIn profile is not proof.",
    line: "PROVEN is.",
  },
};

const B2B_THEMES = ["mishire", "trust", "noise"] as const;
type B2BTheme = (typeof B2B_THEMES)[number];

// Q1 -> trust, Q2 -> noise, Q3 -> mishire. Answer index equals score (0 = best, 3 = worst).
const Q4_THEME: B2BTheme[] = ["mishire", "noise", "trust", "noise"];

const B2C_CARD_BY_Q4: CardKey[] = ["rejected", "interviews", "cvdead", "notproof"];

export function messageFor(track: Track, answers: number[]): CardKey {
  if (track === "b2c") return B2C_CARD_BY_Q4[answers[3]];

  const scores: Record<B2BTheme, number> = {
    trust: answers[0],
    noise: answers[1],
    mishire: answers[2],
  };
  const max = Math.max(scores.trust, scores.noise, scores.mishire);
  if (max === 0) return "trust";

  const tied = B2B_THEMES.filter((t) => scores[t] === max);
  if (tied.length === 1) return tied[0];

  const fromQ4 = Q4_THEME[answers[3]];
  if (tied.includes(fromQ4)) return fromQ4;
  return tied[0];
}

const B2C_CLOSER = "Because you won't be their next bad hire.\nProve it.";
const B2B_CLOSERS: Record<string, string> = {
  recruiter: "Because your shortlist is only as good as the signal behind it.\nSharpen it.",
  hiring_manager: "Because you're the one who lives with the hire.\nMake it a good one.",
  talent_acquisition:
    "Because the next great hire shouldn't look like the last bad one.\nFind them.",
  other: "Because the next great hire shouldn't look like the last bad one.\nFind them.",
};

export function closerFor(track: Track, roleId: string): string {
  return track === "b2c" ? B2C_CLOSER : (B2B_CLOSERS[roleId] ?? B2B_CLOSERS.other);
}

export const LINKS = {
  learnMore: "https://provenvalidation.com/refer/mf",
  bookCall: "https://calendar.app.google/yvLhzAsk7gezVVCa7",
  privacy: "https://provenvalidation.com/privacy",
};
