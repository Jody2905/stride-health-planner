import type { Grade, Plan, Profile } from "@stride/engine";
import { useState } from "react";
import { Banners, Heading } from "../components/common";

const GRADE: Record<Grade, string> = { strong: "Strong evidence", moderate: "Moderate evidence", limited: "Limited evidence", avoid: "Avoid" };

export function Supplements({ plan, profile }: { plan: Plan; profile: Profile }) {
  const [filter, setFilter] = useState<"you" | "all">("you");
  const list = plan.supplements;
  const n = plan.numbers;

  if (n.numbersHidden) {
    return (
      <section className="view">
        <Banners flags={n.flags} only={["stop"]} />
        <div className="box">
          <h4>Supplements need a doctor's advice here</h4>
          <p className="muted">
            {profile.pregnant
              ? "During pregnancy and breastfeeding, doses and safety are different. A prenatal vitamin with folic acid is usually recommended. Ask your midwife or doctor which one."
              : "Teens should get nutrients from food. Talk to a doctor before taking any supplement, and avoid creatine, pre-workouts and fat burners."}
          </p>
        </div>
      </section>
    );
  }

  const shown = filter === "you" ? list.filter((s) => s.relevant) : list;
  return (
    <section className="view">
      <Banners flags={n.flags.filter((f) => f.title.startsWith("Check"))} />
      <Heading title="Vitamins & supplements" sub="Graded by the strength of the research. Food comes first; these fill specific gaps." />
      <div className="filters" role="group" aria-label="Filter supplements">
        <button type="button" aria-pressed={filter === "you"} onClick={() => setFilter("you")}>
          Relevant to you ({list.filter((s) => s.relevant).length})
        </button>
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          All ({list.length})
        </button>
      </div>
      <div className="sups">
        {shown.map((s) => (
          <article key={s.name} className={`sup g-${s.grade}`}>
            <header>
              <h4>{s.name}</h4>
              <span className="grade">{GRADE[s.grade]}</span>
            </header>
            <dl>
              <dt>Why</dt>
              <dd>{s.why}</dd>
              <dt>Dose</dt>
              <dd>{s.dose}</dd>
              <dt>Note</dt>
              <dd>{s.caution}</dd>
            </dl>
            <a href={s.source} target="_blank" rel="noopener noreferrer">
              Read the research ↗
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
