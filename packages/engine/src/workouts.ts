import type { Numbers } from "./calc";
import { INJURY_LABEL, MUSCLE_LABEL, type InjuryArea, type Muscle, type Profile, type Split } from "./types";

type Pattern =
  | "squat" | "hinge" | "hpush" | "hpull" | "vpush" | "vpull" | "lunge" | "core" | "core2" | "calf"
  // isolation work used by the muscle-building plans
  | "chestFly" | "lateral" | "rearDelt" | "biceps" | "triceps" | "legCurl" | "quadIso" | "glute";
type Equip = Profile["equipment"];

interface Candidate {
  name: string;
  /** Equipment settings this exercise can be done with. */
  equip: Equip[];
  /** Body areas this exercise loads heavily; skipped when the user has an injury there. */
  loads: InjuryArea[];
  howTo: string[];
  /** Extra coaching cue shown when this exercise was picked because of an injury. */
  cue?: string;
}

const ALL: Equip[] = ["none", "home", "gym"];
const KIT: Equip[] = ["home", "gym"];
const GYM: Equip[] = ["gym"];

/**
 * For each movement pattern, candidates in order of preference. The first one that fits the
 * user's equipment, avoids their injured areas and isn't on their avoid list is used.
 * Equipment-heavier options come first so gym users get gym exercises.
 */
