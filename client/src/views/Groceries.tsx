import type { Plan } from "@stride/engine";
import { useEffect, useState } from "react";
import { local } from "../api";
import { Heading } from "../components/common";

export function Groceries({ plan, weekKey, onNewWeek }: { plan: Plan; weekKey: string; onNewWeek: () => void }) {
  // Ticked items are a per-browser convenience, reset whenever the meal plan changes.
  const storeKey = `groceries.${weekKey}`;
  const [checked, setChecked] = useState<string[]>(() => local.get(storeKey, []));
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  useEffect(() => setChecked(local.get(storeKey, [])), [storeKey]);

  const toggle = (name: string) => {
    const next = checked.includes(name) ? checked.filter((n) => n !== name) : [...checked, name];
    setChecked(next);
    local.set(storeKey, next);
  };

  const all = plan.groceries.flatMap((g) => g.items);
  const left = all.filter((i) => !checked.includes(i.name)).length;
  const text = plan.groceries.map((g) => `${g.aisle}\n${g.items.map((i) => `- ${i.name}: ${i.amount}`).join("\n")}`).join("\n\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Stride grocery list\n\n${text}`);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  const week = plan.nutrition.week;
  const labels = week[0]?.meals.map((m) => m.label) ?? [];

  return (
    <section className="view">
      <Heading
        title="This week's meals & groceries"
        sub="Seven days of meals that fit your targets and diet, and everything you need to buy for them. Amounts are scaled to your calories."
      >
        <button type="button" className="btn ghost" onClick={onNewWeek}>
          Plan a different week
        </button>
      </Heading>

      <div className="box">
        <h4>Meal plan</h4>
        <div className="tablewrap">
          <table className="mealplan">
            <thead>
              <tr>
                <th scope="col">Day</th>
                {labels.map((l) => (
                  <th key={l} scope="col">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {week.map((d) => (
                <tr key={d.day}>
                  <th scope="row">{d.day}</th>
                  {d.meals.map((m, i) => (
                    <td key={i}>{m.idea}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="vhead">
        <div>
          <h4>Grocery list</h4>
          <p className="muted small">
            {left === 0 ? "Everything's ticked off." : `${left} of ${all.length} items left. Tick things off as you shop; we'll remember on this device.`}
          </p>
        </div>
        <div className="row">
          {checked.length > 0 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setChecked([]);
                local.set(storeKey, []);
              }}
            >
              Untick all
            </button>
          )}
          <button type="button" className="btn" onClick={copy}>
            {copied === "ok" ? "Copied ✓" : "Copy list"}
          </button>
        </div>
      </div>
      {copied === "fail" && (
        <textarea className="copybox" readOnly value={text} rows={8} onFocus={(e) => e.currentTarget.select()} aria-label="Grocery list text to copy" />
      )}

      <div className="aisles">
        {plan.groceries.map((g) => (
          <div key={g.aisle} className="box aisle">
            <h4>{g.aisle}</h4>
            <ul>
              {g.items.map((i) => {
                const done = checked.includes(i.name);
                const id = `g-${i.name.replace(/\W+/g, "-")}`;
                return (
                  <li key={i.name} className={done ? "done" : undefined}>
                    <input type="checkbox" id={id} checked={done} onChange={() => toggle(i.name)} />
                    <label htmlFor={id}>{i.name}</label>
                    <span className="amt">{i.amount}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="muted small">Pantry staples like salt, pepper, garlic and herbs aren't listed. Check what you already have before you go.</p>
    </section>
  );
}
