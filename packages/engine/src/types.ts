import { z } from "zod";

export const INJURY_AREAS = ["knee", "back", "shoulder", "wrist", "hip", "ankle"] as const;
export type InjuryArea = (typeof INJURY_AREAS)[number];
export const INJURY_LABEL: Record<InjuryArea, string> = {
  knee: "Knees",
  back: "Lower back",
  shoulder: "Shoulders",
  wrist: "Wrists / elbows",
  hip: "Hips",
  ankle: "Ankles / feet",
};

/** What the user wants their training to do. "general" is the original health-and-fitness plan. */
export const FOCUSES = ["general", "recomp", "muscle"] as const;
export type Focus = (typeof FOCUSES)[number];
export const FOCUS_LABEL: Record<Focus, string> = {
  general: "General health & fitness",
  recomp: "Body recomposition (lose fat, build muscle)",
  muscle: "Build muscle",
};

/** Muscle groups a user can prioritise. */
export const MUSCLES = ["chest", "back", "shoulders", "arms", "glutes", "quads", "hamstrings", "calves", "core"] as const;
export type Muscle = (typeof MUSCLES)[number];
export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  core: "Core",
};
export const MAX_PRIORITY_MUSCLES = 3;

/** How training days are split up. "auto" picks from days per week and experience. */
export const SPLITS = ["auto", "full", "upperLower", "ppl"] as const;
export type Split = (typeof SPLITS)[number];
export const SPLIT_LABEL: Record<Split, string> = {
  auto: "Pick for me",
  full: "Full body every session",
  upperLower: "Upper / lower",
  ppl: "Push / pull / legs",
};

/** Validation schema for a user's profile. Shared by the API (request validation) and the client (form). */
export const ProfileSchema = z.object({
  sex: z.enum(["female", "male", "other"]),
  age: z.number().int().min(13).max(100),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(30).max(300),
  goalKg: z.number().min(30).max(300),
  activity: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(2).max(6),
  equipment: z.enum(["none", "home", "gym"]),
  diet: z.enum(["omni", "veg", "vegan"]),
  fish: z.enum(["rare", "some", "often"]),
  sun: z.enum(["low", "some", "high"]),
  cuisine: z.enum(["general", "caribbean"]),
  mealsPerDay: z.number().int().min(3).max(5),
  dairyFree: z.boolean(),
  glutenFree: z.boolean(),
  pregnant: z.boolean(),
  condition: z.boolean(),
  /** Body areas with a current injury or long-term limitation. Exercises that load them are swapped out. */
  injuries: z.array(z.enum(INJURY_AREAS)).max(INJURY_AREAS.length).default([]),
  /** Prefer low-impact cardio (no running or jumping). */
  lowImpact: z.boolean().default(false),
  /** Exercises the user chose to swap out. */
  avoidExercises: z.array(z.string().max(60)).max(60).default([]),
  /** Daily step goal for the walking tracker. */
  stepGoal: z.number().int().min(1000).max(30000).default(8000),
  /** Training focus. Older saved profiles default to "general". */
  focus: z.enum(FOCUSES).default("general"),
  /** Up to three muscle groups to train first and give extra sets. */
  priorityMuscles: z.array(z.enum(MUSCLES)).max(MAX_PRIORITY_MUSCLES).default([]),
  /** Preferred split for muscle-focused plans. */
  split: z.enum(SPLITS).default("auto"),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Units = "metric" | "imperial";
export type Goal = "lose" | "gain" | "maintain";
export type Diet = Profile["diet"];

export interface Flag {
  level: "stop" | "warn" | "info";
  title: string;
  message: string;
}

export const DEFAULT_PROFILE: Profile = {
  sex: "female",
  age: 28,
  heightCm: 165,
  weightKg: 72,
  goalKg: 65,
  activity: "light",
  experience: "beginner",
  daysPerWeek: 3,
  equipment: "home",
  diet: "omni",
  fish: "some",
  sun: "some",
  cuisine: "general",
  mealsPerDay: 4,
  dairyFree: false,
  glutenFree: false,
  pregnant: false,
  condition: false,
  injuries: [],
  lowImpact: false,
  avoidExercises: [],
  stepGoal: 8000,
  focus: "general",
  priorityMuscles: [],
  split: "auto",
};

export const LB_PER_KG = 2.20462;

export function formatWeight(kg: number, units: Units): string {
  return units === "metric" ? `${kg.toFixed(1)} kg` : `${Math.round(kg * LB_PER_KG)} lb`;
}
