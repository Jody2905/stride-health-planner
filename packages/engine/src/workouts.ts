import type { Numbers } from "./calc";
import { INJURY_LABEL, type InjuryArea, type Profile } from "./types";

type Pattern = "squat" | "hinge" | "hpush" | "hpull" | "vpush" | "vpull" | "lunge" | "core" | "core2" | "calf";
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
};

const HOLDS = new Set(["Plank", "Side plank", "Isometric chest squeeze"]);

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

export function buildWorkouts(p: Profile, n: Numbers): WorkoutPlan {
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

  const injuryNotes = p.injuries.map((a) => INJURY_ADVICE[a]);
  if (p.injuries.length) {
    injuryNotes.push(
      "Mild discomfort (up to 2 out of 10) that settles within 24 hours is usually OK. Stop if pain is sharp, gets worse during a set, or is worse the next day.",
      `A physiotherapist can tailor this further for your ${p.injuries.map((a) => INJURY_LABEL[a].toLowerCase()).join(" and ")}.`,
    );
  }

  return {
    days,
    restBetweenSets: dose.rest,
    weeklyCardioMinutes: cardio.weekly,
    beforeSession: [
      "5 minutes of light cardio, then 1–2 lighter sets of your first exercise.",
      "Stop any exercise that causes sharp pain.",
      "Stop and get help for chest pain, dizziness, or unusual shortness of breath.",
    ],
    progression: [
      "Pick a weight where the last 2–3 reps are hard but your form holds.",
      "When you hit the top of the rep range on every set, add a little weight or a harder variation.",
      p.experience === "beginner" ? "Start with the lower set number for 2–3 weeks." : "Every 6–8 weeks, take a lighter week at about half the sets.",
    ],
    injuryNotes,
    avoided: p.avoidExercises,
  };
}
