import { LB_PER_KG, type Units } from "@stride/engine";

export const fw = (kg: number, units: Units) => (units === "metric" ? `${kg.toFixed(1)} kg` : `${Math.round(kg * LB_PER_KG)} lb`);
export const fwNum = (kg: number, units: Units) => (units === "metric" ? +kg.toFixed(1) : Math.round(kg * LB_PER_KG));
export const toKg = (value: number, units: Units) => (units === "metric" ? value : value / LB_PER_KG);
export const kcal = (n: number) => n.toLocaleString("en-US");

/** Local date as YYYY-MM-DD (not UTC, so "today" matches the user's clock). */
export function isoToday(d = new Date()): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

/** Monday of the week containing `d`, as YYYY-MM-DD. */
export function weekStart(d = new Date()): string {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return isoToday(copy);
}

export const WEEKDAY_OF = (d = new Date()) => (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const)[d.getDay()];

export const prettyDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