const CANDIDATES: Record<Pattern, Candidate[]> = {
  squat: [
    { name: "Barbell back squat", equip: GYM, loads: ["knee", "back", "hip"], howTo: ["Bar on upper back, brace your core.", "Sit down to at least parallel with a neutral spine.", "Use safety pins or a spotter."] },
    { name: "Leg press", equip: GYM, loads: ["knee", "hip"], howTo: ["Feet shoulder-width in the middle of the platform.", "Lower until knees reach about 90°, keeping your lower back on the pad.", "Press up without locking your knees."] },
    { name: "Goblet squat", equip: KIT, loads: ["knee", "hip"], howTo: ["Hold one dumbbell at your chest.", "Squat down between your knees, elbows inside knees.", "Drive through the whole foot to stand."] },
    { name: "Bodyweight squat", equip: ALL, loads: ["knee", "hip"], howTo: ["Feet shoulder-width, toes slightly out.", "Sit hips back and down until thighs are near parallel.", "Keep chest up and knees tracking over toes, then stand."] },
    { name: "Box squat to a high seat", equip: ALL, loads: ["hip"], howTo: ["Stand in front of a sturdy chair or box at knee height or higher.", "Sit back slowly until you lightly touch it, then stand.", "Stay in a pain-free range; raise the seat if your knees complain."], cue: "Partial range keeps knee load low. Pain should stay at 2/10 or less." },
    { name: "Glute bridge", equip: ALL, loads: [], howTo: ["Lie on your back, knees bent, feet flat.", "Push through heels to lift hips into a straight line.", "Squeeze glutes for 1 second, lower slowly."] },
  ],
  hinge: [
    { name: "Romanian deadlift", equip: GYM, loads: ["back", "hip"], howTo: ["Barbell at hip height, soft knees.", "Hinge at the hips, bar close to legs, back flat.", "Return by driving hips forward."] },
    { name: "Dumbbell Romanian deadlift", equip: KIT, loads: ["back", "hip"], howTo: ["Stand tall with dumbbells at thighs.", "Push hips back with a slight knee bend; weights slide down legs.", "Stop at a hamstring stretch, then stand."] },
    { name: "Hip thrust", equip: GYM, loads: ["hip"], howTo: ["Upper back on a bench, bar or dumbbell over your hips (use a pad).", "Drive through heels until hips are level with knees and shoulders.", "Pause, then lower under control."] },
    { name: "Glute bridge", equip: ALL, loads: [], howTo: ["Lie on your back, knees bent, feet flat.", "Push through heels to lift hips into a straight line.", "Squeeze glutes for 1 second, lower slowly."] },
    { name: "Bird dog", equip: ALL, loads: [], howTo: ["On hands and knees, back flat.", "Reach one arm forward and the opposite leg back without twisting.", "Hold 2 seconds, return, switch sides."] },
  ],
  hpush: [
    { name: "Bench press", equip: GYM, loads: ["shoulder", "wrist"], howTo: ["Eyes under the bar, shoulder blades pulled together.", "Lower to mid-chest under control.", "Press up; use a spotter or safety arms."] },
    { name: "Dumbbell floor press", equip: KIT, loads: ["shoulder"], howTo: ["Lie on the floor, dumbbells over chest.", "Lower until upper arms touch the floor.", "Press back up without locking hard."] },
    { name: "Neutral-grip dumbbell floor press", equip: KIT, loads: [], howTo: ["Lie on the floor holding dumbbells with palms facing each other.", "Lower until upper arms touch the floor; the floor limits the range.", "Press up smoothly."], cue: "Palms-in grip and floor-limited range are easier on shoulders and wrists." },
    { name: "Push-up", equip: ALL, loads: ["shoulder", "wrist"], howTo: ["Hands just wider than shoulders, body in a straight line.", "Lower chest toward the floor, elbows about 45° from body.", "Too hard? Put hands on a bench or wall."] },
    { name: "Wall push-up on fists", equip: ALL, loads: ["shoulder"], howTo: ["Stand at arm's length from a wall, fists against it at chest height.", "Bend elbows to bring your chest toward the wall.", "Push back; keep wrists straight."], cue: "Fists keep wrists straight." },
    { name: "Isometric chest squeeze", equip: ALL, loads: [], howTo: ["Press your palms together in front of your chest.", "Squeeze as hard as is comfortable for 10–20 seconds.", "Breathe normally throughout."], cue: "Builds strength with no joint movement." },
  ],
  hpull: [
    { name: "Seated cable row", equip: GYM, loads: [], howTo: ["Sit tall, slight knee bend.", "Pull handle to your stomach, squeezing shoulder blades.", "Return without rounding your back."] },
    { name: "One-arm dumbbell row", equip: KIT, loads: ["back"], howTo: ["One hand and knee on a bench or chair.", "Pull the dumbbell toward your hip.", "Keep shoulders level; lower slowly."] },
    { name: "Chest-supported dumbbell row", equip: KIT, loads: [], howTo: ["Lie face down on an incline bench with dumbbells hanging.", "Row both dumbbells toward your hips.", "Lower slowly; the bench supports your back."] },
    { name: "Backpack row", equip: ALL, loads: ["back"], howTo: ["Load a backpack with books.", "Hinge forward with a flat back.", "Pull the bag to your lower ribs, lower slowly."] },
    { name: "Superman row", equip: ALL, loads: [], howTo: ["Lie face down, arms overhead.", "Lift chest and arms slightly and pull elbows down to your sides.", "Reach forward again; keep the movement slow."] },
  ],
  vpush: [
    { name: "Overhead press", equip: GYM, loads: ["shoulder", "back"], howTo: ["Bar at collarbone, glutes tight.", "Press straight up, moving head back slightly.", "Lock out overhead, lower under control."] },
    { name: "Dumbbell overhead press", equip: KIT, loads: ["shoulder"], howTo: ["Dumbbells at shoulders, ribs down.", "Press overhead until arms are straight.", "Lower to shoulders with control."] },
    { name: "Pike push-up", equip: ALL, loads: ["shoulder", "wrist"], howTo: ["Start in a push-up, walk feet in so hips are high.", "Bend elbows to lower your head toward the floor.", "Press back up."] },
    { name: "Cable external rotation", equip: GYM, loads: [], howTo: ["Stand side-on to a cable at elbow height, elbow tucked at your side.", "Rotate your forearm outward away from your body.", "Return slowly. Use a light weight."], cue: "Strengthens the rotator cuff without overhead pressing." },
    { name: "Side-lying dumbbell external rotation", equip: KIT, loads: [], howTo: ["Lie on your side, top elbow bent 90° and tucked against your side.", "Rotate a light dumbbell up toward the ceiling.", "Lower slowly."], cue: "Strengthens the rotator cuff without overhead pressing." },
    { name: "Wall slide", equip: ALL, loads: [], howTo: ["Stand with back and forearms against a wall.", "Slide arms up only as far as is pain-free.", "Slide back down, keeping contact with the wall."], cue: "Stay in a pain-free range." },
  ],
  vpull: [
    { name: "Lat pulldown", equip: GYM, loads: ["shoulder"], howTo: ["Grip just wider than shoulders.", "Pull bar to upper chest, elbows down.", "Return slowly to full stretch."] },
    { name: "Dumbbell pullover", equip: KIT, loads: ["shoulder"], howTo: ["Lie across a bench holding one dumbbell over chest.", "Lower it behind your head with slightly bent arms.", "Pull back over your chest using your back."] },
    { name: "Straight-arm cable pulldown", equip: GYM, loads: [], howTo: ["Face a high cable, arms straight, slight hip hinge.", "Sweep the bar down to your thighs.", "Return only as high as is comfortable."] },
    { name: "Prone Y-T raise", equip: ALL, loads: [], howTo: ["Lie face down, arms overhead in a Y.", "Lift arms off the floor for 2 seconds.", "Repeat with arms out in a T."] },
  ],
  lunge: [
    { name: "Walking lunge", equip: GYM, loads: ["knee", "ankle", "hip"], howTo: ["Hold dumbbells at sides.", "Step forward into a lunge.", "Bring the back foot through into the next step."] },
    { name: "Dumbbell split squat", equip: KIT, loads: ["knee", "hip"], howTo: ["Staggered stance, dumbbells at sides.", "Lower until the back knee nearly touches the floor.", "Stand up; finish all reps then switch legs."] },
    { name: "Reverse lunge", equip: ALL, loads: ["knee", "hip", "ankle"], howTo: ["Step one foot back.", "Lower until both knees are near 90°.", "Push through the front heel to return."] },
    { name: "Step-up to a low step", equip: ALL, loads: ["knee", "ankle"], howTo: ["Use a step about mid-shin height.", "Step up, pressing through the whole front foot.", "Step down slowly; finish one leg, then switch."] },
    { name: "Cable hip abduction", equip: GYM, loads: [], howTo: ["Ankle strap on the outside leg, stand side-on to the cable.", "Lift the leg out to the side without leaning.", "Return slowly."] },
    { name: "Side-lying leg raise", equip: ALL, loads: [], howTo: ["Lie on your side, bottom knee bent for balance.", "Lift the top leg, toes pointing forward.", "Lower slowly; finish one side, then switch."] },
  ],
  calf: [
    { name: "Standing calf raise", equip: GYM, loads: ["ankle"], howTo: ["Shoulders under the pads.", "Rise onto toes, pause.", "Lower to a full stretch."] },
    { name: "Dumbbell calf raise", equip: KIT, loads: ["ankle"], howTo: ["Hold a dumbbell, stand on a step edge.", "Rise up, pause, lower slowly.", "One leg at a time for more challenge."] },
    { name: "Calf raise", equip: ALL, loads: ["ankle"], howTo: ["Stand on a step edge.", "Rise onto your toes, pause, lower below the step.", "Hold a wall for balance."] },
    { name: "Bird dog", equip: ALL, loads: [], howTo: ["On hands and knees, back flat.", "Reach one arm forward and the opposite leg back without twisting.", "Hold 2 seconds, return, switch sides."] },
  ],
  core: [
    { name: "Pallof press", equip: GYM, loads: [], howTo: ["Stand side-on to a cable at chest height.", "Press handle straight out and resist the twist.", "Hold 2 seconds, bring back in."] },
    { name: "Dead bug", equip: ALL, loads: [], howTo: ["Lie on your back, arms up, knees over hips.", "Lower opposite arm and leg while keeping lower back pressed down.", "Return and switch sides."] },
    { name: "Bird dog", equip: ALL, loads: [], howTo: ["On hands and knees, back flat.", "Reach one arm forward and the opposite leg back without twisting.", "Hold 2 seconds, return, switch sides."] },
  ],
  core2: [
    { name: "Hanging knee raise", equip: GYM, loads: ["shoulder", "back"], howTo: ["Hang from a bar.", "Lift knees toward chest without swinging.", "Lower slowly."] },
    { name: "Plank", equip: KIT, loads: ["shoulder"], howTo: ["Forearms on the floor, body straight.", "Squeeze glutes and brace your stomach.", "Hold without letting hips sag."] },
    { name: "Side plank", equip: ALL, loads: ["shoulder"], howTo: ["Elbow under shoulder, body in a straight line.", "Lift hips and hold.", "Drop to knees to make it easier."] },
    { name: "Dead bug", equip: ALL, loads: [], howTo: ["Lie on your back, arms up, knees over hips.", "Lower opposite arm and leg while keeping lower back pressed down.", "Return and switch sides."] },
    { name: "Bird dog", equip: ALL, loads: [], howTo: ["On hands and knees, back flat.", "Reach one arm forward and the opposite leg back without twisting.", "Hold 2 seconds, return, switch sides."] },
  ],
  chestFly: [
    { name: "Cable fly", equip: GYM, loads: ["shoulder"], howTo: ["Set both pulleys at chest height and step forward.", "With a slight bend in your elbows, bring your hands together in front of your chest.", "Open slowly until you feel a stretch across your chest."] },
    { name: "Dumbbell fly", equip: KIT, loads: ["shoulder"], howTo: ["Lie on a bench or the floor, dumbbells over your chest, palms facing.", "Lower them out to the sides with soft elbows.", "Stop at a comfortable stretch and squeeze back up."] },
    { name: "Slow-tempo push-up", equip: ALL, loads: ["shoulder", "wrist"], howTo: ["Push-up position, hands just wider than shoulders.", "Take 3 seconds to lower, pause 1 second near the floor.", "Push up. Use a bench or wall to make it easier."] },
    { name: "Isometric chest squeeze", equip: ALL, loads: [], howTo: ["Press your palms together in front of your chest.", "Squeeze as hard as is comfortable for 10–20 seconds.", "Breathe normally throughout."], cue: "Builds strength with no joint movement." },
  ],
  lateral: [
    { name: "Cable lateral raise", equip: GYM, loads: ["shoulder"], howTo: ["Stand side-on to a low cable, handle in the far hand.", "Raise your arm out to the side to shoulder height, elbow soft.", "Lower slowly."] },
    { name: "Dumbbell lateral raise", equip: KIT, loads: ["shoulder"], howTo: ["Stand tall with light dumbbells at your sides.", "Raise them out to shoulder height, leading with your elbows.", "Lower over 2–3 seconds."] },
    { name: "Water-bottle lateral raise", equip: ALL, loads: ["shoulder"], howTo: ["Hold a full water bottle or tin in each hand.", "Raise your arms out to shoulder height.", "Lower slowly; do more reps since the load is light."] },
    { name: "Wall slide", equip: ALL, loads: [], howTo: ["Stand with back and forearms against a wall.", "Slide arms up only as far as is pain-free.", "Slide back down, keeping contact with the wall."], cue: "Stay in a pain-free range." },
  ],
  rearDelt: [
    { name: "Face pull", equip: GYM, loads: [], howTo: ["Rope on a cable at face height.", "Pull the rope toward your forehead, hands finishing beside your ears.", "Squeeze your upper back, return slowly."] },
    { name: "Reverse dumbbell fly", equip: KIT, loads: ["back"], howTo: ["Hinge forward with a flat back, light dumbbells hanging.", "Raise them out to the sides, squeezing your shoulder blades.", "Lower slowly."] },
    { name: "Prone Y-T raise", equip: ALL, loads: [], howTo: ["Lie face down, arms overhead in a Y.", "Lift arms off the floor for 2 seconds.", "Repeat with arms out in a T."] },
  ],
  biceps: [
    { name: "Cable curl", equip: GYM, loads: ["wrist"], howTo: ["Stand facing a low cable with a straight bar.", "Curl the bar up, elbows pinned to your sides.", "Lower all the way down slowly."] },
    { name: "Dumbbell curl", equip: KIT, loads: ["wrist"], howTo: ["Stand with dumbbells at your sides, palms forward.", "Curl up without swinging your body.", "Lower over 2–3 seconds."] },
    { name: "Hammer curl", equip: KIT, loads: [], howTo: ["Hold dumbbells with palms facing each other.", "Curl up, elbows by your sides.", "Lower slowly."], cue: "Palms-in grip is easier on wrists and elbows." },
    { name: "Backpack curl", equip: ALL, loads: ["wrist"], howTo: ["Hold a loaded backpack by the top handle or both straps.", "Curl it toward your chest, elbows still.", "Lower slowly."] },
    { name: "Towel isometric curl", equip: ALL, loads: [], howTo: ["Stand on the middle of a towel, holding both ends.", "Pull up as if curling, elbows at 90°, and hold.", "Hold 20–30 seconds while breathing."], cue: "Builds strength with no joint movement." },
  ],
  triceps: [
    { name: "Cable triceps pushdown", equip: GYM, loads: ["wrist"], howTo: ["Rope or bar on a high cable, elbows at your sides.", "Push down until your arms are straight.", "Return slowly without letting your elbows drift forward."] },
    { name: "Overhead dumbbell extension", equip: KIT, loads: ["shoulder", "wrist"], howTo: ["Hold one dumbbell overhead with both hands.", "Lower it behind your head by bending your elbows.", "Straighten your arms to lift it back up."] },
    { name: "Close-grip push-up", equip: ALL, loads: ["shoulder", "wrist"], howTo: ["Push-up position with hands under your shoulders.", "Lower with elbows close to your sides.", "Use a bench or wall to make it easier."] },
    { name: "Bench dip", equip: ALL, loads: ["shoulder", "wrist"], howTo: ["Hands on a sturdy chair behind you, legs out front.", "Bend your elbows to lower a short way.", "Press back up. Stop if your shoulders ache."] },
  ],
  legCurl: [
    { name: "Seated or lying leg curl", equip: GYM, loads: ["knee"], howTo: ["Set the pad just above your heels.", "Curl your heels toward your glutes.", "Lower slowly over 2–3 seconds."] },
    { name: "Single-leg Romanian deadlift", equip: KIT, loads: ["back", "hip", "ankle"], howTo: ["Hold a dumbbell in the opposite hand to your standing leg.", "Hinge forward, the free leg reaching back, back flat.", "Stand up by squeezing the glute of the standing leg."] },
    { name: "Sliding leg curl", equip: ALL, loads: ["knee"], howTo: ["Lie on your back with heels on a towel on a smooth floor.", "Lift your hips, then slide your heels toward you.", "Slide them back out slowly; keep hips up if you can."] },
    { name: "Glute bridge", equip: ALL, loads: [], howTo: ["Lie on your back, knees bent, feet flat.", "Push through heels to lift hips into a straight line.", "Squeeze glutes for 1 second, lower slowly."] },
  ],
  quadIso: [
    { name: "Leg extension", equip: GYM, loads: ["knee"], howTo: ["Pad on your lower shins, knees in line with the machine pivot.", "Straighten your legs and squeeze your thighs.", "Lower slowly."] },
    { name: "Heels-elevated goblet squat", equip: KIT, loads: ["knee"], howTo: ["Heels on a small plate or book, dumbbell at your chest.", "Squat straight down with an upright torso.", "Stand up through the whole foot."] },
    { name: "Wall sit", equip: ALL, loads: ["knee"], howTo: ["Back against a wall, slide down until knees are near 90°.", "Hold with weight in your heels.", "Raise yourself higher if your knees complain."] },
    { name: "Box squat to a high seat", equip: ALL, loads: ["hip"], howTo: ["Stand in front of a sturdy chair or box at knee height or higher.", "Sit back slowly until you lightly touch it, then stand.", "Stay in a pain-free range; raise the seat if your knees complain."], cue: "Partial range keeps knee load low. Pain should stay at 2/10 or less." },
  ],
  glute: [
    { name: "Hip thrust", equip: GYM, loads: ["hip"], howTo: ["Upper back on a bench, bar or dumbbell over your hips (use a pad).", "Drive through heels until hips are level with knees and shoulders.", "Pause, then lower under control."] },
    { name: "Dumbbell hip thrust", equip: KIT, loads: ["hip"], howTo: ["Upper back on a sofa or bench, dumbbell on your hips.", "Drive your hips up until your body is straight from knees to shoulders.", "Pause 1 second at the top."] },
    { name: "Single-leg glute bridge", equip: ALL, loads: [], howTo: ["Lie on your back, one foot flat, the other leg straight.", "Push through the planted heel to lift your hips.", "Lower slowly; finish one side, then switch."] },
    { name: "Glute bridge", equip: ALL, loads: [], howTo: ["Lie on your back, knees bent, feet flat.", "Push through heels to lift hips into a straight line.", "Squeeze glutes for 1 second, lower slowly."] },
  ],
};

