import type { Plan, Profile, Units } from "@stride/engine";
import { useState } from "react";
import type { WeightEntry, WorkoutEntry } from "../api";
import { Heading, Stat } from "../components/common";
import { fw, fwNum, isoToday, prettyDate, toKg, weekStart } from "../format";

function WeightChart({ entries, goalKg, units }: { entries: WeightEntry[]; goalKg: number; units: Units }) {
  const W = 640, H = 230, L = 44, R = 16, T = 16, B = 30;
  const xs = entries.map((e) => Date.parse(e.date));
  const ys = entries.map((e) => fwNum(e.weightKg, units));
  const goal = fwNum(goalKg, units);
  const lo = Math.floor(Math.min(...ys, goal) - 1);
  const hi = Math.ceil(Math.max(...ys, goal) + 1);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const sx = (t: number) => (x1 === x0 ? (L + W - R) / 2 : L + ((t - x0) / (x1 - x0)) * (W - L - R));
  const sy = (v: number) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const step = Math.max(1, Math.ceil((hi - lo) / 4));
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += step) ticks.push(v);
  const pts = entries.map((_, i) => `${sx(xs[i]).toFixed(1)},${sy(ys[i]).toFixed(1)}`);
  const area = `M${pts[0]} L${pts.join(" L")} L${sx(x1).toFixed(1)},${H - B} L${sx(x0).toFixed(1)},${H - B} Z`;
  const last = entries.length - 1;

  return (
    <div className="chartwrap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Weight from ${prettyDate(entries[0].date)} to ${prettyDate(entries[last].date)}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="gridline" />
            <text x={L - 8} y={sy(v) + 4} textAnchor="end" className="axis">
              {v}
            </text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={sy(goal)} y2={sy(goal)} className="goal" />
        <text x={W - R} y={sy(goal) - 6} textAnchor="end" className="goallbl">
          Goal {goal}
        </text>
        <path d={area} className="area" />
        <polyline points={pts.join(" ")} className="line" />
        {entries.map((e, i) => (
          <circle key={e.date} cx={sx(xs[i])} cy={sy(ys[i])} r={i === last ? 5 : 3} className={i === last ? "dot end" : "dot"}>
            <title>{`${prettyDate(e.date)}: ${fw(e.weightKg, units)}`}</title>
          </circle>
        ))}
        <text x={sx(x0)} y={H - 8} textAnchor={entries.length > 1 ? "start" : "middle"} className="axis">
          {prettyDate(entries[0].date)}
        </text>
        {entries.length > 1 && (
          <text x={sx(x1)} y={H - 8} textAnchor="end" className="axis">
            {prettyDate(entries[last].date)}
          </text>
        )}
      </svg>
    </div>
  );
}

export function Progress({
  plan,
  profile,
  units,
  weights,
  workouts,
  onAddWeight,
  onDeleteWeight,
  storageNote,
}: {
  plan: Plan;
  profile: Profile;
  units: Units;
  weights: WeightEntry[];
  workouts: WorkoutEntry[];
  onAddWeight: (e: WeightEntry) => Promise<void>;
  onDeleteWeight: (date: string) => void;
  storageNote: string;
}) {
  const [date, setDate] = useState(isoToday());
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const goalKg = plan.numbers.effectiveGoalKg;
  const planned = plan.workouts.days.filter((d) => d.type !== "rest").length;
  const thisWeek = workouts.filter((w) => w.date >= weekStart()).length;
  const first = weights[0];
  const latest = weights[weights.length - 1];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(value);
    const kg = toKg(v, units);
    if (!Number.isFinite(v) || kg < 30 || kg > 300) return setError(`Enter a weight between ${fw(30, units)} and ${fw(300, units)}.`);
    if (date > isoToday()) return setError("The date can't be in the future.");
    try {
      await onAddWeight({ date, weightKg: Math.round(kg * 10) / 10 });
      setValue("");
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="view">
      <Heading title="Progress" sub={storageNote} />
      <div className="stats">
        <Stat k="Starting" v={first ? fw(first.weightKg, units) : "—"} s={first ? prettyDate(first.date) : "Log your first weigh-in"} />
        <Stat k="Latest" v={latest ? fw(latest.weightKg, units) : fw(profile.weightKg, units)} s={latest ? prettyDate(latest.date) : "From your profile"} />
        <Stat
          k="Change"
          v={first && latest && weights.length > 1 ? `${latest.weightKg - first.weightKg > 0 ? "+" : ""}${fw(latest.weightKg - first.weightKg, units)}` : "—"}
          s={latest ? `${fw(Math.abs(goalKg - latest.weightKg), units)} to goal` : undefined}
        />
        <Stat k="Workouts this week" v={`${thisWeek} / ${planned}`} s={thisWeek >= planned ? "Week complete" : "Mark them done in Workouts"} />
      </div>

      <form className="logform box" onSubmit={submit}>
        <h4>Log a weigh-in</h4>
        <div className="logrow">
          <div className="f">
            <label htmlFor="logdate">Date</label>
            <input id="logdate" type="date" value={date} max={isoToday()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="f">
            <label htmlFor="logw">Weight ({units === "metric" ? "kg" : "lb"})</label>
            <input id="logw" type="number" step="0.1" inputMode="decimal" value={value} placeholder={String(fwNum(latest?.weightKg ?? profile.weightKg, units))} onChange={(e) => setValue(e.target.value)} />
          </div>
          <button type="submit" className="btn">
            Save
          </button>
        </div>
        {error && (
          <p className="ferr" role="alert">
            {error}
          </p>
        )}
        <p className="muted small">Weigh in the morning, after the bathroom, before eating. Logging the same date again replaces it.</p>
      </form>

      {weights.length > 0 ? (
        <div className="box">
          <h4>Weight over time</h4>
          <WeightChart entries={weights} goalKg={goalKg} units={units} />
        </div>
      ) : (
        <div className="box empty">
          <h4>Your chart will appear here</h4>
          <p className="muted">Log a weigh-in above. After two or three entries you'll see your trend against your goal line.</p>
        </div>
      )}

      <div className="cols">
        {weights.length > 0 && (
          <div className="box">
            <h4>Weigh-ins</h4>
            <table className="log">
              <tbody>
                {[...weights].reverse().slice(0, 12).map((w) => (
                  <tr key={w.date}>
                    <td>{prettyDate(w.date)}</td>
                    <td className="num">{fw(w.weightKg, units)}</td>
                    <td>
                      <button type="button" className="link" onClick={() => onDeleteWeight(w.date)} aria-label={`Delete ${prettyDate(w.date)}`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="box">
          <h4>Recent workouts</h4>
          {workouts.length ? (
            <table className="log">
              <tbody>
                {[...workouts].reverse().slice(0, 10).map((w) => (
                  <tr key={w.date}>
                    <td>{prettyDate(w.date)}</td>
                    <td>{w.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No workouts logged yet. On a training day, open Workouts and mark today's session done.</p>
          )}
        </div>
      </div>
    </section>
  );
}
