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
  /** Ingredients for one serving at the reference size (about 500 kcal for meals, 200 kcal for snacks). */
  ing: string;
}

const MEALS: MealIdea[] = [
  // Breakfast
  { slot: "breakfast", name: "Greek yogurt with oats, berries and walnuts", diets: VEG, tags: ["dairy"], ing: "Greek yogurt 200 g; Rolled oats 40 g; Berries 100 g; Walnuts 15 g" },
  { slot: "breakfast", name: "Scrambled eggs on wholegrain toast with spinach and tomato", diets: VEG, tags: ["gluten"], ing: "Eggs 3 pc; Wholegrain bread 2 slice; Spinach 50 g; Tomatoes 1 pc" },
  { slot: "breakfast", name: "Tofu scramble with peppers, black beans and a corn tortilla", diets: ALL, ing: "Firm tofu 150 g; Bell peppers 1 pc; Black beans (canned) 80 g; Corn tortillas 1 pc" },
  { slot: "breakfast", name: "Overnight oats with soy milk, chia, peanut butter and banana", diets: ALL, ing: "Rolled oats 50 g; Soy milk 200 ml; Chia seeds 10 g; Peanut butter 15 g; Bananas 1 pc" },
  { slot: "breakfast", name: "Veggie omelette with avocado and a piece of fruit", diets: VEG, ing: "Eggs 3 pc; Bell peppers 0.5 pc; Onions 0.5 pc; Avocados 0.5 pc; Apples 1 pc" },
  { slot: "breakfast", name: "Saltfish and callaloo with roasted breadfruit", diets: MEAT, tags: ["fish"], caribbean: true, ing: "Saltfish 100 g; Callaloo 100 g; Breadfruit 200 g; Onions 0.5 pc; Tomatoes 1 pc" },
  { slot: "breakfast", name: "Cornmeal porridge made with milk or soy milk, topped with banana and nutmeg", diets: ALL, caribbean: true, ing: "Fine cornmeal 50 g; Soy milk or milk 300 ml; Bananas 1 pc; Peanuts 15 g" },
  { slot: "breakfast", name: "Boiled eggs with steamed callaloo and green banana", diets: VEG, caribbean: true, ing: "Eggs 3 pc; Callaloo 100 g; Green bananas 2 pc" },
  { slot: "breakfast", name: "Curried channa and callaloo with roasted breadfruit", diets: ALL, caribbean: true, ing: "Chickpeas (canned) 150 g; Callaloo 100 g; Breadfruit 150 g; Curry powder 1 tsp" },
  // Lunch
  { slot: "lunch", name: "Grilled chicken, quinoa and roasted vegetable bowl", diets: MEAT, ing: "Chicken breast 150 g; Quinoa 60 g; Zucchini 1 pc; Bell peppers 1 pc; Olive oil 1 tbsp" },
  { slot: "lunch", name: "Tuna and white bean salad in a wholegrain wrap", diets: MEAT, tags: ["fish", "gluten"], ing: "Tuna (canned) 120 g; White beans (canned) 80 g; Wholegrain wraps 1 pc; Lettuce 50 g; Tomatoes 1 pc" },
  { slot: "lunch", name: "Lentil and vegetable soup with a side salad and brown rice", diets: ALL, ing: "Red lentils 70 g; Carrots 1 pc; Onions 0.5 pc; Brown rice 50 g; Lettuce 50 g" },
  { slot: "lunch", name: "Chickpea, feta and cucumber salad with brown rice", diets: VEG, tags: ["dairy"], ing: "Chickpeas (canned) 150 g; Feta 40 g; Cucumbers 0.5 pc; Brown rice 60 g; Olive oil 1 tbsp" },
  { slot: "lunch", name: "Tofu and vegetable stir-fry with brown rice (use tamari if gluten-free)", diets: ALL, ing: "Firm tofu 150 g; Broccoli 150 g; Carrots 1 pc; Brown rice 60 g; Tamari or soy sauce 1 tbsp" },
  { slot: "lunch", name: "Stewed chicken with rice and peas and a large side salad", diets: MEAT, caribbean: true, ing: "Chicken thighs (skinless) 150 g; Rice 60 g; Pigeon peas (canned) 60 g; Lettuce 50 g; Cucumbers 0.5 pc" },
  { slot: "lunch", name: "Baked flying fish with dasheen, sweet potato and callaloo", diets: MEAT, tags: ["fish"], caribbean: true, ing: "Flying fish 150 g; Dasheen 150 g; Sweet potatoes 100 g; Callaloo 100 g" },
  { slot: "lunch", name: "Red bean stew with brown rice, pumpkin and cabbage salad", diets: ALL, caribbean: true, ing: "Red kidney beans (canned) 150 g; Brown rice 60 g; Pumpkin 150 g; Cabbage 100 g" },
  { slot: "lunch", name: "Curried channa and potato with brown rice and cucumber salad", diets: ALL, caribbean: true, ing: "Chickpeas (canned) 150 g; Potatoes 150 g; Brown rice 50 g; Cucumbers 0.5 pc; Curry powder 1 tsp" },
  // Dinner
  { slot: "dinner", name: "Baked salmon with sweet potato and green beans", diets: MEAT, tags: ["fish"], ing: "Salmon fillets 150 g; Sweet potatoes 200 g; Green beans 150 g" },
  { slot: "dinner", name: "Turkey or lean beef chilli with beans and rice", diets: MEAT, ing: "Lean minced turkey or beef 130 g; Red kidney beans (canned) 80 g; Chopped tomatoes (canned) 200 g; Rice 50 g; Onions 0.5 pc" },
  { slot: "dinner", name: "Black bean and veggie tacos on corn tortillas with avocado", diets: ALL, ing: "Black beans (canned) 150 g; Corn tortillas 3 pc; Bell peppers 1 pc; Avocados 0.5 pc; Limes 0.5 pc" },
  { slot: "dinner", name: "Egg and vegetable curry with brown rice", diets: VEG, ing: "Eggs 3 pc; Spinach 80 g; Chopped tomatoes (canned) 150 g; Brown rice 60 g; Curry powder 1 tsp" },
  { slot: "dinner", name: "Tempeh or tofu with roasted vegetables and potatoes", diets: ALL, ing: "Tempeh or firm tofu 150 g; Potatoes 200 g; Broccoli 150 g; Olive oil 1 tbsp" },
  { slot: "dinner", name: "Lighter oil down: chicken, breadfruit and callaloo with less coconut milk", diets: MEAT, caribbean: true, ing: "Chicken thighs (skinless) 130 g; Breadfruit 200 g; Callaloo 100 g; Coconut milk 60 ml" },
  { slot: "dinner", name: "Grilled jack fish with christophene, pumpkin and brown rice", diets: MEAT, tags: ["fish"], caribbean: true, ing: "Jack fish 150 g; Christophene 1 pc; Pumpkin 150 g; Brown rice 60 g" },
  { slot: "dinner", name: "Lentil and pumpkin curry with rice and steamed bodi", diets: ALL, caribbean: true, ing: "Red lentils 70 g; Pumpkin 150 g; Rice 50 g; Bodi (long beans) 100 g; Curry powder 1 tsp" },
  { slot: "dinner", name: "Jerk chicken (skin off) with roasted breadfruit and coleslaw", diets: MEAT, caribbean: true, ing: "Chicken thighs (skinless) 150 g; Breadfruit 200 g; Cabbage 100 g; Carrots 1 pc; Jerk seasoning 1 tbsp" },
  // Snacks
  { slot: "snack", name: "Greek yogurt with fruit", diets: VEG, tags: ["dairy"], ing: "Greek yogurt 170 g; Berries 80 g" },
  { slot: "snack", name: "Apple with peanut butter", diets: ALL, ing: "Apples 1 pc; Peanut butter 20 g" },
  { slot: "snack", name: "Hummus with carrot and cucumber sticks", diets: ALL, ing: "Hummus 60 g; Carrots 1 pc; Cucumbers 0.5 pc" },
  { slot: "snack", name: "A handful of nuts and a banana", diets: ALL, ing: "Mixed nuts 25 g; Bananas 1 pc" },
  { slot: "snack", name: "Two boiled eggs and a piece of fruit", diets: VEG, ing: "Eggs 2 pc; Oranges 1 pc" },
  { slot: "snack", name: "Mango or golden apple with a handful of peanuts", diets: ALL, caribbean: true, ing: "Mangoes 1 pc; Peanuts 20 g" },
  { slot: "snack", name: "Roasted channa (chickpeas)", diets: ALL, caribbean: true, ing: "Chickpeas (canned) 120 g; Olive oil 1 tsp" },
  { slot: "snack", name: "Coconut water and a small handful of cashews", diets: ALL, caribbean: true, ing: "Coconut water 330 ml; Cashews 20 g" },
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
  /** Ingredients for this meal, scaled to its calorie target. */
  ingredients: Ingredient[];
}
export interface Ingredient {
  name: string;
  qty: number;
  unit: "g" | "ml" | "pc" | "slice" | "tbsp" | "tsp";
}
export interface PlanDay {
  day: string;
  meals: MealTarget[];
}
export interface NutritionPlan {
  kcal: number | null;
  macros: { protein: Macro; carbs: Macro; fats: Macro } | null;
  fibreG: number | null;
  waterL: number;
  meals: MealTarget[];
  /** Seven days of meals; the sample day is the first. */
  week: PlanDay[];
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

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Parses "Eggs 3 pc; Spinach 50 g" into ingredient objects. */
export function parseIngredients(spec: string): Ingredient[] {
  return spec.split(";").map((part) => {
    const m = part.trim().match(/^(.*\S)\s+([\d.]+)\s+(g|ml|pc|slice|tbsp|tsp)$/);
    if (!m) throw new Error(`Bad ingredient: ${part}`);
    return { name: m[1], qty: Number(m[2]), unit: m[3] as Ingredient["unit"] };
  });
}

function planDay(
  split: { label: string; slot: Slot; share: number }[],
  ideas: MealIdea[],
  kcal: number | null,
  macros: { protein: Macro; carbs: Macro; fats: Macro } | null,
  variant: number,
): MealTarget[] {
  let snackIndex = 0;
  return split.map((s) => {
    const options = ideas.filter((m) => m.slot === s.slot);
    const offset = s.slot === "snack" ? snackIndex++ : 0;
    const chosen = options.length ? options[(variant + offset) % options.length] : null;
    const mealKcal = kcal ? Math.round((kcal * s.share) / 10) * 10 : null;
    const g = (m: Macro) => m.grams * s.share;
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
    // Ingredient amounts are written for ~500 kcal meals / ~200 kcal snacks; scale to this meal.
    const reference = s.slot === "snack" ? 200 : 500;
    const scale = mealKcal ? Math.min(1.8, Math.max(0.6, mealKcal / reference)) : 1;
    const ingredients = chosen
      ? parseIngredients(chosen.ing).map((i) => ({
          ...i,
          qty: i.unit === "g" || i.unit === "ml" ? Math.round((i.qty * scale) / 5) * 5 : Math.round(i.qty * scale * 2) / 2,
        }))
      : [];
    return {
      label: s.label,
      slot: s.slot,
      kcal: mealKcal,
      proteinG: macros ? Math.round(macros.protein.grams * s.share) : null,
      portions,
      idea: chosen?.name ?? "",
      ingredients,
    };
  });
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
  const week: PlanDay[] = WEEK.map((day, d) => ({ day, meals: planDay(split, ideas, kcal, macros, variant + d) }));
  const meals = week[0].meals;

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
    week,
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