const HOLDS = new Set(["Plank", "Side plank", "Isometric chest squeeze", "Wall sit", "Towel isometric curl"]);

/** Every exercise name Stride knows, with its how-to steps. */
export const HOW_TO: Record<string, string[]> = Object.fromEntries(
  Object.values(CANDIDATES)
    .flat()
    .map((c) => [c.name, c.howTo]),
);
HOW_TO["Single-leg balance"] = ["Stand near a wall or counter.", "Lift one foot and hold for 20 seconds.", "Progress by closing your eyes or standing on a cushion."];

const TEMPLATES = {
  fullA: { title: "Full body A", patterns: ["squat", "hpush", "hpull", "hinge", "core"] as Pattern[] },
  fullB: { title: "Full body B", patterns: ["lunge", "vpush", "vpull", "hinge", "core2"] as Pattern[] },
  upper: { title: "Upper body", patterns: ["hpush", "hpull", "vpush", "vpull", "core"] as Pattern[] },
  lower: { title: "Lower body", patterns: ["squat", "hinge", "lunge", "calf", "core2"] as Pattern[] },
  cardio: { title: "Cardio", patterns: [] as Pattern[] },
};
type TemplateKey = keyof typeof TEMPLATES;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const SCHEDULE: Record<number, Partial<Record<Weekday, TemplateKey>>> = {
  2: { Mon: "fullA", Thu: "fullB" },
  3: { Mon: "fullA", Wed: "fullB", Fri: "fullA" },
  4: { Mon: "upper", Tue: "lower", Thu: "upper", Fri: "lower" },
  5: { Mon: "upper", Tue: "lower", Wed: "cardio", Fri: "upper", Sat: "lower" },
  6: { Mon: "upper", Tue: "lower", Wed: "cardio", Thu: "upper", Fri: "lower", Sat: "cardio" },
};

