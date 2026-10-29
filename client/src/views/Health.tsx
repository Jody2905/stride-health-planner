import type { Plan } from "@stride/engine";
import { Heading } from "../components/common";

export function Health({ plan }: { plan: Plan }) {
  const { habits, checks } = plan.habits;
  return (
    <section className="view">
      <Heading title="Daily health targets" sub="The basics with the strongest research behind them." />
      <div className="habits">
        {habits.map((h) => (
          <div key={h.name} className="habit">
            <div className="k">{h.name}</div>
            <div className="t">{h.target}</div>
            <p>{h.detail}</p>
          </div>
        ))}
      </div>
      <div className="box">
        <h4>Health checks to ask about</h4>
        <ul>
          {checks.map((c) => (
            <li key={c.name}>
              <b>{c.name}:</b> {c.when}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Research({ plan }: { plan: Plan }) {
  return (
    <section className="view">
      <Heading title="The research behind Stride" sub="Every number in the app comes from one of these." />
      <div className="box src">
        <ul>
          {plan.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title} ↗
              </a>
              <br />
              <span className="muted small">{s.usedFor}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
