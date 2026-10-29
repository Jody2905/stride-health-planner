import { INJURY_AREAS, INJURY_LABEL, LB_PER_KG, ProfileSchema, type InjuryArea, type Profile, type Units } from "@stride/engine";
import { useEffect, useState } from "react";

interface Draft {
  age: string;
  hcm: string;
  hft: string;
  hin: string;
  w: string;
  gw: string;
}

function toDraft(p: Profile, units: Units): Draft {
  const inches = p.heightCm / 2.54;
  const wt = (kg: number) => (units === "metric" ? String(+kg.toFixed(1)) : String(Math.round(kg * LB_PER_KG)));
  return {
    age: String(p.age),
    hcm: String(Math.round(p.heightCm)),
    hft: String(Math.floor(inches / 12)),
    hin: String(Math.round(inches % 12)),
    w: wt(p.weightKg),
    gw: wt(p.goalKg),
  };
}

const FIELD_LABEL: Record<string, string> = { age: "Age", heightCm: "Height", weightKg: "Weight", goalKg: "Goal weight" };

export function ProfileForm({ profile, units, onChange }: { profile: Profile; units: Units; onChange: (p: Profile) => void }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile, units));
  const [error, setError] = useState<string | null>(null);

  // Re-sync the text fields when units change. (The parent remounts this form via `key` when the
  // whole profile is replaced, e.g. after signing in.)
  useEffect(() => {
    setDraft(toDraft(profile, units));
    setError(null);
  }, [units]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitNumbers(next: Draft) {
    setDraft(next);
    const kg = (s: string) => (units === "metric" ? parseFloat(s) : parseFloat(s) / LB_PER_KG);
    const heightCm = units === "metric" ? parseFloat(next.hcm) : ((parseFloat(next.hft) || 0) * 12 + (parseFloat(next.hin) || 0)) * 2.54;
    const candidate = { ...profile, age: parseInt(next.age, 10), heightCm, weightKg: kg(next.w), goalKg: kg(next.gw) };
    const r = ProfileSchema.safeParse(candidate);
    if (r.success) {
      setError(null);
      onChange(r.data);
    } else {
      const issue = r.error.issues[0];
      const field = FIELD_LABEL[String(issue.path[0])] ?? "A field";
      setError(Number.isNaN(candidate[issue.path[0] as keyof Profile]) ? `${field} is needed.` : `${field} is outside the supported range.`);
    }
  }

  const num = (k: keyof Draft) => ({
    value: draft[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => commitNumbers({ ...draft, [k]: e.target.value }),
    type: "number",
    inputMode: "decimal" as const,
  });
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => onChange({ ...profile, [k]: v });
  const sel = <K extends keyof Profile>(k: K, numeric = false) => ({
    id: k,
    value: String(profile[k]),
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => set(k, (numeric ? Number(e.target.value) : e.target.value) as Profile[K]),
  });
  const wUnit = units === "metric" ? "kg" : "lb";
  const toggleInjury = (a: InjuryArea) =>
    set("injuries", profile.injuries.includes(a) ? profile.injuries.filter((x) => x !== a) : [...profile.injuries, a]);

  return (
    <form className="panel" onSubmit={(e) => e.preventDefault()} aria-label="Your profile">
      <h2>Your profile</h2>
      <div className="fields">
        <div className="f">
          <label htmlFor="sex">Sex</label>
          <select {...sel("sex")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Prefer not to say</option>
          </select>
        </div>
        <div className="f">
          <label htmlFor="age">Age</label>
          <input id="age" min={13} max={100} {...num("age")} />
        </div>
        {units === "metric" ? (
          <div className="f full">
            <label htmlFor="hcm">Height (cm)</label>
            <input id="hcm" {...num("hcm")} />
          </div>
        ) : (
          <div className="f full">
            <span className="lbl">Height (ft / in)</span>
            <div className="pair">
              <input id="hft" aria-label="Feet" {...num("hft")} />
              <input id="hin" aria-label="Inches" {...num("hin")} />
            </div>
          </div>
        )}
        <div className="f">
          <label htmlFor="w">Weight ({wUnit})</label>
          <input id="w" step="0.1" {...num("w")} />
        </div>
        <div className="f">
          <label htmlFor="gw">Goal weight ({wUnit})</label>
          <input id="gw" step="0.1" {...num("gw")} />
        </div>
        {error && (
          <p className="ferr" role="alert">
            {error}
          </p>
        )}
        <div className="f full">
          <label htmlFor="activity">Activity level (outside workouts)</label>
          <select {...sel("activity")}>
            <option value="sedentary">Sedentary · desk job, little walking</option>
            <option value="light">Lightly active · some walking daily</option>
            <option value="moderate">Moderately active · on your feet a lot</option>
            <option value="active">Very active · physical job</option>
            <option value="athlete">Extremely active · manual labour + sport</option>
          </select>
        </div>

        <div className="sep" />
        <div className="f">
          <label htmlFor="experience">Training experience</label>
          <select {...sel("experience")}>
            <option value="beginner">New / returning</option>
            <option value="intermediate">6–24 months</option>
            <option value="advanced">2+ years</option>
          </select>
        </div>
        <div className="f">
          <label htmlFor="daysPerWeek">Days per week</label>
          <select {...sel("daysPerWeek", true)}>
            {[2, 3, 4, 5, 6].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="f full">
          <label htmlFor="equipment">Equipment</label>
          <select {...sel("equipment")}>
            <option value="none">None · bodyweight at home</option>
            <option value="home">Dumbbells at home</option>
            <option value="gym">Full gym</option>
          </select>
        </div>

        <fieldset className="f full injuries">
          <legend className="lbl">Injuries or limitations</legend>
          <div className="chips">
            {INJURY_AREAS.map((a) => (
              <label key={a} className="chip">
                <input type="checkbox" id={`inj-${a}`} checked={profile.injuries.includes(a)} onChange={() => toggleInjury(a)} />
                {INJURY_LABEL[a]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="check">
          <input type="checkbox" id="lowImpact" checked={profile.lowImpact} onChange={(e) => set("lowImpact", e.target.checked)} /> Low-impact cardio only (no
          running or jumping)
        </label>

        <div className="sep" />
        <div className="f">
          <label htmlFor="diet">Diet</label>
          <select {...sel("diet")}>
            <option value="omni">Eat everything</option>
            <option value="veg">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>
        <div className="f">
          <label htmlFor="cuisine">Food style</label>
          <select {...sel("cuisine")}>
            <option value="general">General</option>
            <option value="caribbean">Caribbean</option>
          </select>
        </div>
        <div className="f">
          <label htmlFor="mealsPerDay">Meals a day</label>
          <select {...sel("mealsPerDay", true)}>
            <option value="3">3 meals</option>
            <option value="4">3 + 1 snack</option>
            <option value="5">3 + 2 snacks</option>
          </select>
        </div>
        <div className="f">
          <label htmlFor="fish">Oily fish</label>
          <select {...sel("fish")}>
            <option value="rare">Rarely</option>
            <option value="some">Once a week</option>
            <option value="often">2+ times a week</option>
          </select>
        </div>
        <label className="check half">
          <input type="checkbox" id="dairyFree" checked={profile.dairyFree} onChange={(e) => set("dairyFree", e.target.checked)} /> Dairy-free
        </label>
        <label className="check half">
          <input type="checkbox" id="glutenFree" checked={profile.glutenFree} onChange={(e) => set("glutenFree", e.target.checked)} /> Gluten-free
        </label>
        <div className="f full">
          <label htmlFor="sun">Midday sun on bare skin</label>
          <select {...sel("sun")}>
            <option value="low">Little · mostly indoors</option>
            <option value="some">Some days</option>
            <option value="high">Most days</option>
          </select>
        </div>

        <div className="sep" />
        {profile.sex !== "male" && (
          <label className="check">
            <input type="checkbox" id="pregnant" checked={profile.pregnant} onChange={(e) => set("pregnant", e.target.checked)} /> Pregnant,
            breastfeeding, or trying to conceive
          </label>
        )}
        <label className="check">
          <input type="checkbox" id="condition" checked={profile.condition} onChange={(e) => set("condition", e.target.checked)} /> I have a
          heart, kidney, liver or blood-pressure condition, diabetes, or take regular medication
        </label>
      </div>
    </form>
  );
}
