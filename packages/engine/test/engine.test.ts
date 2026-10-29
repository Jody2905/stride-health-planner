import { describe, expect, it } from "vitest";
import { bmr, buildPlan, calculate, DEFAULT_PROFILE, ProfileSchema, splitMacros, type Profile } from "../src";

const p = (over: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, ...over });

describe("calculations", () => {
  it("matches the published Mifflin-St Jeor equation", () => {
    // 10*72 + 6.25*165 - 5*28 - 161 = 1450.25
    expect(bmr(p())).toBeCloseTo(1450.25, 2);
    expect(bmr(p({ sex: "male" }))).toBeCloseTo(1616.25, 2);
  });

  it("never sets weight-loss calories below the floor", () => {
    const n = calculate(p({ weightKg: 48, heightCm: 150, goalKg: 45, age: 60, activity: "sedentary" }));
    expect(n.targetKcal).toBeGreaterThanOrEqual(1200);
  });

  it("caps the deficit at 20% of maintenance", () => {
    const n = calculate(p());
    expect(n.tdee - n.targetKcal!).toBeLessThanOrEqual(n.tdee * 0.2 + 10);
  });

  it("refuses to plan weight loss when already underweight", () => {
    const n = calculate(p({ weightKg: 48, goalKg: 44 })); // BMI 17.6
    expect(n.weightChangeBlocked).toBe(true);
    expect(n.goal).toBe("maintain");
    expect(n.flags.some((f) => f.level === "stop")).toBe(true);
  });

  it("raises a goal that is below the healthy BMI range", () => {
    const n = calculate(p({ goalKg: 45 })); // BMI 16.5 at 165 cm
    expect(n.effectiveGoalKg).toBeCloseTo(50.4, 1);
    expect(n.flags[0].level).toBe("warn");
  });

  it("hides calorie numbers for under-18s and during pregnancy", () => {
    expect(calculate(p({ age: 16 })).targetKcal).toBeNull();
    expect(calculate(p({ pregnant: true })).targetKcal).toBeNull();
    // pregnancy flag is ignored for male profiles
    expect(calculate(p({ sex: "male", pregnant: true })).targetKcal).not.toBeNull();
  });
});

describe("nutrition", () => {
  it("macro calories add up to the daily target", () => {
    for (const kcal of [1200, 1800, 2600, 3400]) {
      const m = splitMacros(kcal, 150);
      const total = m.protein.grams * 4 + m.carbs.grams * 4 + m.fats.grams * 9;
      expect(Math.abs(total - kcal)).toBeLessThan(15);
      expect(m.fats.percent).toBeGreaterThanOrEqual(19);
      expect(m.carbs.grams).toBeGreaterThanOrEqual(95);
    }
  });

  it("splits calories across the chosen number of meals", () => {
    for (const mealsPerDay of [3, 4, 5]) {
      const plan = buildPlan(p({ mealsPerDay }));
      expect(plan.nutrition.meals).toHaveLength(mealsPerDay);
      const sum = plan.nutrition.meals.reduce((a, m) => a + (m.kcal ?? 0), 0);
      expect(Math.abs(sum - plan.nutrition.kcal!)).toBeLessThanOrEqual(30);
    }
  });

  it("never suggests animal foods to vegans", () => {
    const plan = buildPlan(p({ diet: "vegan", cuisine: "caribbean" }));
    const text = [...plan.nutrition.meals.map((m) => m.idea), ...plan.nutrition.foods.protein].join(" ").toLowerCase();
    for (const word of ["chicken", "fish", "egg", "yogurt", "beef", "salmon", "tuna", "saltfish"]) expect(text).not.toContain(word);
  });

  it("respects dairy-free and gluten-free filters", () => {
    for (let v = 0; v < 6; v++) {
      const plan = buildPlan(p({ dairyFree: true, glutenFree: true }), { mealVariant: v });
      const text = plan.nutrition.meals.map((m) => m.idea).join(" ").toLowerCase();
      expect(text).not.toMatch(/yogurt|feta|toast|wrap|cottage/);
    }
  });

  it("shows Caribbean foods first only when that cuisine is chosen", () => {
    expect(buildPlan(p({ cuisine: "caribbean" })).nutrition.foods.carbs[0]).toMatch(/Breadfruit/);
    expect(buildPlan(p()).nutrition.foods.carbs.join()).not.toMatch(/Breadfruit/);
  });

  it("rotates meal ideas with the variant", () => {
    const a = buildPlan(p(), { mealVariant: 0 }).nutrition.meals[0].idea;
    const b = buildPlan(p(), { mealVariant: 1 }).nutrition.meals[0].idea;
    expect(a).not.toBe(b);
  });
});

describe("workouts and supplements", () => {
  it("schedules the requested number of training days", () => {
    for (const d of [2, 3, 4, 5, 6]) {
      const days = buildPlan(p({ daysPerWeek: d })).workouts.days.filter((x) => x.type !== "rest");
      expect(days).toHaveLength(d);
    }
  });

  it("uses bodyweight exercises when there is no equipment", () => {
    const names = buildPlan(p({ equipment: "none" })).workouts.days.flatMap((d) => d.exercises.map((e) => e.name));
    expect(names.join()).not.toMatch(/Dumbbell|Barbell|Cable|Bench press/);
  });

  it("adds balance work for 65+", () => {
    const ex = buildPlan(p({ age: 70, goalKg: 72 })).workouts.days.find((d) => d.type === "strength")!.exercises;
    expect(ex.at(-1)!.name).toBe("Single-leg balance");
  });

  it("flags B12 as relevant for vegans and gives no supplement list in pregnancy", () => {
    expect(buildPlan(p({ diet: "vegan" })).supplements.find((s) => s.name === "Vitamin B12")!.relevant).toBe(true);
    expect(buildPlan(p({ pregnant: true })).supplements).toHaveLength(0);
  });
});

describe("schema", () => {
  it("rejects out-of-range values", () => {
    expect(ProfileSchema.safeParse(p({ age: 9 })).success).toBe(false);
    expect(ProfileSchema.safeParse(p({ daysPerWeek: 7 })).success).toBe(false);
    expect(ProfileSchema.safeParse(p()).success).toBe(true);
  });
});