const DOSE = {
  beginner: { main: "2–3 × 10–12", accessory: "2 × 12–15", hold: "2 × 20–40 s", rest: "60–90 s" },
  intermediate: { main: "3–4 × 8–12", accessory: "3 × 10–15", hold: "3 × 30–45 s", rest: "90 s" },
  advanced: { main: "4 × 5–8", accessory: "3 × 10–15", hold: "3 × 45–60 s", rest: "2–3 min" },
};

export interface Exercise {
  name: string;
  prescription: string;
  howTo: string[];
  /** Coaching cue when the exercise was chosen to work around an injury. */
  cue?: string;
  /** True when another exercise exists that the user could swap to. */
  swappable: boolean;
}
export interface WorkoutDay {
  day: Weekday;
  type: "strength" | "cardio" | "rest";
  title: string;
  exercises: Exercise[];
  note: string;
}
export interface WorkoutPlan {
  days: WorkoutDay[];
  restBetweenSets: string;
  weeklyCardioMinutes: string;
  beforeSession: string[];
  progression: string[];
  /** Injury-specific advice shown above the plan. */
  injuryNotes: string[];
  /** Exercises the user swapped out, so they can restore them. */
  avoided: string[];
  /** Training focus the plan was built for. */
  focus: "general" | "recomp" | "muscle";
  /** Name of the split, e.g. "Push / pull / legs" (muscle-focused plans only). */
  splitName?: string;
  /** Weekly hard sets per muscle group (muscle-focused plans only). */
  volume: MuscleVolume[];
  /** Advice specific to the focus (recomp or muscle building). */
  focusNotes: string[];
}

