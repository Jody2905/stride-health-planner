import type { Numbers } from "./calc";
import type { Diet, Profile } from "./types";

/* ------------------------------------------------------------------ */
/* Food data                                                           */
/* ------------------------------------------------------------------ */

type Tag = "dairy" | "gluten" | "fish";
const ALL: Diet[] = ["omni", "veg", "vegan"];
const VEG: Diet[] = ["omni", "veg"];
const MEAT: Diet[] = ["omni"];

interface Food {
  name: string;
  diets: Diet[];
  tags?: Tag[];
  caribbean?: boolean;
}

const FOODS: Record<"protein" | "carbs" | "fats" | "veg", Food[]> = {
  protein: [
    { name: "Chicken or turkey breast", diets: MEAT },
    { name: "Fish: salmon, sardines, tuna", diets: MEAT, tags: ["fish"] },
    { name: "Lean beef or goat", diets: MEAT },
    { name: "Eggs", diets: VEG },
    { name: "Greek yogurt or cottage cheese", diets: VEG, tags: ["dairy"] },
    { name: "Tofu, tempeh, edamame", diets: ALL },
    { name: "Lentils, beans, chickpeas", diets: ALL },
    { name: "Flying fish, jack or snapper", diets: MEAT, tags: ["fish"], caribbean: true },
    { name: "Saltfish (soak well to cut salt)", diets: MEAT, tags: ["fish"], caribbean: true },
    { name: "Red beans, pigeon peas, channa", diets: ALL, caribbean: true },
  ],
  carbs: [
    { name: "Oats (certified gluten-free if needed)", diets: ALL },
    { name: "Brown rice, quinoa", diets: ALL },
    { name: "Wholegrain bread, pasta, wraps", diets: ALL, tags: ["gluten"] },
    { name: "Potatoes and sweet potatoes", diets: ALL },
    { name: "Whole fruit: bananas, berries, apples", diets: ALL },
    { name: "Breadfruit (roasted or boiled)", diets: ALL, caribbean: true },
    { name: "Dasheen, eddoes, yam", diets: ALL, caribbean: true },
    { name: "Green banana, plantain (boiled or baked)", diets: ALL, caribbean: true },
    { name: "Mango, papaya, golden apple, guava", diets: ALL, caribbean: true },
  ],
  fats: [
    { name: "Avocado", diets: ALL },
    { name: "Olive or canola oil", diets: ALL },
    { name: "Nuts and seeds: almonds, peanuts, chia, flax", diets: ALL },
    { name: "Peanut or other nut butter", diets: ALL },
    { name: "Oily fish (counts as protein too)", diets: MEAT, tags: ["fish"] },
    { name: "Coconut and coconut milk, in small amounts", diets: ALL, caribbean: true },
  ],
  veg: [
    { name: "Leafy greens: spinach, kale, lettuce", diets: ALL },
    { name: "Broccoli, cauliflower, cabbage", diets: ALL },
    { name: "Peppers, tomatoes, carrots, onions", diets: ALL },
    { name: "Callaloo", diets: ALL, caribbean: true },
    { name: "Christophene, pumpkin, okra", diets: ALL, caribbean: true },
    { name: "Bodi (long beans), cucumber, cabbage salad", diets: ALL, caribbean: true },
  ],
};

type Slot = "breakfast" | "lunch" | "dinner" | "snack";
interface MealIdea {
  slot: Slot;
  name: string;
  diets: Diet[];
  tags?: Tag[];
  caribbean?: boolean;
}

