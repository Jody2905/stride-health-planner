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

describe("injuries and exercise swaps", () => {
  const names = (pl: ReturnType<typeof buildPlan>) => pl.workouts.days.flatMap((d) => d.exercises.map((e) => e.name));

  it("never picks an exercise that loads an injured area", () => {
    for (const equipment of ["none", "home", "gym"] as const) {
      const list = names(buildPlan(p({ equipment, daysPerWeek: 4, injuries: ["knee", "back", "shoulder"] }))).join();
      expect(list).not.toMatch(/Barbell back squat|Goblet squat|Walking lunge|Split squat|Reverse lunge|Romanian deadlift|Overhead press|Bench press|Push-up|Hanging/);
    }
  });

  it("swaps out an exercise the user chose to avoid", () => {
    const before = names(buildPlan(p({ equipment: "gym", daysPerWeek: 4 })));
    expect(before).toContain("Bench press");
    const after = names(buildPlan(p({ equipment: "gym", daysPerWeek: 4, avoidExercises: ["Bench press"] })));
    expect(after).not.toContain("Bench press");
    expect(after.length).toBe(before.length);
  });

  it("keeps cardio low impact for knee injuries and explains the changes", () => {
    const w = buildPlan(p({ injuries: ["knee"] })).workouts;
    expect(w.days.find((d) => d.type === "rest" && d.day !== "Sun")!.note).toMatch(/cycle, swim/);
    expect(w.injuryNotes.join()).toMatch(/Knees/);
  });

  it("accepts older saved profiles without the new fields", () => {
    const { injuries, lowImpact, avoidExercises, stepGoal, ...old } = DEFAULT_PROFILE;
    const r = ProfileSchema.safeParse(old);
    expect(r.success && r.data.injuries).toEqual([]);
  });
});

describe("weekly meal plan and grocery list", () => {
  it("plans seven days and totals the ingredients", () => {
    const plan = buildPlan(p());
    expect(plan.nutrition.week).toHaveLength(7);
    const items = plan.groceries.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(10);
    expect(items.every((i) => i.qty > 0)).toBe(true);
  });

  it("only lists groceries that fit the diet", () => {
    const text = buildPlan(p({ diet: "vegan", cuisine: "caribbean" })).groceries.flatMap((g) => g.items.map((i) => i.name)).join().toLowerCase();
    for (const w of ["chicken", "fish", "egg", "yogurt", "feta", "salmon", "tuna", "beef"]) expect(text).not.toContain(w);
  });

  it("buys more food for a bigger calorie target", () => {
    const total = (pl: ReturnType<typeof buildPlan>) =>
      pl.groceries.flatMap((g) => g.items).filter((i) => i.unit === "g").reduce((a, i) => a + i.qty, 0);
    expect(total(buildPlan(p({ sex: "male", weightKg: 90, goalKg: 95, heightCm: 185, activity: "active" })))).toBeGreaterThan(total(buildPlan(p())));
  });
});