export interface MuscleVolume {
  muscle: Muscle;
  label: string;
  /** Hard sets per week; indirect work (e.g. triceps in a bench press) counts as half a set. */
  sets: number;
  /** Sessions per week that train this muscle directly. */
  frequency: number;
  priority: boolean;
  /** Compared with the evidence-based range for growth: about 10–20 sets a week. */
  status: "low" | "good" | "high";
}

/** Picks the best exercise for a pattern given equipment, injuries and the avoid list. */
export function pickExercise(pattern: Pattern, p: Pick<Profile, "equipment" | "injuries" | "avoidExercises">): { pick: Candidate | null; alternatives: number } {
  const ok = CANDIDATES[pattern].filter(
    (c) => c.equip.includes(p.equipment) && !c.loads.some((a) => p.injuries.includes(a)) && !p.avoidExercises.includes(c.name),
  );
  return { pick: ok[0] ?? null, alternatives: ok.length - 1 };
}

const INJURY_ADVICE: Record<InjuryArea, string> = {
  knee: "Knees: squats and lunges are replaced with partial-range and hip-focused work. Avoid deep knee bends and jumping.",
  back: "Lower back: heavy spinal loading (barbell squats, deadlifts, overhead press) is replaced with supported movements. Brace your core and avoid rounding under load.",
  shoulder: "Shoulders: overhead pressing and hanging are replaced with rotator-cuff work and pain-free ranges.",
  wrist: "Wrists / elbows: push-ups and barbell pressing are swapped for neutral-grip or fist-based options.",
  hip: "Hips: deep squats, lunges and deadlifts are replaced with glute bridges and side-lying work.",
  ankle: "Ankles / feet: lunges and calf raises are replaced, and cardio is kept low impact.",
};

function injuryNotesFor(p: Profile): string[] {
  const notes = p.injuries.map((a) => INJURY_ADVICE[a]);
  if (p.injuries.length) {
    notes.push(
      "Mild discomfort (up to 2 out of 10) that settles within 24 hours is usually OK. Stop if pain is sharp, gets worse during a set, or is worse the next day.",
      `A physiotherapist can tailor this further for your ${p.injuries.map((a) => INJURY_LABEL[a].toLowerCase()).join(" and ")}.`,
    );
  }
  return notes;
}

const BEFORE_SESSION = [
  "5 minutes of light cardio, then 1–2 lighter sets of your first exercise.",
  "Stop any exercise that causes sharp pain.",
  "Stop and get help for chest pain, dizziness, or unusual shortness of breath.",
];