const MEALS: MealIdea[] = [
  // Breakfast
  { slot: "breakfast", name: "Greek yogurt with oats, berries and walnuts", diets: VEG, tags: ["dairy"] },
  { slot: "breakfast", name: "Scrambled eggs on wholegrain toast with spinach and tomato", diets: VEG, tags: ["gluten"] },
  { slot: "breakfast", name: "Tofu scramble with peppers, black beans and a corn tortilla", diets: ALL },
  { slot: "breakfast", name: "Overnight oats with soy milk, chia, peanut butter and banana", diets: ALL },
  { slot: "breakfast", name: "Veggie omelette with avocado and a piece of fruit", diets: VEG },
  { slot: "breakfast", name: "Saltfish and callaloo with roasted breadfruit", diets: MEAT, tags: ["fish"], caribbean: true },
  { slot: "breakfast", name: "Cornmeal porridge made with milk or soy milk, topped with banana and nutmeg", diets: ALL, caribbean: true },
  { slot: "breakfast", name: "Boiled eggs with steamed callaloo and green banana", diets: VEG, caribbean: true },
  { slot: "breakfast", name: "Curried channa and callaloo with roasted breadfruit", diets: ALL, caribbean: true },
  // Lunch
  { slot: "lunch", name: "Grilled chicken, quinoa and roasted vegetable bowl", diets: MEAT },
  { slot: "lunch", name: "Tuna and white bean salad in a wholegrain wrap", diets: MEAT, tags: ["fish", "gluten"] },
  { slot: "lunch", name: "Lentil and vegetable soup with a side salad and brown rice", diets: ALL },
  { slot: "lunch", name: "Chickpea, feta and cucumber salad with brown rice", diets: VEG, tags: ["dairy"] },
  { slot: "lunch", name: "Tofu and vegetable stir-fry with brown rice (use tamari if gluten-free)", diets: ALL },
  { slot: "lunch", name: "Stewed chicken with rice and peas and a large side salad", diets: MEAT, caribbean: true },
  { slot: "lunch", name: "Baked flying fish with dasheen, sweet potato and callaloo", diets: MEAT, tags: ["fish"], caribbean: true },
  { slot: "lunch", name: "Red bean stew with brown rice, pumpkin and cabbage salad", diets: ALL, caribbean: true },
  { slot: "lunch", name: "Curried channa and potato with brown rice and cucumber salad", diets: ALL, caribbean: true },
  // Dinner
  { slot: "dinner", name: "Baked salmon with sweet potato and green beans", diets: MEAT, tags: ["fish"] },
  { slot: "dinner", name: "Turkey or lean beef chilli with beans and rice", diets: MEAT },
  { slot: "dinner", name: "Black bean and veggie tacos on corn tortillas with avocado", diets: ALL },
  { slot: "dinner", name: "Egg and vegetable curry with brown rice", diets: VEG },
  { slot: "dinner", name: "Tempeh or tofu with roasted vegetables and potatoes", diets: ALL },
  { slot: "dinner", name: "Lighter oil down: chicken, breadfruit and callaloo with less coconut milk", diets: MEAT, caribbean: true },
  { slot: "dinner", name: "Grilled jack fish with christophene, pumpkin and brown rice", diets: MEAT, tags: ["fish"], caribbean: true },
  { slot: "dinner", name: "Lentil and pumpkin curry with rice and steamed bodi", diets: ALL, caribbean: true },
  { slot: "dinner", name: "Jerk chicken (skin off) with roasted breadfruit and coleslaw", diets: MEAT, caribbean: true },
  // Snacks
  { slot: "snack", name: "Greek yogurt with fruit", diets: VEG, tags: ["dairy"] },
  { slot: "snack", name: "Apple with peanut butter", diets: ALL },
  { slot: "snack", name: "Hummus with carrot and cucumber sticks", diets: ALL },
  { slot: "snack", name: "A handful of nuts and a banana", diets: ALL },
  { slot: "snack", name: "Two boiled eggs and a piece of fruit", diets: VEG },
  { slot: "snack", name: "Mango or golden apple with a handful of peanuts", diets: ALL, caribbean: true },
  { slot: "snack", name: "Roasted channa (chickpeas)", diets: ALL, caribbean: true },
  { slot: "snack", name: "Coconut water and a small handful of cashews", diets: ALL, caribbean: true },
];

/* ------------------------------------------------------------------ */
/* Output types                                                        */
/* ------------------------------------------------------------------ */

