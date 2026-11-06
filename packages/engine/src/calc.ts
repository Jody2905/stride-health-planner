import { Flag, Focus, Goal, Profile, Units, formatWeight } from "./types";

export const ACTIVITY_FACTOR: Record<Profile["activity"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

/** Lowest daily calorie target Stride will ever set without medical supervision. */
export function calorieFloor(sex: Profile["sex"]): number {
  return sex === "male" ? 1500 : sex === "female" ? 1200 : 1350;
}

/** Mifflin-St Jeor resting energy expenditure (kcal/day). "other" uses the midpoint of both constants. */
export function bmr(p: Pick<Profile, "sex" | "weightKg" | "heightCm" | "age">): number {
  const sexAdj = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexAdj;
}

export interface Numbers {
  bmi: number;
  goalBmi: number;
  healthyMinKg: number;
  healthyMaxKg: number;
  bmr: number;
  tdee: number;
  goal: Goal;
  /** Weight the plan actually targets (may be raised if the stated goal is below the healthy range). */
  effectiveGoalKg: number;
  /** Daily calorie target, or null when Stride won't give one (under 18, pregnancy). */
  targetKcal: number | null;
  /** Expected change per week in kg (positive number). */
  ratePerWeekKg: number;
  weeksToGoal: number;
  proteinG: [number, number];
  /** Protein range per kg of reference body weight used for proteinG. */
  proteinPerKg: [number, number];
  /** Training focus actually used (may differ from the profile, e.g. "muscle" becomes "recomp" when weight loss is the goal). */
  focus: Focus;
  waterL: number;
  /** True when weight change is switched off for safety reasons. */
  weightChangeBlocked: boolean;
  /** True when numeric calorie / supplement dose targets are hidden (under 18, pregnancy). */
  numbersHidden: boolean;
  flags: Flag[];
}

const KCAL_PER_KG = 7700;

export function calculate(p: Profile, units: Units = "metric"): Numbers {
  const h = p.heightCm / 100;
  const bmi = p.weightKg / (h * h);
  const goalBmi = p.goalKg / (h * h);
  const healthyMinKg = 18.5 * h * h;
  const healthyMaxKg = 24.9 * h * h;
  const restKcal = bmr(p);
  const tdee = restKcal * ACTIVITY_FACTOR[p.activity];
  const flags: Flag[] = [];

  const diff = p.goalKg - p.weightKg;
  let goal: Goal = diff <= -1 ? "lose" : diff >= 1 ? "gain" : "maintain";
  let effectiveGoalKg = p.goalKg;
  let blocked = false;
  let hidden = false;
  const pregnant = p.pregnant && p.sex !== "male";

  if (p.age < 18) {
    flags.push({
      level: "stop",
      title: "Under 18",
      message:
        "Adult calorie formulas and supplement doses don't apply to growing teens. The workouts are fine with good form, and the WHO recommends 60 minutes of activity a day. Talk to a doctor or parent before changing how you eat.",
    });
    blocked = hidden = true;
  }
  if (pregnant) {
    flags.push({
      level: "stop",
      title: "Pregnancy or breastfeeding",
      message:
        "Stride won't set a weight-loss target during pregnancy or breastfeeding. Exercise is usually encouraged, but clear your plan with your midwife or doctor, and ask them which prenatal vitamin to take.",
    });
    blocked = hidden = true;
  }
  if (goal === "lose" && bmi < 18.5) {
    flags.push({
      level: "stop",
      title: "Already below a healthy weight",
      message:
        "Your BMI is under 18.5, so Stride won't plan further weight loss. The plan focuses on building strength. If you've been losing weight without trying, see a doctor.",
    });
    goal = "maintain";
    blocked = true;
  } else if (goal === "lose" && goalBmi < 18.5) {
    effectiveGoalKg = Math.ceil(healthyMinKg * 10) / 10;
    flags.push({
      level: "warn",
      title: "Goal is below the healthy range",
      message: `A goal of ${formatWeight(p.goalKg, units)} gives a BMI of ${goalBmi.toFixed(1)}. Stride plans toward ${formatWeight(effectiveGoalKg, units)}, the bottom of the healthy range for your height.`,
    });
  }
  if (p.condition) {
    flags.push({
      level: "info",
      title: "Check with your doctor first",
      message:
        "Because you have a condition or take medication, ask your doctor before starting this plan, and check every supplement with a pharmacist for interactions.",
    });
  }
  if (p.injuries.length) {
    flags.push({
      level: "info",
      title: "Plan adjusted for your injuries",
      message:
        "Exercises that load your injured areas have been swapped for safer options. See the Workouts tab for details, and check with a physiotherapist if an injury is recent or getting worse.",
    });
  }
  if (p.age >= 65) {
    flags.push({
      level: "info",
      title: "Balance training added",
      message:
        "For adults 65+, the WHO recommends balance and strength work on 3 or more days a week to prevent falls. It's included in your plan.",
    });
  }

  // Training focus. Building muscle while the stated goal is weight loss is a recomposition.
  let focus: Focus = p.focus;
  if (pregnant && focus !== "general") {
    focus = "general";
    flags.push({
      level: "info",
      title: "Muscle-building plan paused",
      message: "During pregnancy and breastfeeding Stride uses the general plan. Your midwife or doctor can tell you which strength work is right for you.",
    });
  } else if (focus === "muscle" && goal === "lose") {
    focus = "recomp";
    flags.push({
      level: "info",
      title: "Planned as body recomposition",
      message: "Your goal weight is lower than your current weight, so Stride uses a small deficit with high protein and hypertrophy training: you lose fat while building muscle.",
    });
  } else if (focus === "muscle" && bmi >= 27 && !blocked) {
    focus = "recomp";
    flags.push({
      level: "info",
      title: "Recomposition first",
      message: "At your current weight, building muscle in a small deficit works well and avoids gaining extra fat. Switch to a surplus later if progress stalls.",
    });
  }

  let target = tdee;
  if (!blocked && focus === "recomp") {
    // Bigger deficits for more body fat, close to maintenance for lean people (Barakat et al., 2020).
    const deficit = goal === "gain" ? 0 : bmi >= 25 ? Math.min(500, tdee * 0.15) : bmi >= 21 ? Math.min(300, tdee * 0.1) : 0;
    target = Math.max(tdee - deficit, calorieFloor(p.sex));
    if (target < tdee && goal !== "lose") goal = "lose";
  } else if (!blocked && focus === "muscle") {
    // Lean gain: ~10% surplus for beginners/intermediates, ~5% for advanced (Iraki et al., 2019).
    const pct = p.experience === "advanced" ? 0.05 : 0.1;
    target = tdee + Math.min(350, Math.max(150, tdee * pct));
    goal = "gain";
  } else {
    if (!blocked && goal === "lose") {
      const deficit = Math.min(550, tdee * 0.2);
      target = Math.max(tdee - deficit, calorieFloor(p.sex));
    }
    if (!blocked && goal === "gain") target = tdee + 275;
  }
  const rate = blocked || target === tdee ? 0 : (Math.abs(target - tdee) * 7) / KCAL_PER_KG;
  const towardGoal = (goal === "lose" && effectiveGoalKg < p.weightKg) || (goal === "gain" && effectiveGoalKg > p.weightKg);
  const weeksToGoal = rate > 0 && towardGoal ? Math.ceil(Math.abs(effectiveGoalKg - p.weightKg) / rate) : 0;

  // Protein is based on a reference weight capped at BMI 25 so it isn't inflated by body fat.
  const refKg = Math.min(p.weightKg, 25 * h * h);
  const proteinPerKg: [number, number] = focus === "recomp" ? [2.0, 2.4] : focus === "muscle" ? [1.6, 2.2] : [1.6, goal === "lose" ? 2.2 : 2.0];
  const proteinG: [number, number] = [Math.round(proteinPerKg[0] * refKg), Math.round(proteinPerKg[1] * refKg)];

  return {
    bmi,
    goalBmi,
    healthyMinKg,
    healthyMaxKg,
    bmr: restKcal,
    tdee,
    goal: blocked && goal !== "maintain" ? "maintain" : goal,
    effectiveGoalKg,
    targetKcal: hidden ? null : Math.round(target / 10) * 10,
    ratePerWeekKg: rate,
    weeksToGoal,
    proteinG,
    proteinPerKg,
    focus,
    waterL: Math.round(p.weightKg * 0.035 * 10) / 10,
    weightChangeBlocked: blocked,
    numbersHidden: hidden,
    flags,
  };
}
