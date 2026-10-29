import { calculate, type Numbers } from "./calc";
import { buildGroceryList, type GroceryGroup } from "./groceries";
import { buildHabits, SOURCES } from "./habits";
import { buildNutrition, type NutritionPlan } from "./nutrition";
import { buildSupplements, type Supplement } from "./supplements";
import type { Profile, Units } from "./types";
import { buildWorkouts, type WorkoutPlan } from "./workouts";

export * from "./types";
export * from "./calc";
export * from "./workouts";
export * from "./nutrition";
export * from "./supplements";
export * from "./habits";
export * from "./groceries";

export interface Plan {
  numbers: Numbers;
  workouts: WorkoutPlan;
  nutrition: NutritionPlan;
  /** Shopping list for the 7-day meal plan. */
  groceries: GroceryGroup[];
  supplements: Supplement[];
  habits: ReturnType<typeof buildHabits>;
  sources: typeof SOURCES;
}

/** Builds the whole personalised plan from a validated profile. Pure function: same input, same output. */
export function buildPlan(profile: Profile, opts: { units?: Units; mealVariant?: number } = {}): Plan {
  const numbers = calculate(profile, opts.units ?? "metric");
  const nutrition = buildNutrition(profile, numbers, opts.mealVariant ?? 0);
  return {
    numbers,
    workouts: buildWorkouts(profile, numbers),
    nutrition,
    groceries: buildGroceryList(nutrition.week),
    supplements: buildSupplements(profile, numbers),
    habits: buildHabits(numbers),
    sources: SOURCES,
  };
}
