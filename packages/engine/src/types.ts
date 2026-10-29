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
};

export const LB_PER_KG = 2.20462;

export function formatWeight(kg: number, units: Units): string {
  return units === "metric" ? `${kg.toFixed(1)} kg` : `${Math.round(kg * LB_PER_KG)} lb`;
}