describe("body recomposition and muscle building", () => {
  const gym = { equipment: "gym" as const, experience: "intermediate" as const };

  it("old saved profiles still parse and get the general plan", () => {
    const { focus, priorityMuscles, split, ...old } = DEFAULT_PROFILE;
    const parsed = ProfileSchema.parse(old);
    expect(parsed.focus).toBe("general");
    expect(buildPlan(parsed).workouts.focus).toBe("general");
  });

  it("recomp uses a small deficit and high protein", () => {
    const n = calculate(p({ focus: "recomp", weightKg: 80, goalKg: 80, heightCm: 170 })); // BMI 27.7
    expect(n.focus).toBe("recomp");
    expect(n.targetKcal!).toBeLessThan(n.tdee);
    expect(n.tdee - n.targetKcal!).toBeLessThanOrEqual(500);
    expect(n.proteinPerKg).toEqual([2.0, 2.4]);
  });

  it("recomp stays at maintenance for lean people", () => {
    const n = calculate(p({ focus: "recomp", weightKg: 58, goalKg: 58, heightCm: 170 })); // BMI 20.1
    expect(Math.abs(n.targetKcal! - n.tdee)).toBeLessThan(10);
  });

  it("muscle building uses a modest surplus, smaller for advanced lifters", () => {
    const base = { focus: "muscle" as const, weightKg: 65, goalKg: 70, heightCm: 175 };
    const beg = calculate(p({ ...base, experience: "beginner" }));
    const adv = calculate(p({ ...base, experience: "advanced" }));
    expect(beg.targetKcal! - beg.tdee).toBeGreaterThan(150);
    expect(beg.targetKcal! - beg.tdee).toBeLessThanOrEqual(360);
    expect(adv.targetKcal! - adv.tdee).toBeLessThan(beg.targetKcal! - beg.tdee);
    expect(beg.goal).toBe("gain");
  });

  it("switches muscle building to recomp when the goal is weight loss", () => {
    const n = calculate(p({ focus: "muscle" })); // 72 → 65 kg
    expect(n.focus).toBe("recomp");
    expect(n.flags.some((f) => f.title === "Planned as body recomposition")).toBe(true);
  });

  it("keeps the general plan during pregnancy", () => {
    expect(calculate(p({ focus: "muscle", pregnant: true })).focus).toBe("general");
  });

  it("picks the split from days per week", () => {
    const split = (d: number) => buildPlan(p({ ...gym, focus: "muscle", goalKg: 75, daysPerWeek: d })).workouts.splitName;
    expect(split(3)).toBe("Full body");
    expect(split(4)).toBe("Upper / lower");
    expect(split(6)).toBe("Push / pull / legs");
    // PPL needs 3+ days
    expect(buildPlan(p({ ...gym, focus: "muscle", goalKg: 75, daysPerWeek: 2, split: "ppl" })).workouts.splitName).toBe("Full body");
  });

  it("trains every major muscle about twice a week with a reasonable volume", () => {
    const w = buildPlan(p({ ...gym, focus: "muscle", goalKg: 75, daysPerWeek: 4 })).workouts;
    expect(w.days.filter((d) => d.type === "strength")).toHaveLength(4);
    for (const m of ["chest", "back", "quads", "hamstrings", "glutes"]) {
      const v = w.volume.find((x) => x.muscle === m)!;
      expect(v.frequency).toBeGreaterThanOrEqual(2);
      expect(v.sets).toBeGreaterThanOrEqual(8);
      expect(v.sets).toBeLessThanOrEqual(26);
    }
  });

  it("gives priority muscles more sets and puts them first", () => {
    const base = { ...gym, focus: "muscle" as const, goalKg: 75, daysPerWeek: 4 };
    const plain = buildPlan(p(base)).workouts.volume;
    const prio = buildPlan(p({ ...base, priorityMuscles: ["glutes", "shoulders"] })).workouts;
    const sets = (vol: typeof plain, m: string) => vol.find((v) => v.muscle === m)!.sets;
    expect(sets(prio.volume, "glutes")).toBeGreaterThan(sets(plain, "glutes"));
    expect(sets(prio.volume, "shoulders")).toBeGreaterThan(sets(plain, "shoulders"));
    expect(prio.volume.find((v) => v.muscle === "glutes")!.priority).toBe(true);
    const lower = prio.days.find((d) => d.title.startsWith("Lower"))!;
    expect(["Hip thrust", "Romanian deadlift", "Walking lunge", "Barbell back squat"]).toContain(lower.exercises[0].name);
    for (const d of prio.days) expect(d.exercises.length).toBeLessThanOrEqual(9);
  });

  it("still respects injuries and equipment in muscle plans", () => {
    const w = buildPlan(p({ focus: "muscle", goalKg: 75, equipment: "none", injuries: ["knee"], daysPerWeek: 3 })).workouts;
    const names = w.days.flatMap((d) => d.exercises.map((e) => e.name));
    expect(names).not.toContain("Wall sit");
    expect(names).not.toContain("Bodyweight squat");
    expect(names).not.toContain("Leg extension");
    expect(names.length).toBeGreaterThan(10);
  });
});