export function buildWorkouts(p: Profile, n: Numbers): WorkoutPlan {
  if (n.focus !== "general") return buildMusclePlan(p, n);
  const dose = DOSE[p.experience];
  const schedule = SCHEDULE[p.daysPerWeek] ?? SCHEDULE[3];
  const lowImpact = p.lowImpact || p.injuries.some((a) => a === "knee" || a === "ankle" || a === "hip" || a === "back");
  const cardioKinds = lowImpact ? "cycle, swim, use an elliptical or walk on flat ground" : "brisk walk, jog, cycle or swim";
  const cardio =
    n.goal === "lose"
      ? { afterLift: 20, session: 40, weekly: "150–300" }
      : n.goal === "gain"
        ? { afterLift: 0, session: 20, weekly: "60–90" }
        : { afterLift: 10, session: 30, weekly: "150" };

  const days: WorkoutDay[] = WEEKDAYS.map((day) => {
    const key = schedule[day];
    if (!key) {
      const note =
        n.goal === "gain"
          ? "Rest, or an easy 20-minute walk."
          : p.activity === "sedentary"
            ? "Walk 25–30 min at an easy pace. Add 5 min each week."
            : `${cardio.session} min: ${cardioKinds}.`;
      return { day, type: "rest", title: day === "Sun" ? "Rest" : "Active recovery", exercises: [], note };
    }
    if (key === "cardio") {
      const note =
        p.experience === "beginner"
          ? `${cardio.session} min steady cardio (${cardioKinds}). You should be able to talk but not sing.`
          : `Intervals${lowImpact ? " on a bike or elliptical" : ""}: 5 min warm-up, then 6–8 rounds of 1 min hard / 2 min easy, 5 min cool-down.`;
      return { day, type: "cardio", title: "Cardio", exercises: [], note };
    }
    const t = TEMPLATES[key];
    const exercises: Exercise[] = [];
    const used = new Set<string>();
    t.patterns.forEach((pattern, i) => {
      // Don't repeat the same fallback exercise twice in one session.
      const { pick } = pickExercise(pattern, { ...p, avoidExercises: [...p.avoidExercises, ...used] });
      if (!pick) return;
      used.add(pick.name);
      exercises.push({
        name: pick.name,
        prescription: HOLDS.has(pick.name) ? dose.hold : i < 3 ? dose.main : dose.accessory,
        howTo: pick.howTo,
        cue: pick.cue,
        swappable: pickExercise(pattern, { ...p, avoidExercises: [...p.avoidExercises, ...used] }).pick !== null,
      });
    });
    if (p.age >= 65) exercises.push({ name: "Single-leg balance", prescription: "3 × 20 s/leg", howTo: HOW_TO["Single-leg balance"], swappable: false });
    return {
      day,
      type: "strength",
      title: t.title,
      exercises,
      note: cardio.afterLift ? `Finish with ${cardio.afterLift} min easy cardio.` : "",
    };
  });

  const injuryNotes = injuryNotesFor(p);

  return {
    days,
    restBetweenSets: dose.rest,
    weeklyCardioMinutes: cardio.weekly,
    beforeSession: BEFORE_SESSION,
    progression: [
      "Pick a weight where the last 2–3 reps are hard but your form holds.",
      "When you hit the top of the rep range on every set, add a little weight or a harder variation.",
      p.experience === "beginner" ? "Start with the lower set number for 2–3 weeks." : "Every 6–8 weeks, take a lighter week at about half the sets.",
    ],
    injuryNotes,
    avoided: p.avoidExercises,
    focus: "general",
    volume: [],
    focusNotes: [],
  };
}

/* ------------------------------------------------------------------ */
/* Muscle-building and body recomposition plans                        */
/* ------------------------------------------------------------------ */

/** Muscles each pattern works. 1 = direct work, 0.5 = indirect (counted as half a set). */
const PATTERN_MUSCLES: Record<Pattern, Partial<Record<Muscle, number>>> = {
  squat: { quads: 1, glutes: 0.5 },
  hinge: { hamstrings: 1, glutes: 1 },
  lunge: { quads: 1, glutes: 1 },
  hpush: { chest: 1, shoulders: 0.5, arms: 0.5 },
  vpush: { shoulders: 1, arms: 0.5 },
  hpull: { back: 1, arms: 0.5 },
  vpull: { back: 1, arms: 0.5 },
  calf: { calves: 1 },
  core: { core: 1 },
  core2: { core: 1 },
  chestFly: { chest: 1 },
  lateral: { shoulders: 1 },
  rearDelt: { shoulders: 0.5, back: 0.5 },
  biceps: { arms: 1 },
  triceps: { arms: 1 },
  legCurl: { hamstrings: 1 },
  quadIso: { quads: 1 },
  glute: { glutes: 1 },
};

/** Safer fallback exercises don't always train the pattern's main muscle; count what they actually work. */
const EXERCISE_MUSCLES: Record<string, Partial<Record<Muscle, number>>> = {
  "Glute bridge": { glutes: 1, hamstrings: 0.5 },
  "Single-leg glute bridge": { glutes: 1, hamstrings: 0.5 },
  "Bird dog": { core: 1 },
  "Dead bug": { core: 1 },
  "Wall slide": { shoulders: 0.5 },
  "Isometric chest squeeze": { chest: 0.5 },
  "Towel isometric curl": { arms: 0.5 },
  "Prone Y-T raise": { shoulders: 0.5, back: 0.5 },
  "Superman row": { back: 0.5 },
  "Side-lying leg raise": { glutes: 1 },
  "Cable hip abduction": { glutes: 1 },
  "Cable external rotation": { shoulders: 0.5 },
  "Side-lying dumbbell external rotation": { shoulders: 0.5 },
  "Hip thrust": { glutes: 1, hamstrings: 0.5 },
  "Straight-arm cable pulldown": { back: 1 },
};

/** Extra work added for a priority muscle, in order of preference. */
const PRIORITY_PATTERNS: Record<Muscle, Pattern[]> = {
  chest: ["chestFly", "hpush"],
  back: ["hpull", "vpull"],
  shoulders: ["lateral", "vpush"],
  arms: ["biceps", "triceps"],
  glutes: ["glute"],
  quads: ["quadIso", "squat"],
  hamstrings: ["legCurl", "hinge"],
  calves: ["calf"],
  core: ["core", "core2"],
};

interface Session {
  title: string;
  patterns: Pattern[];
}
const S: Record<string, Session> = {
  fullA: { title: "Full body A", patterns: ["squat", "hpush", "hpull", "hinge", "lateral", "core"] },
  fullB: { title: "Full body B", patterns: ["lunge", "vpush", "vpull", "legCurl", "biceps", "triceps"] },
  fullC: { title: "Full body C", patterns: ["glute", "hpush", "vpull", "quadIso", "rearDelt", "core2"] },
  upperA: { title: "Upper A", patterns: ["hpush", "hpull", "vpush", "vpull", "lateral", "biceps", "triceps"] },
  lowerA: { title: "Lower A", patterns: ["squat", "hinge", "lunge", "legCurl", "calf", "core"] },
  upperB: { title: "Upper B", patterns: ["vpull", "hpush", "hpull", "chestFly", "lateral", "rearDelt", "triceps", "biceps"] },
  lowerB: { title: "Lower B", patterns: ["hinge", "glute", "quadIso", "legCurl", "calf", "core2"] },
  push: { title: "Push · chest, shoulders, triceps", patterns: ["hpush", "vpush", "chestFly", "lateral", "triceps"] },
  pull: { title: "Pull · back, biceps", patterns: ["vpull", "hpull", "rearDelt", "biceps", "core2"] },
  legs: { title: "Legs · quads, glutes, hamstrings", patterns: ["squat", "hinge", "lunge", "legCurl", "calf"] },
  legsB: { title: "Legs B · glutes, hamstrings", patterns: ["hinge", "glute", "quadIso", "legCurl", "calf", "core"] },
};

