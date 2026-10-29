import type { Plan, Profile } from "@stride/engine";
import { Banners, Box, Heading, Stat } from "../components/common";
import { kcal } from "../format";

const PORTION_LABEL = {
  protein: ["palm", "palms", "of protein"],
  carbs: ["cupped hand", "cupped hands", "of carbs"],
  fats: ["thumb", "thumbs", "of fat"],
  veg: ["fist", "fists", "of veg"],
} as const;

const fmtPortion = (n: number) => (n % 1 === 0 ? String(n) : n < 1 ? "½" : `${Math.floor(n)}½`);

export function Nutrition({ plan, profile, onAnotherDay }: { plan: Plan; profile: Profile; onAnotherDay: () => void }) {
  const nu = plan.nutrition;
  const n = plan.numbers;
  const m = nu.macros;
  const goalWord = { lose: "fat loss", gain: "muscle gain", maintain: "health and performance" }[n.goal];

  return (
    <section className="view">
      <Banners flags={n.flags} only={["stop"]} />
      <Heading
        title={`Eating for ${goalWord}`}
        sub={
          nu.kcal
            ? "Your daily targets, split into meals. Hand portions make it easy to eat to plan without weighing food."
            : "Without calorie targets, use the hand-portion guide and food lists below to build balanced meals."
        }
      />

      {m && nu.kcal && (
        <>
          <div className="stats">
            <Stat k="Calories" v={kcal(nu.kcal)} unit="kcal" s={`${profile.mealsPerDay === 3 ? "3 meals" : `${profile.mealsPerDay} meals & snacks`}`} />
            <Stat k="Protein" v={m.protein.grams} unit="g" s={`${m.protein.percent}% of calories`} />
            <Stat k="Carbs" v={m.carbs.grams} unit="g" s={`${m.carbs.percent}% of calories`} />
            <Stat k="Fat" v={m.fats.grams} unit="g" s={`${m.fats.percent}% of calories`} />
            <Stat k="Fibre" v={nu.fibreG} unit="g" s="14 g per 1,000 kcal" />
          </div>
          <div className="macrobar" role="img" aria-label={`Protein ${m.protein.percent}%, carbs ${m.carbs.percent}%, fat ${m.fats.percent}%`}>
            <i style={{ flex: m.protein.percent, background: "var(--accent)" }}>Protein {m.protein.percent}%</i>
            <i style={{ flex: m.carbs.percent, background: "var(--amber)" }}>Carbs {m.carbs.percent}%</i>
            <i style={{ flex: m.fats.percent, background: "var(--blue)" }}>Fat {m.fats.percent}%</i>
          </div>
        </>
      )}

      <div className="vhead">
        <div>
          <h4>A sample day</h4>
          <p className="muted small">Ideas that fit your diet{profile.cuisine === "caribbean" ? " and Caribbean food" : ""}. Portions are per meal.</p>
        </div>
        <button type="button" className="btn ghost" onClick={onAnotherDay}>
          Show another day
        </button>
      </div>
      <div className="meals">
        {nu.meals.map((meal, i) => (
          <article key={i} className="meal">
            <header>
              <h4>{meal.label}</h4>
              {meal.kcal && (
                <span className="rx">
                  {meal.kcal} kcal · {meal.proteinG} g protein
                </span>
              )}
            </header>
            <p>{meal.idea}</p>
            <ul className="portions">
              {(Object.keys(PORTION_LABEL) as (keyof typeof PORTION_LABEL)[])
                .filter((k) => meal.portions[k] > 0)
                .map((k) => {
                  const v = meal.portions[k];
                  const [one, many, what] = PORTION_LABEL[k];
                  return (
                    <li key={k} className={`p-${k}`}>
                      <b>{fmtPortion(v)}</b> {v > 1 ? many : one} {what}
                    </li>
                  );
                })}
            </ul>
          </article>
        ))}
      </div>
      <p className="muted small">
        Hand portions: a <b>palm</b> of protein ≈ 25 g protein · a <b>cupped hand</b> of carbs ≈ 25 g carbs · a <b>thumb</b> of fat ≈ 9 g fat · a{" "}
        <b>fist</b> of vegetables.
      </p>

      <div className="foods">
        {(
          [
            ["Protein", nu.foods.protein, "p-protein"],
            ["Carbs", nu.foods.carbs, "p-carbs"],
            ["Healthy fats", nu.foods.fats, "p-fats"],
            ["Vegetables", nu.foods.veg, "p-veg"],
          ] as const
        ).map(([t, list, cls]) => (
          <div key={t} className={`box foodcol ${cls}`}>
            <h4>{t}</h4>
            <ul>
              {list.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="cols">
        <Box title={n.goal === "lose" ? "Tips for fat loss" : n.goal === "gain" ? "Tips for gaining" : "Tips for maintaining"} items={nu.goalTips} />
        <Box title="Around your workouts" items={nu.timing} />
        <Box title="Limit these" items={nu.limit} />
        {nu.dietNotes.length > 0 && <Box title="For your diet" items={nu.dietNotes} />}
      </div>
    </section>
  );
}
