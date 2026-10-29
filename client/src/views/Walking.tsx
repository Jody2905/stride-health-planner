import { useCallback, useEffect, useState } from "react";
import { api, ApiError, DEMO, type BoardMember, type FriendsState, type StepEntry } from "../api";
import { Heading, Stat } from "../components/common";
import { isoToday, prettyDate, weekStart } from "../format";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const n = (x: number) => x.toLocaleString("en-US");

function weekDates(): string[] {
  const start = new Date(weekStart() + "T12:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return isoToday(d);
  });
}

function WeekBars({ daily, goal }: { daily: number[]; goal: number }) {
  const max = Math.max(goal * 1.25, ...daily);
  const today = isoToday();
  const dates = weekDates();
  return (
    <div className="weekbars" role="img" aria-label={`Steps this week: ${daily.map((v, i) => `${DAY_LABELS[i]} ${n(v)}`).join(", ")}. Goal ${n(goal)} a day.`}>
      <div className="gl-area" aria-hidden>
        <div className="goalline" style={{ bottom: `${(goal / max) * 100}%` }}>
          <span>Goal {n(goal)}</span>
        </div>
      </div>
      {daily.map((v, i) => (
        <div key={i} className={`wb${dates[i] === today ? " today" : ""}`}>
          <div className="wbv">{v ? (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v) : ""}</div>
          <div className="wbtrack">
            <div className={`wbfill${v >= goal ? " hit" : ""}`} style={{ height: `${(v / max) * 100}%` }} />
          </div>
          <div className="wbl">{DAY_LABELS[i]}</div>
        </div>
      ))}
    </div>
  );
}