const DAY_SLOTS: Record<number, Weekday[]> = {
  2: ["Mon", "Thu"],
  3: ["Mon", "Wed", "Fri"],
  4: ["Mon", "Tue", "Thu", "Fri"],
  5: ["Mon", "Tue", "Wed", "Fri", "Sat"],
  6: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

function resolveSplit(split: Split, days: number): Exclude<Split, "auto"> {
  if (split === "ppl" && days < 3) return "full";
  if (split !== "auto") return split;
  return days <= 3 ? "full" : days === 4 ? "upperLower" : "ppl";
}

function sessionsFor(split: Exclude<Split, "auto">, days: number): Session[] {
  if (split === "full") return Array.from({ length: days }, (_, i) => [S.fullA, S.fullB, S.fullC][i % 3]);
  if (split === "upperLower") return Array.from({ length: days }, (_, i) => [S.upperA, S.lowerA, S.upperB, S.lowerB][i % 4]);
  // Push / pull / legs. Five days adds an upper and lower day so everything is trained twice.
  if (days === 3) return [S.push, S.pull, S.legs];
  if (days === 4) return [S.push, S.pull, S.legs, S.upperA];
  if (days === 5) return [S.push, S.pull, S.legs, S.upperB, S.lowerB];
  return [S.push, S.pull, S.legs, S.push, S.pull, S.legsB];
}

const SPLIT_NAME: Record<Exclude<Split, "auto">, string> = {
  full: "Full body",
  upperLower: "Upper / lower",
  ppl: "Push / pull / legs",
};

/** Hypertrophy doses: moderate reps, most sets taken within 1–3 reps of failure. */
const HYPER = {
  beginner: { main: [3, "3 × 8–12"], acc: [2, "2 × 12–15"], hold: "2 × 20–40 s" },
  intermediate: { main: [3, "3 × 6–12"], acc: [3, "3 × 10–15"], hold: "3 × 30–45 s" },
  advanced: { main: [4, "4 × 6–10"], acc: [3, "3 × 10–15"], hold: "3 × 45–60 s" },
} as const;

const COMPOUND = new Set<Pattern>(["squat", "hinge", "lunge", "hpush", "vpush", "hpull", "vpull", "glute"]);

/**
 * Orders a session so priority muscles are trained first while you're fresh, and adds one extra
 * exercise for each priority muscle the session works.
 */
function prioritise(patterns: Pattern[], priorities: Muscle[]): { patterns: Pattern[]; extra: Set<Pattern> } {
  const list = [...patterns];
  /** Patterns that get one extra set. */
  const extra = new Set<Pattern>();
  /** Patterns added to the session for a priority muscle. */
  const added = new Set<Pattern>();
  const front: Pattern[] = [];
  for (const m of priorities) {
    const trains = list.some((pt) => (PATTERN_MUSCLES[pt][m] ?? 0) >= 1);
    if (!trains) continue;
    // Bring this muscle's main exercise forward.
    const main = list.find((pt) => (PATTERN_MUSCLES[pt][m] ?? 0) >= 1 && !front.includes(pt));
    if (main) front.push(main);
    // If the session already has isolation work for it, that gets an extra set; otherwise add one exercise.
    const iso = m === "arms" ? (["biceps", "triceps"] as Pattern[]) : [PRIORITY_PATTERNS[m][0]];
    const present = iso.filter((pt) => list.includes(pt));
    if (present.length) {
      for (const pt of present) {
        extra.add(pt);
        if (!front.includes(pt)) front.push(pt);
      }
      continue;
    }
    const add = PRIORITY_PATTERNS[m].find((pt) => !list.includes(pt) && !added.has(pt));
    if (add) {
      added.add(add);
      front.push(add);
    } else if (main) {
      extra.add(main); // nothing new to add: one more set of the main exercise instead
    }
  }
  // Big lifts first (priority ones leading), then isolation work (priority ones leading).
  const rest = list.filter((pt) => !front.includes(pt));
  const ordered = [
    ...front.filter((pt) => COMPOUND.has(pt)),
    ...rest.filter((pt) => COMPOUND.has(pt)),
    ...front.filter((pt) => !COMPOUND.has(pt)),
    ...rest.filter((pt) => !COMPOUND.has(pt)),
  ];
  // Keep sessions to a sensible length: drop trailing non-priority accessories beyond 8.
  while (ordered.length > 8) {
    const i = ordered.map((pt, idx) => ({ pt, idx })).reverse().find(({ pt }) => !COMPOUND.has(pt) && !front.includes(pt))?.idx;
    if (i === undefined) break;
    ordered.splice(i, 1);
  }
  return { patterns: ordered, extra };
}

function buildMusclePlan(p: Profile, n: Numbers): WorkoutPlan {
  const dose = HYPER[p.experience];
  const split = resolveSplit(p.split, p.daysPerWeek);
  const sessions = sessionsFor(split, p.daysPerWeek);
  const slots = DAY_SLOTS[p.daysPerWeek] ?? DAY_SLOTS[3];
  const priorities = p.priorityMuscles;
  const lowImpact = p.lowImpact || p.injuries.some((a) => a === "knee" || a === "ankle" || a === "hip" || a === "back");
  const cardioKinds = lowImpact ? "cycle, swim, use an elliptical or walk on flat ground" : "brisk walk, cycle or swim";
  const recomp = n.focus === "recomp";

  const sets: Record<Muscle, number> = Object.fromEntries(Object.keys(MUSCLE_LABEL).map((m) => [m, 0])) as Record<Muscle, number>;
  const freq: Record<Muscle, number> = { ...sets };

  const days: WorkoutDay[] = WEEKDAYS.map((day) => {
    const idx = slots.indexOf(day);
    if (idx === -1) {
      const note = recomp ? `Rest, or ${p.activity === "sedentary" ? "a 25–30 min walk" : `30 min easy cardio: ${cardioKinds}`}. Daily steps help the fat-loss side of a recomp.` : "Rest. An easy 20–30 minute walk helps recovery.";
      return { day, type: "rest", title: day === "Sun" ? "Rest" : "Recovery", exercises: [], note };
    }
    const session = sessions[idx];
    const { patterns, extra } = prioritise(session.patterns, priorities);
    const exercises: Exercise[] = [];
    const used = new Set<string>();
    const trainedToday = new Set<Muscle>();
    patterns.forEach((pattern) => {
      const { pick } = pickExercise(pattern, { ...p, avoidExercises: [...p.avoidExercises, ...used] });
      if (!pick) return;
      used.add(pick.name);
      const isMain = COMPOUND.has(pattern);
      const [baseSets, label] = isMain ? dose.main : dose.acc;
      const bonus = extra.has(pattern) ? 1 : 0;
      const nSets = baseSets + bonus;
      const prescription = HOLDS.has(pick.name) ? dose.hold : bonus ? label.replace(/^\d+/, String(nSets)) : label;
      const hits = EXERCISE_MUSCLES[pick.name] ?? PATTERN_MUSCLES[pattern];
      for (const [m, w] of Object.entries(hits) as [Muscle, number][]) {
        sets[m] += nSets * w;
        if (w >= 1) trainedToday.add(m);
      }
      const isPriority = priorities.some((m) => (hits[m] ?? 0) >= 1);
      exercises.push({
        name: pick.name,
        prescription,
        howTo: pick.howTo,
        cue: pick.cue ?? (isPriority ? "Priority muscle: trained early while you're fresh." : undefined),
        swappable: pickExercise(pattern, { ...p, avoidExercises: [...p.avoidExercises, ...used] }).pick !== null,
      });
    });
    trainedToday.forEach((m) => (freq[m] += 1));
    if (p.age >= 65) exercises.push({ name: "Single-leg balance", prescription: "3 × 20 s/leg", howTo: HOW_TO["Single-leg balance"], swappable: false });
    return {
      day,
      type: "strength",
      title: session.title,
      exercises,
      note: recomp ? "Optional: finish with 10 min easy cardio." : "",
    };
  });

  const volume: MuscleVolume[] = (Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => {
    const v = Math.round(sets[m] * 2) / 2;
    return { muscle: m, label: MUSCLE_LABEL[m], sets: v, frequency: freq[m], priority: priorities.includes(m), status: v < 8 ? "low" : v > 24 ? "high" : "good" };
  });

  const focusNotes = recomp
    ? [
        "Body recomposition means losing fat and building muscle at the same time. It works best for beginners, people returning to training, and people with more body fat to lose.",
        `Eat ${n.proteinG[0]}–${n.proteinG[1]} g of protein a day, spread over your meals. High protein is what lets you build muscle in a small deficit.`,
        "The scale may barely move. Track your waist measurement, progress photos and the weights you lift instead.",
        "Sleep 7–9 hours. Short sleep shifts weight loss toward muscle instead of fat.",
      ]
    : [
        "Aim to gain about 0.25–0.5% of your body weight a week. Faster than that is mostly fat.",
        `Eat ${n.proteinG[0]}–${n.proteinG[1]} g of protein a day across 3–5 meals, about 0.4 g per kg in each.`,
        "Muscle grows from progressive overload: add a rep or a little weight each week while keeping good form.",
        "Weigh yourself a few mornings a week and look at the weekly average, not single days.",
      ];
  focusNotes.push(
    "Each muscle is trained about twice a week. That spreads your sets out so each session stays high quality; total weekly sets matter most.",
    "Aim for roughly 10–20 hard sets per muscle per week. Start near the low end and add sets only if you're recovering well.",
    "Take most sets to 1–3 reps short of failure: the last reps should be slow and hard, but your form holds.",
  );
  if (priorities.length) {
    focusNotes.push(`Your priority muscles (${priorities.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(", ")}) are trained first in each session and get an extra exercise or set.`);
  }
  if (p.split === "ppl" && p.daysPerWeek < 3) focusNotes.push("Push / pull / legs needs at least 3 days, so a full-body split is used instead.");

  return {
    days,
    restBetweenSets: "2–3 min on big lifts, 60–90 s on smaller ones",
    weeklyCardioMinutes: recomp ? "150" : "90–150",
    beforeSession: BEFORE_SESSION,
    progression: [
      "Work in a rep range (e.g. 8–12). When you hit the top on every set, add a little weight and drop back to the bottom.",
      "Log your weights and reps so you can beat them next week.",
      p.experience === "beginner" ? "Start with the lower set number for 2–3 weeks while you learn the movements." : "Every 5–8 weeks, take a lighter week at about half the sets to recover.",
    ],
    injuryNotes: injuryNotesFor(p),
    avoided: p.avoidExercises,
    focus: n.focus,
    splitName: SPLIT_NAME[split],
    volume,
    focusNotes,
  };
}
