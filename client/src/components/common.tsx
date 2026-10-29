import type { Flag } from "@stride/engine";
import type { ReactNode } from "react";

export function Banners({ flags, only }: { flags: Flag[]; only?: Flag["level"][] }) {
  const list = only ? flags.filter((f) => only.includes(f.level)) : flags;
  return (
    <>
      {list.map((f) => (
        <div key={f.title} className={`banner ${f.level}`} role={f.level === "stop" ? "alert" : undefined}>
          <span className="ic" aria-hidden>
            {f.level === "info" ? "i" : "!"}
          </span>
          <div>
            <b>{f.title}</b>
            {f.message}
          </div>
        </div>
      ))}
    </>
  );
}

export function Stat({ k, v, unit, s }: { k: string; v: ReactNode; unit?: string; s?: ReactNode }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">
        {v} {unit && <small>{unit}</small>}
      </div>
      {s && <div className="s">{s}</div>}
    </div>
  );
}

export function Heading({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="vhead">
      <div>
        <h3>{title}</h3>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Box({ title, items, children }: { title: string; items?: string[]; children?: ReactNode }) {
  return (
    <div className="box">
      <h4>{title}</h4>
      {items && (
        <ul>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}
