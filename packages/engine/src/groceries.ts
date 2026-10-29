import type { Ingredient, PlanDay } from "./nutrition";

export const AISLES = ["Fruit & vegetables", "Meat & fish", "Eggs, dairy & tofu", "Grains & bread", "Cans & pantry"] as const;
export type Aisle = (typeof AISLES)[number];

const AISLE_OF: Record<string, Aisle> = {};
const put = (aisle: Aisle, names: string) => names.split(",").forEach((n) => (AISLE_OF[n.trim()] = aisle));
put(
  "Fruit & vegetables",
  "Berries, Spinach, Tomatoes, Bell peppers, Onions, Avocados, Apples, Callaloo, Breadfruit, Bananas, Green bananas, Zucchini, Lettuce, Carrots, Cucumbers, Broccoli, Dasheen, Sweet potatoes, Pumpkin, Cabbage, Potatoes, Green beans, Limes, Christophene, Bodi (long beans), Mangoes, Oranges",
);
put("Meat & fish", "Saltfish, Chicken breast, Chicken thighs (skinless), Flying fish, Salmon fillets, Lean minced turkey or beef, Jack fish");
put("Eggs, dairy & tofu", "Greek yogurt, Eggs, Soy milk, Soy milk or milk, Feta, Firm tofu, Tempeh or firm tofu, Hummus");
put("Grains & bread", "Rolled oats, Wholegrain bread, Corn tortillas, Fine cornmeal, Quinoa, Wholegrain wraps, Brown rice, Rice");

export interface GroceryItem {
  name: string;
  /** Human-readable amount, e.g. "1.2 kg", "7", "2 cans". */
  amount: string;
  qty: number;
  unit: Ingredient["unit"];
}
export interface GroceryGroup {
  aisle: Aisle;
  items: GroceryItem[];
}

const roundUp = (n: number, step: number) => Math.max(step, Math.ceil(n / step) * step);

function describe(name: string, qty: number, unit: Ingredient["unit"]): string {
  if (unit === "g" || unit === "ml") {
    const r = roundUp(qty, 50);
    const big = unit === "g" ? "kg" : "L";
    const main = r >= 1000 ? `${(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)} ${big}` : `${r} ${unit}`;
    if (name.includes("(canned)") && unit === "g") {
      const can = name.startsWith("Tuna") ? 145 : 400;
      const cans = Math.ceil(qty / can);
      return `${cans} ${cans === 1 ? "can" : "cans"}`;
    }
    return main;
  }
  const c = Math.ceil(qty);
  if (unit === "pc") return `${c}`;
  if (unit === "slice") return `${c} ${c === 1 ? "slice" : "slices"}`;
  // Spoon measures are summed in tablespoons; show teaspoons when it's under one.
  return qty < 1 ? `${Math.ceil(qty * 3)} tsp` : `${Math.ceil(qty)} tbsp`;
}

/** Adds up the ingredients for a set of days and groups them by supermarket aisle. */
export function buildGroceryList(days: PlanDay[]): GroceryGroup[] {
  const totals = new Map<string, { name: string; unit: Ingredient["unit"]; qty: number }>();
  for (const d of days)
    for (const m of d.meals)
      for (const i of m.ingredients) {
        const unit = i.unit === "tsp" ? "tbsp" : i.unit;
        const qty = i.unit === "tsp" ? i.qty / 3 : i.qty;
        const key = `${i.name}|${unit}`;
        const t = totals.get(key) ?? { name: i.name, unit, qty: 0 };
        t.qty += qty;
        totals.set(key, t);
      }
  return AISLES.map((aisle) => ({
    aisle,
    items: [...totals.values()]
      .filter((t) => (AISLE_OF[t.name] ?? "Cans & pantry") === aisle)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ name: t.name, qty: t.qty, unit: t.unit, amount: describe(t.name, t.qty, t.unit) })),
  })).filter((g) => g.items.length > 0);
}
