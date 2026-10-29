import type { Exercise, Plan } from "@stride/engine";
import { useRef, useState } from "react";
import type { WorkoutEntry } from "../api";
import { Banners, Box, Heading } from "../components/common";
import { isoToday, WEEKDAY_OF } from "../format";

export function Workouts({
  plan,
  daysPerWeek,
  workoutLog,
  onToggleToday,
}: {
  plan: Plan;
  daysPerWeek: number;
  workoutLog: WorkoutEntry[];
  onToggleToday: (title: string, done: boolean) => void;
}) {
  const w = plan.workouts;
  const today = WEEKDAY_OF();
  const doneToday = workoutLog.some((x) => x.date === isoToday());
  const [ex, setEx] = useState<Exercise | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const open = (e: Exercise) => {
    setEx(e);
    try {
      dlg.current?.showModal();
    } catch {
      dlg.current?.setAttribute("open", "");
    }
  };

  return (
    <section className="view">
      <Banners flags={plan.numbers.flags} only={["stop"]} />
      <Heading
        title={`Your week · ${daysPerWeek} training days`}
        sub={`Sets × reps are on the right. Tap an exercise to see how to do it. Rest ${w.restBetweenSets} between sets. Aim for ${w.weeklyCardioMinutes} minutes of moderate cardio across the week.`}
      />
      <div className="week">
        {w.days.map((d) => {
          const isToday = d.day === today;
          return (
            <article key={d.day} className={`day${isToday ? " today" : ""}`}>
              <header>
                <div>
                  <div className="dn">{isToday ? `${d.day} · today` : d.day}</div>
                  <h4>{d.title}</h4>
                </div>
                <span className={`tag ${d.type}`}>{d.type === "strength" ? "Strength" : d.type === "cardio" ? "Cardio" : "Recovery"}</span>
              </header>
              {d.exercises.length > 0 ? (
                <ul className="ex">
                  {d.exercises.map((e) => (
                    <li key={e.name}>
                      <button type="button" onClick={() => open(e)}>
                        {e.name}
                      </button>
                      <span className="rx">{e.prescription}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {d.note && <p className={d.exercises.length ? "muted" : undefined}>{d.note}</p>}
              {isToday && d.type !== "rest" && (
                <button type="button" className={`btn ${doneToday ? "ghost" : ""}`} onClick={() => onToggleToday(d.title, !doneToday)}>
                  {doneToday ? "✓ Done · undo" : "Mark today's workout done"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <div className="cols">
        <Box title="Before every session" items={w.beforeSession} />
        <Box title="How to progress" items={w.progression} />
      </div>

      <dialog ref={dlg} aria-labelledby="exd-t">
        <h4 id="exd-t">{ex?.name}</h4>
        <p className="muted">How to do it · {ex?.prescription}</p>
        <ol>
          {ex?.howTo.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={() => (dlg.current?.close ? dlg.current.close() : dlg.current?.removeAttribute("open"))}>
          Close
        </button>
      </dialog>
    </section>
  );
}