export interface Macro {
  grams: number;
  percent: number;
}
export interface MealTarget {
  label: string;
  slot: Slot;
  kcal: number | null;
  proteinG: number | null;
  /** Hand-portion guide: palms of protein, cupped hands of carbs, thumbs of fat, fists of veg. */
  portions: { protein: number; carbs: number; fats: number; veg: number };
  idea: string;
}
export interface NutritionPlan {
  kcal: number | null;
  macros: { protein: Macro; carbs: Macro; fats: Macro } | null;
  fibreG: number | null;
  waterL: number;
  meals: MealTarget[];
  foods: Record<"protein" | "carbs" | "fats" | "veg", string[]>;
  limit: string[];
  timing: string[];
  goalTips: string[];
  dietNotes: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SPLITS: Record<number, { label: string; slot: Slot; share: number }[]> = {
  3: [
    { label: "Breakfast", slot: "breakfast", share: 0.3 },
    { label: "Lunch", slot: "lunch", share: 0.35 },
    { label: "Dinner", slot: "dinner", share: 0.35 },
  ],
  4: [
    { label: "Breakfast", slot: "breakfast", share: 0.25 },
    { label: "Lunch", slot: "lunch", share: 0.3 },
    { label: "Snack", slot: "snack", share: 0.15 },
    { label: "Dinner", slot: "dinner", share: 0.3 },
  ],
  5: [
    { label: "Breakfast", slot: "breakfast", share: 0.2 },
    { label: "Morning snack", slot: "snack", share: 0.1 },
    { label: "Lunch", slot: "lunch", share: 0.3 },
    { label: "Afternoon snack", slot: "snack", share: 0.1 },
    { label: "Dinner", slot: "dinner", share: 0.3 },
  ],
};

const half = (x: number) => Math.max(0, Math.round(x * 2) / 2);

function allowed(p: Profile, item: { diets: Diet[]; tags?: Tag[] }): boolean {
  if (!item.diets.includes(p.diet)) return false;
  if (p.dairyFree && item.tags?.includes("dairy")) return false;
  if (p.glutenFree && item.tags?.includes("gluten")) return false;
  return true;
}

/** Caribbean users see local foods first, then general ones. General users see only general foods. */
function byCuisine<T extends { caribbean?: boolean }>(p: Profile, items: T[]): T[] {
  if (p.cuisine === "caribbean") return [...items.filter((i) => i.caribbean), ...items.filter((i) => !i.caribbean)];
  return items.filter((i) => !i.caribbean);
}

/** Splits a daily calorie target into protein, fat and carbs. Exported for tests. */
export function splitMacros(kcal: number, proteinG: number): { protein: Macro; carbs: Macro; fats: Macro } {
  const protein = Math.min(proteinG, (kcal * 0.35) / 4); // cap protein at 35% of energy
  let fat = (kcal * 0.28) / 9; // 28% of energy, inside the 20–35% acceptable range
  let carbs = (kcal - protein * 4 - fat * 9) / 4;
  if (carbs < 100) {
    // Protect a minimum of carbohydrate for training by trimming fat, never below 20% of energy.
    fat = Math.max((kcal * 0.2) / 9, (kcal - protein * 4 - 100 * 4) / 9);
    carbs = (kcal - protein * 4 - fat * 9) / 4;
  }
  const pct = (g: number, k: number) => Math.round(((g * k) / kcal) * 100);
  return {
    protein: { grams: Math.round(protein), percent: pct(protein, 4) },
    carbs: { grams: Math.round(carbs), percent: pct(carbs, 4) },
    fats: { grams: Math.round(fat), percent: pct(fat, 9) },
  };
}

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

/**
 * @param variant rotates the sample-day meal ideas so the user can "show another day".
 */
export function buildNutrition(p: Profile, n: Numbers, variant = 0): NutritionPlan {
  const kcal = n.targetKcal;
  const proteinMid = Math.round((n.proteinG[0] + n.proteinG[1]) / 2);
  const macros = kcal ? splitMacros(kcal, proteinMid) : null;
  const split = SPLITS[p.mealsPerDay] ?? SPLITS[4];

  const ideas = byCuisine(p, MEALS.filter((m) => allowed(p, m)));
  const usedSnack: Record<string, number> = {};
  const meals: MealTarget[] = split.map((s) => {
    const options = ideas.filter((m) => m.slot === s.slot);
    const offset = s.slot === "snack" ? (usedSnack.snack = (usedSnack.snack ?? -1) + 1) : 0;
    const idea = options.length ? options[(variant + offset) % options.length].name : "";
    const mealKcal = kcal ? Math.round((kcal * s.share) / 10) * 10 : null;
    const g = (m: Macro | undefined) => (m ? m.grams * s.share : 0);
    // Without numeric targets, fall back to the standard hand-portion guide for a main meal or snack.
    const portions = macros
      ? {
          protein: half(g(macros.protein) / 25),
          carbs: half(g(macros.carbs) / 25),
          fats: half(g(macros.fats) / 9),
          veg: s.slot === "snack" ? 0 : s.slot === "breakfast" ? 1 : 2,
        }
      : s.slot === "snack"
        ? { protein: 0.5, carbs: 0.5, fats: 0.5, veg: 0 }
        : { protein: 1, carbs: 1, fats: 1, veg: 2 };
    return {
      label: s.label,
      slot: s.slot,
      kcal: mealKcal,
      proteinG: macros ? Math.round(macros.protein.grams * s.share) : null,
      portions,
      idea,
    };
  });

  const foodList = (k: keyof typeof FOODS) => byCuisine(p, FOODS[k].filter((f) => allowed(p, f))).map((f) => f.name);

  const goalTips =
    n.goal === "lose"
      ? [
          "Fill half your plate with vegetables. They add volume for very few calories.",
          "Include protein at every meal. It keeps you fuller and protects muscle.",
          "Don't drink your calories: swap juice and soda for water or unsweetened drinks.",
          "Plan for hunger: keep a high-protein snack ready for the afternoon.",
        ]
      : n.goal === "gain"
        ? [
            "Add one extra snack or a larger breakfast rather than forcing huge dinners.",
            "Use calorie-dense foods: nuts, nut butter, avocado, dried fruit, whole milk or soy milk.",
            "A smoothie (oats, banana, peanut butter, milk) adds 500+ kcal easily.",
            "Weigh weekly. If you're gaining more than about 0.5 kg a week, trim 100–200 kcal.",
          ]
        : [
            "Keep meal times regular to make portions easier to manage.",
            "Base meals on the plate model: half veg, a quarter protein, a quarter starch.",
            "Check your weekly average weight. Small changes are normal; adjust if it drifts 2 kg either way.",
          ];

  const dietNotes: string[] = [];
  if (p.diet === "vegan") {
    dietNotes.push(
      "Take a vitamin B12 supplement or eat B12-fortified foods every day. It isn't reliably found in plant foods.",
      "Combine beans or lentils with grains through the day to cover all essential amino acids.",
      "Eat iron-rich foods (beans, lentils, tofu, greens) with vitamin C (citrus, peppers, guava) to absorb more iron.",
      "Choose calcium- and vitamin D-fortified plant milk, and consider an algae omega-3.",
    );
  } else if (p.diet === "veg") {
    dietNotes.push(
      "Eggs and dairy cover B12 for most vegetarians; consider a supplement if you eat little of either.",
      "Pair iron-rich plant foods with vitamin C to improve absorption.",
    );
  }
  if (p.dairyFree)
    dietNotes.push("Without dairy, get calcium from fortified soy milk, calcium-set tofu, sardines with bones, and leafy greens.");
  if (p.glutenFree)
    dietNotes.push("Base starches on rice, quinoa, potatoes and ground provisions. Check labels for hidden wheat in sauces and seasonings.");
  if (p.cuisine === "caribbean")
    dietNotes.push(
      "Ground provisions (dasheen, yam, breadfruit, green banana) are great carb sources. Boil, roast or bake rather than fry.",
      "Salted meats and fish are high in sodium. Soak them well and go easy on stock cubes and seasoning salts.",
    );

  return {
    kcal,
    macros,
    fibreG: kcal ? Math.round((14 * kcal) / 1000) : null,
    waterL: n.waterL,
    meals,
    foods: { protein: foodList("protein"), carbs: foodList("carbs"), fats: foodList("fats"), veg: foodList("veg") },
    limit: [
      "Sugary drinks, sweetened juices and energy drinks",
      "Fried foods and fast food",
      "Processed meats such as hot dogs, sausages and ham (classed as carcinogenic by the WHO's cancer agency)",
      "Pastries, sweets and refined snacks",
      "Salt: aim for under 5 g a day, about one teaspoon",
      "Alcohol: no amount improves health, and it slows recovery",
    ],
    timing: [
      "Eat a meal with carbs and protein 1–3 hours before training, or a small snack like a banana 30–60 minutes before.",
      `After training, have 20–40 g of protein within a couple of hours${macros ? " (one of your meals works fine)" : ""}.`,
      "Spread protein across 3–5 meals rather than one big serving.",
      "Drink water through the day and sip during workouts, more in hot weather.",
    ],
    goalTips,
    dietNotes,
  };
}
