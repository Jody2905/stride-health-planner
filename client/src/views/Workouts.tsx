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
  onAvoid,
  onRestore,
}: {
  plan: Plan;
  daysPerWeek: number;
  workoutLog: WorkoutEntry[];
  onToggleToday: (title: string, done: boolean) => void;
  onAvoid: (name: string) => void;
  onRestore: (name: string | null) => void;
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
        sub={`Sets × reps are on the right. Tap an exercise to see how to do it, or ↻ to swap it for another. Rest ${w.restBetweenSets} between sets. Aim for ${w.weeklyCardioMinutes} minutes of moderate cardio across the week.`}
      />
      {w.injuryNotes.length > 0 && (
        <div className="banner info">
          <span className="ic" aria-hidden>
            i
          </span>
          <div>
            <b>Adjusted for your injuries</b>
            <ul className="tight">
              {w.injuryNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {w.avoided.length > 0 && (
        <div className="avoided">
          <span className="muted small">Swapped out:</span>
          {w.avoided.map((name) => (
            <button key={name} type="button" className="chip-btn" onClick={() => onRestore(name)} title="Put this exercise back">
              {name} <span aria-hidden>↺</span>
              <span className="sr">Restore {name}</span>
            </button>
          ))}
          <button type="button" className="link small" onClick={() => onRestore(null)}>
            Restore all
          </button>
        </div>
      )}
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
                      {e.swappable ? (
                        <button type="button" className="swap" onClick={() => onAvoid(e.name)} aria-label={`Swap ${e.name} for another exercise`} title="Swap for another exercise">
                          ↻
                        </button>
                      ) : (
                        <span className="swap-none" aria-hidden />
                      )}
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
        {ex?.cue && <p className="cue">{ex.cue}</p>}
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
