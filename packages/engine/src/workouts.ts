import type { Numbers } from "./calc";
import type { Profile } from "./types";

type Pattern = "squat" | "hinge" | "hpush" | "hpull" | "vpush" | "vpull" | "lunge" | "core" | "core2" | "calf";

const EXERCISES: Record<Pattern, Record<Profile["equipment"], string>> = {
  squat: { none: "Bodyweight squat", home: "Goblet squat", gym: "Barbell back squat" },
  hinge: { none: "Glute bridge", home: "Dumbbell Romanian deadlift", gym: "Romanian deadlift" },
  hpush: { none: "Push-up", home: "Dumbbell floor press", gym: "Bench press" },
  hpull: { none: "Backpack row", home: "One-arm dumbbell row", gym: "Seated cable row" },
  vpush: { none: "Pike push-up", home: "Dumbbell overhead press", gym: "Overhead press" },
  vpull: { none: "Prone Y-T raise", home: "Dumbbell pullover", gym: "Lat pulldown" },
  lunge: { none: "Reverse lunge", home: "Dumbbell split squat", gym: "Walking lunge" },
  core: { none: "Dead bug", home: "Dead bug", gym: "Pallof press" },
  core2: { none: "Side plank", home: "Plank", gym: "Hanging knee raise" },
  calf: { none: "Calf raise", home: "Dumbbell calf raise", gym: "Standing calf raise" },
};

export const HOW_TO: Record<string, string[]> = {
  "Bodyweight squat": ["Feet shoulder-width, toes slightly out.", "Sit hips back and down until thighs are near parallel.", "Keep chest up and knees tracking over toes, then stand."],
  "Goblet squat": ["Hold one dumbbell at your chest.", "Squat down between your knees, elbows inside knees.", "Drive through the whole foot to stand."],
  "Barbell back squat": ["Bar on upper back, brace your core.", "Sit down to at least parallel with a neutral spine.", "Use safety pins or a spotter."],
  "Glute bridge": ["Lie on your back, knees bent, feet flat.", "Push through heels to lift hips into a straight line.", "Squeeze glutes for 1 second, lower slowly."],
  "Dumbbell Romanian deadlift": ["Stand tall with dumbbells at thighs.", "Push hips back with a slight knee bend; weights slide down legs.", "Stop at a hamstring stretch, then stand."],
  "Romanian deadlift": ["Barbell at hip height, soft knees.", "Hinge at the hips, bar close to legs, back flat.", "Return by driving hips forward."],
  "Push-up": ["Hands just wider than shoulders, body in a straight line.", "Lower chest toward the floor, elbows about 45° from body.", "Too hard? Put hands on a bench or wall."],
  "Dumbbell floor press": ["Lie on the floor, dumbbells over chest.", "Lower until upper arms touch the floor.", "Press back up without locking hard."],
  "Bench press": ["Eyes under the bar, shoulder blades pulled together.", "Lower to mid-chest under control.", "Press up; use a spotter or safety arms."],
  "Backpack row": ["Load a backpack with books.", "Hinge forward with a flat back.", "Pull the bag to your lower ribs, lower slowly."],
  "One-arm dumbbell row": ["One hand and knee on a bench or chair.", "Pull the dumbbell toward your hip.", "Keep shoulders level; lower slowly."],
  "Seated cable row": ["Sit tall, slight knee bend.", "Pull handle to your stomach, squeezing shoulder blades.", "Return without rounding your back."],
  "Pike push-up": ["Start in a push-up, walk feet in so hips are high.", "Bend elbows to lower your head toward the floor.", "Press back up."],
  "Dumbbell overhead press": ["Dumbbells at shoulders, ribs down.", "Press overhead until arms are straight.", "Lower to shoulders with control."],
  "Overhead press": ["Bar at collarbone, glutes tight.", "Press straight up, moving head back slightly.", "Lock out overhead, lower under control."],
  "Prone Y-T raise": ["Lie face down, arms overhead in a Y.", "Lift arms off the floor for 2 seconds.", "Repeat with arms out in a T."],
  "Dumbbell pullover": ["Lie across a bench holding one dumbbell over chest.", "Lower it behind your head with slightly bent arms.", "Pull back over your chest using your back."],
  "Lat pulldown": ["Grip just wider than shoulders.", "Pull bar to upper chest, elbows down.", "Return slowly to full stretch."],
  "Reverse lunge": ["Step one foot back.", "Lower until both knees are near 90°.", "Push through the front heel to return."],
  "Dumbbell split squat": ["Staggered stance, dumbbells at sides.", "Lower until the back knee nearly touches the floor.", "Stand up; finish all reps then switch legs."],
  "Walking lunge": ["Hold dumbbells at sides.", "Step forward into a lunge.", "Bring the back foot through into the next step."],
  "Dead bug": ["Lie on your back, arms up, knees over hips.", "Lower opposite arm and leg while keeping lower back pressed down.", "Return and switch sides."],
  "Pallof press": ["Stand side-on to a cable at chest height.", "Press handle straight out and resist the twist.", "Hold 2 seconds, bring back in."],
  "Side plank": ["Elbow under shoulder, body in a straight line.", "Lift hips and hold.", "Drop to knees to make it easier."],
  Plank: ["Forearms on the floor, body straight.", "Squeeze glutes and brace your stomach.", "Hold without letting hips sag."],
  "Hanging knee raise": ["Hang from a bar.", "Lift knees toward chest without swinging.", "Lower slowly."],
  "Calf raise": ["Stand on a step edge.", "Rise onto your toes, pause, lower below the step.", "Hold a wall for balance."],
  "Dumbbell calf raise": ["Hold a dumbbell, stand on a step edge.", "Rise up, pause, lower slowly.", "One leg at a time for more challenge."],
  "Standing calf raise": ["Shoulders under the pads.", "Rise onto toes, pause.", "Lower to a full stretch."],
  "Single-leg balance": ["Stand near a wall or counter.", "Lift one foot and hold for 20 seconds.", "Progress by closing your eyes or standing on a cushion."],
};

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
}