function Friends({ goal }: { goal: number }) {
  const [state, setState] = useState<FriendsState | null>(null);
  const [board, setBoard] = useState<BoardMember[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const [f, b] = await Promise.all([api.friends(), api.leaderboard(weekStart())]);
    setState(f);
    setBoard(b.members);
  }, []);
  useEffect(() => {
    refresh().catch(() => setMsg({ kind: "err", text: "Couldn't load your friends. Check your connection." }));
  }, [refresh, goal]);

  async function run(fn: () => Promise<FriendsState>) {
    try {
      const r = await fn();
      setState(r);
      setMsg(r.message ? { kind: "ok", text: r.message } : null);
      setBoard((await api.leaderboard(weekStart())).members);
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof ApiError ? e.message : "Something went wrong." });
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    await run(() => api.addFriend(code.trim()));
    setCode("");
  }

  async function copyCode() {
    if (!state) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the code is shown as selectable text */
    }
  }

  if (!state) return <div className="box">Loading friends…</div>;
  const top = Math.max(1, ...board.map((m) => m.total));

  return (
    <>
      <div className="box">
        <h4>This week with friends</h4>
        {board.length <= 1 && <p className="muted small">Add a friend below and you'll see each other's weekly steps here.</p>}
        <ol className="board">
          {board.map((m, i) => (
            <li key={m.id} className={m.isMe ? "me" : undefined}>
              <span className="rank">{i + 1}</span>
              <span className="who">
                {m.isMe ? "You" : m.name}
                <span className="muted small"> · {m.daily.filter((d) => d >= m.goal).length}/7 days at goal</span>
              </span>
              <span className="track">
                <span className="fill" style={{ width: `${(m.total / top) * 100}%` }} />
              </span>
              <span className="num">{n(m.total)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="cols">
        <div className="box">
          <h4>Your friend code</h4>
          <p className="muted small">Share it with people you want to walk with. Only friends you accept can see your steps; they never see your email or health details.</p>
          <div className="codebox">
            <code>{state.code}</code>
            <button type="button" className="btn ghost" onClick={copyCode}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <button type="button" className="link small" onClick={() => run(api.resetCode)}>
            Get a new code (the old one stops working)
          </button>
        </div>
        <form className="box" onSubmit={add}>
          <h4>Add a friend</h4>
          <div className="logrow">
            <div className="f">
              <label htmlFor="fcode">Their friend code</label>
              <input id="fcode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="K7QM-X2PD" autoComplete="off" spellCheck={false} maxLength={12} />
            </div>
            <button type="submit" className="btn">
              Send request
            </button>
          </div>
          {msg && (
            <p className={msg.kind === "err" ? "ferr" : "okmsg"} role={msg.kind === "err" ? "alert" : "status"}>
              {msg.text}
            </p>
          )}
        </form>
      </div>

      {(state.incoming.length > 0 || state.outgoing.length > 0 || state.friends.length > 0) && (
        <div className="box">
          <h4>Friends</h4>
          <ul className="people">
            {state.incoming.map((f) => (
              <li key={`in${f.id}`}>
                <span>
                  <b>{f.name}</b> <span className="muted small">wants to walk with you</span>
                </span>
                <span className="row">
                  <button type="button" className="btn" onClick={() => run(() => api.acceptFriend(f.id))}>
                    Accept
                  </button>
                  <button type="button" className="btn ghost" onClick={() => run(() => api.removeFriend(f.id))}>
                    Decline
                  </button>
                </span>
              </li>
            ))}
            {state.outgoing.map((f) => (
              <li key={`out${f.id}`}>
                <span>
                  {f.name} <span className="muted small">· request sent</span>
                </span>
                <button type="button" className="link small" onClick={() => run(() => api.removeFriend(f.id))}>
                  Cancel
                </button>
              </li>
            ))}
            {state.friends.map((f) => (
              <li key={`f${f.id}`}>
                <span>{f.name}</span>
                <button type="button" className="link small" onClick={() => run(() => api.removeFriend(f.id))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function Walking({
  signedIn,
  steps,
  goal,
  onGoal,
  onAddSteps,
  onDeleteSteps,
  onCreateAccount,
}: {
  signedIn: boolean;
  steps: StepEntry[];
  goal: number;
  onGoal: (g: number) => void;
  onAddSteps: (e: StepEntry) => Promise<void>;
  onDeleteSteps: (date: string) => void;
  onCreateAccount: () => void;
}) {
  const [date, setDate] = useState(isoToday());
  const [value, setValue] = useState("");
  const [goalDraft, setGoalDraft] = useState(String(goal));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => setGoalDraft(String(goal)), [goal]);

  const dates = weekDates();
  const daily = dates.map((d) => steps.find((s) => s.date === d)?.steps ?? 0);
  const total = daily.reduce((a, b) => a + b, 0);
  const todaySteps = steps.find((s) => s.date === isoToday())?.steps ?? 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(value);
    if (!Number.isInteger(v) || v < 0 || v > 100000) return setError("Enter a whole number of steps between 0 and 100,000.");
    if (date > isoToday()) return setError("The date can't be in the future.");
    try {
      await onAddSteps({ date, steps: v });
      setValue("");
      setError(null);
      setVersion((x) => x + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function saveGoal() {
    const g = Math.round(Number(goalDraft) / 500) * 500;
    if (g >= 1000 && g <= 30000) onGoal(g);
    else setGoalDraft(String(goal));
  }

  return (
    <section className="view">
      <Heading
        title="Walking"
        sub="Log your daily steps from your phone or watch. Research links 7,000–10,000 steps a day with a lower risk of early death; any increase helps."
      />
      <div className="stats">
        <Stat k="Today" v={n(todaySteps)} unit="steps" s={todaySteps >= goal ? "Goal reached" : `${n(goal - todaySteps)} to go`} />
        <Stat k="This week" v={n(total)} unit="steps" s={`Avg ${n(Math.round(total / Math.max(1, dates.filter((d) => d <= isoToday()).length)))} a day`} />
        <Stat k="Days at goal" v={`${daily.filter((d) => d >= goal).length} / 7`} />
        <div className="stat">
          <label className="k" htmlFor="goal">
            Daily goal
          </label>
          <input
            id="goal"
            className="goalin"
            type="number"
            step={500}
            min={1000}
            max={30000}
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={saveGoal}
            onKeyDown={(e) => e.key === "Enter" && saveGoal()}
          />
          <div className="s">steps a day</div>
        </div>
      </div>

      <div className="cols wide-first">
        <div className="box">
          <h4>Your week</h4>
          <WeekBars daily={daily} goal={goal} />
        </div>
        <form className="box" onSubmit={submit}>
          <h4>Log steps</h4>
          <div className="logrow">
            <div className="f">
              <label htmlFor="sdate">Date</label>
              <input id="sdate" type="date" value={date} max={isoToday()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="ssteps">Steps</label>
              <input id="ssteps" type="number" inputMode="numeric" min={0} max={100000} value={value} placeholder="8500" onChange={(e) => setValue(e.target.value)} />
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
          {steps.length > 0 && (
            <table className="log">
              <tbody>
                {[...steps].reverse().slice(0, 7).map((s) => (
                  <tr key={s.date}>
                    <td>{prettyDate(s.date)}</td>
                    <td className="num">{n(s.steps)}</td>
                    <td>
                      <button type="button" className="link" onClick={() => onDeleteSteps(s.date)} aria-label={`Delete steps for ${prettyDate(s.date)}`}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </form>
      </div>

      {signedIn ? (
        <Friends key={version} goal={goal} />
      ) : (
        <div className="box empty">
          <h4>Walk with friends</h4>
          {DEMO ? (
            <p className="muted">
              Adding friends and a shared weekly leaderboard are part of the full version of Stride with accounts. Your own steps are saved in this browser.
            </p>
          ) : (
            <>
              <p className="muted">Create a free account to get a friend code, add friends, and see each other's weekly steps on a leaderboard.</p>
              <button type="button" className="btn" onClick={onCreateAccount}>
                Create account
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
