import { calorieFloor, type Plan, type Profile, type Units } from "@stride/engine";
import { Banners, Box, Heading, Stat } from "../components/common";
import { fw, kcal } from "../format";

const MIN = 15;
const MAX = 40;
const pos = (v: number) => Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100));
const SEGMENTS: [number, number, string][] = [
  [MIN, 18.5, "var(--blue)"],
  [18.5, 25, "var(--accent)"],
  [25, 30, "var(--amber)"],
  [30, MAX, "var(--red)"],
];

export function Overview({ plan, profile, units }: { plan: Plan; profile: Profile; units: Units }) {
  const n = plan.numbers;
  const title = { lose: "Lose weight", gain: "Gain weight", maintain: "Maintain & build fitness" }[n.goal];
  const sub = n.weightChangeBlocked
    ? "Targets are set for maintenance and strength, not weight change."
    : n.goal === "maintain"
      ? "Your goal is close to your current weight, so the plan focuses on strength and fitness."
      : `From ${fw(profile.weightKg, units)} to ${fw(n.effectiveGoalKg, units)} at about ${fw(n.ratePerWeekKg, units)} per week, a pace research links to keeping muscle and keeping weight off.`;
  const category = n.bmi < 18.5 ? "Underweight" : n.bmi < 25 ? "Healthy range" : n.bmi < 30 ? "Overweight" : "Obese range";
  const goalBmi = n.effectiveGoalKg / (profile.heightCm / 100) ** 2;
  const showGoal = n.goal !== "maintain";

  return (
    <section className="view">
      <Banners flags={n.flags} />
      <Heading title={title} sub={sub} />
      <div className="stats">
        <Stat k="Daily calories" v={n.targetKcal ? kcal(n.targetKcal) : "—"} unit="kcal" s={`Maintenance ≈ ${kcal(Math.round(n.tdee / 10) * 10)}`} />
        <Stat k="Protein" v={n.numbersHidden ? "—" : `${n.proteinG[0]}–${n.proteinG[1]}`} unit="g/day" s={`1.6–${n.goal === "lose" ? "2.2" : "2.0"} g per kg`} />
        <Stat k="Time to goal" v={n.weeksToGoal ? `${n.weeksToGoal} wk` : "—"} s={n.weeksToGoal ? "If you stay consistent" : "No weight change planned"} />
        <Stat k="Water" v={units === "metric" ? n.waterL : Math.round(n.waterL * 33.8)} unit={units === "metric" ? "L" : "fl oz"} s="More in heat or long sessions" />
      </div>

      <div className="scale">
        <h4>
          BMI {n.bmi.toFixed(1)} · {category}
        </h4>
        <p className="muted small">
          Healthy weight for your height: {fw(n.healthyMinKg, units)} – {fw(n.healthyMaxKg, units)}. BMI is a rough screen and doesn't tell muscle from fat.
        </p>
        <div className="barwrap">
          <div className="bar">
            {SEGMENTS.map(([a, b, c]) => (
              <i key={a} style={{ width: `${((b - a) / (MAX - MIN)) * 100}%`, background: c }} />
            ))}
          </div>
          <span className="marker" style={{ left: `${pos(n.bmi)}%` }}>
            You {n.bmi.toFixed(1)}
          </span>
          {showGoal && (
            <span className="marker goal" style={{ left: `${pos(goalBmi)}%` }}>
              Goal
            </span>
          )}
        </div>
        <div className="ticks" style={{ marginTop: showGoal ? 26 : 0 }}>
          {[15, 18.5, 25, 30, 35, 40].map((v) => (
            <span key={v} style={{ left: `${pos(v)}%` }}>
              {v}
            </span>
          ))}
        </div>
      </div>

      <div className="cols">
        <Box title="How these numbers work">
          <ul>
            <li>
              Resting burn (BMR) uses the Mifflin-St Jeor equation: <b>{kcal(Math.round(n.bmr / 10) * 10)} kcal</b>.
            </li>
            <li>Multiplied by your activity level gives maintenance calories.</li>
            <li>Weight loss uses a deficit of at most 20%, and never below {kcal(calorieFloor(profile.sex))} kcal.</li>
            <li>Weight gain uses a small surplus (+275 kcal) to limit fat gain.</li>
          </ul>
        </Box>
        <Box
          title="Adjust as you go"
          items={[
            "Weigh yourself 2–3 mornings a week and track the weekly average in Progress.",
            "If the average hasn't moved in 3 weeks, change calories by 100–150.",
            "Strength going up and waist going down means it's working, even if the scale is slow.",
          ]}
        />
      </div>
    </section>
  );
}