export function buildWorkouts(p: Profile, n: Numbers): WorkoutPlan {
  const dose = DOSE[p.experience];
  const schedule = SCHEDULE[p.daysPerWeek] ?? SCHEDULE[3];
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
            ? "Brisk walk, 25–30 min. Add 5 min each week."
            : `Brisk walk, cycle or swim, ${cardio.session} min.`;
      return { day, type: "rest", title: day === "Sun" ? "Rest" : "Active recovery", exercises: [], note };
    }
    if (key === "cardio") {
      const note =
        p.experience === "beginner"
          ? `${cardio.session} min steady cardio. You should be able to talk but not sing.`
          : "Intervals: 5 min warm-up, then 6–8 rounds of 1 min hard / 2 min easy, 5 min cool-down.";
      return { day, type: "cardio", title: "Cardio", exercises: [], note };
    }
    const t = TEMPLATES[key];
    const exercises: Exercise[] = t.patterns.map((pattern, i) => {
      const name = EXERCISES[pattern][p.equipment];
      const isHold = name === "Plank" || name === "Side plank";
      return { name, prescription: isHold ? dose.hold : i < 3 ? dose.main : dose.accessory, howTo: HOW_TO[name] ?? [] };
    });
    if (p.age >= 65) exercises.push({ name: "Single-leg balance", prescription: "3 × 20 s/leg", howTo: HOW_TO["Single-leg balance"] });
    return {
      day,
      type: "strength",
      title: t.title,
      exercises,
      note: cardio.afterLift ? `Finish with ${cardio.afterLift} min easy cardio.` : "",
    };
  });

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
      p.experience === "beginner"
        ? "Start with the lower set number for 2–3 weeks."
        : "Every 6–8 weeks, take a lighter week at about half the sets.",
    ],
  };
}
