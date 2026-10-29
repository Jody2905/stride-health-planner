import { buildPlan, DEFAULT_PROFILE, ProfileSchema, type Profile, type Units } from "@stride/engine";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, apiStore, DEMO, local, localStore, type ProgressStore, type StepEntry, type User, type WeightEntry, type WorkoutEntry } from "./api";
import { AccountMenu, AuthDialog } from "./components/Account";
import { ProfileForm } from "./components/ProfileForm";
import { isoToday } from "./format";
import { Groceries } from "./views/Groceries";
import { Health, Research } from "./views/Health";
import { Nutrition } from "./views/Nutrition";
import { Overview } from "./views/Overview";
import { Progress } from "./views/Progress";
import { Supplements } from "./views/Supplements";
import { Walking } from "./views/Walking";
import { Workouts } from "./views/Workouts";

const TABS = [
  ["overview", "Overview"],
  ["workouts", "Workouts"],
  ["nutrition", "Nutrition"],
  ["groceries", "Meals & groceries"],
  ["supplements", "Supplements"],
  ["walking", "Walking"],
  ["progress", "Progress"],
  ["health", "Daily health"],
  ["research", "Research"],
] as const;
type Tab = (typeof TABS)[number][0];

const tabFromHash = (): Tab => {
  const h = location.hash.slice(1);
  return (TABS.find(([k]) => k === h)?.[0] ?? "overview") as Tab;
};

function loadLocalProfile(): Profile {
  const r = ProfileSchema.safeParse({ ...DEFAULT_PROFILE, ...local.get<Partial<Profile>>("profile", {}) });
  return r.success ? r.data : DEFAULT_PROFILE;
}

export default function App() {
  const [profile, setProfile] = useState<Profile>(loadLocalProfile);
  const [units, setUnits] = useState<Units>(() => local.get<Units>("units", "metric"));
  const [user, setUser] = useState<User | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [variant, setVariant] = useState(0);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [steps, setSteps] = useState<StepEntry[]>([]);
  const [auth, setAuth] = useState<null | "signin" | "register">(null);
  const [saveState, setSaveState] = useState<"" | "saving" | "saved" | "error">("");
  const store: ProgressStore = user ? apiStore : localStore;
  const saveTimer = useRef<number>();

  const plan = useMemo(() => buildPlan(profile, { units, mealVariant: variant }), [profile, units, variant]);

  const loadLogs = useCallback(async (s: ProgressStore) => {
    const [w, k, st] = await Promise.all([s.weights(), s.workouts(), s.steps()]);
    setWeights(w);
    setWorkouts(k);
    setSteps(st);
  }, []);

  // Restore session on load (full-stack build only).
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    if (DEMO) {
      loadLogs(localStore);
    } else {
      api
        .me()
        .then(async (r) => {
          setUser(r.user);
          if (r.profile) {
            setProfile(r.profile);
            setUnits(r.units);
            setFormKey((k) => k + 1);
          }
          await loadLogs(apiStore);
        })
        .catch(() => loadLogs(localStore));
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, [loadLogs]);

  // Persist profile: to the browser for guests, to the server (debounced) when signed in.
  // Signed-in data is never written to localStorage, so nothing is left behind on a shared computer.
  useEffect(() => {
    if (!user) {
      local.set("profile", profile);
      local.set("units", units);
      return;
    }
    setSaveState("saving");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api
        .saveProfile(profile, units)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 600);
  }, [profile, units, user]);

  function selectTab(t: Tab) {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  }

  async function handleAuth(mode: "signin" | "register", name: string, email: string, password: string) {
    const r = mode === "register" ? await api.register(name, email, password) : await api.login(email, password);
    const me = await api.me();
    if (mode === "register" || !me.profile) {
      // Bring the guest profile and any locally logged progress into the new account.
      await api.saveProfile(profile, units);
      for (const w of await localStore.weights()) await apiStore.addWeight(w);
      for (const w of await localStore.workouts()) await apiStore.addWorkout(w);
      for (const st of await localStore.steps()) await apiStore.addSteps(st);
    } else {
      setProfile(me.profile);
      setUnits(me.units);
      setFormKey((k) => k + 1);
    }
    setUser(r.user);
    await loadLogs(apiStore);
    setAuth(null);
  }

  async function backToGuest() {
    setUser(null);
    setSaveState("");
    setProfile(loadLocalProfile());
    setUnits(local.get<Units>("units", "metric"));
    setFormKey((k) => k + 1);
    await loadLogs(localStore);
  }

  async function signOut() {
    await api.logout().catch(() => {});
    await backToGuest();
  }

  async function deleteAccount() {
    await api.deleteAccount();
    await backToGuest();
  }

  async function toggleToday(title: string, done: boolean) {
    setWorkouts(done ? await store.addWorkout({ date: isoToday(), title }) : await store.deleteWorkout(isoToday()));
  }

  const avoid = (name: string) => setProfile((p) => ({ ...p, avoidExercises: [...p.avoidExercises, name].slice(-60) }));
  const restore = (name: string | null) =>
    setProfile((p) => ({ ...p, avoidExercises: name ? p.avoidExercises.filter((n) => n !== name) : [] }));
  const groceryKey = [variant, profile.diet, profile.cuisine, profile.mealsPerDay, profile.dairyFree, profile.glutenFree].join("|");

  const storageNote = user
    ? "Saved to your account, so it's available on any device."
    : DEMO
      ? "Saved in this browser only."
      : "Saved in this browser. Create an account to keep it safe and use it on any device.";

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <h1>
            Stride<span>.</span>
          </h1>
          <p>Workouts, nutrition and supplement guidance built from your details and graded by the strength of the research behind it.</p>
        </div>
        <div className="topctl">
          <div className="units" role="group" aria-label="Units">
            <button type="button" aria-pressed={units === "metric"} onClick={() => setUnits("metric")}>
              kg · cm
            </button>
            <button type="button" aria-pressed={units === "imperial"} onClick={() => setUnits("imperial")}>
              lb · ft
            </button>
          </div>
          {!DEMO &&
            (user ? (
              <AccountMenu user={user} onSignOut={signOut} onDelete={deleteAccount} />
            ) : (
              <>
                <button type="button" className="btn ghost" onClick={() => setAuth("signin")}>
                  Sign in
                </button>
                <button type="button" className="btn" onClick={() => setAuth("register")}>
                  Create account
                </button>
              </>
            ))}
        </div>
      </header>

      <div className="grid">
        <div className="side">
          <ProfileForm key={formKey} profile={profile} units={units} onChange={setProfile} />
          <p className="note" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved to your account." : saveState === "error" ? "Couldn't save. Check your connection." : storageNote}
          </p>
        </div>
        <main>
          <nav className="tabs" role="tablist" aria-label="Plan sections">
            {TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => selectTab(k)}>
                {label}
              </button>
            ))}
          </nav>
          {tab === "overview" && <Overview plan={plan} profile={profile} units={units} />}
          {tab === "workouts" && (
            <Workouts plan={plan} daysPerWeek={profile.daysPerWeek} workoutLog={workouts} onToggleToday={toggleToday} onAvoid={avoid} onRestore={restore} />
          )}
          {tab === "nutrition" && <Nutrition plan={plan} profile={profile} onAnotherDay={() => setVariant((v) => v + 1)} />}
          {tab === "groceries" && <Groceries plan={plan} weekKey={groceryKey} onNewWeek={() => setVariant((v) => v + 7)} />}
          {tab === "supplements" && <Supplements plan={plan} profile={profile} />}
          {tab === "walking" && (
            <Walking
              signedIn={!!user}
              steps={steps}
              goal={profile.stepGoal}
              onGoal={(g) => setProfile((p) => ({ ...p, stepGoal: g }))}
              onAddSteps={async (e) => setSteps(await store.addSteps(e))}
              onDeleteSteps={async (d) => setSteps(await store.deleteSteps(d))}
              onCreateAccount={() => setAuth("register")}
            />
          )}
          {tab === "health" && <Health plan={plan} />}
          {tab === "progress" && (
            <Progress
              plan={plan}
              profile={profile}
              units={units}
              weights={weights}
              workouts={workouts}
              storageNote={storageNote}
              onAddWeight={async (e) => setWeights(await store.addWeight(e))}
              onDeleteWeight={async (d) => setWeights(await store.deleteWeight(d))}
            />
          )}
          {tab === "research" && <Research plan={plan} />}
        </main>
      </div>

      <footer className="disc">
        Stride gives general, research-based guidance for healthy adults. It is not medical advice and can't account for your full health history. Talk to a
        doctor or pharmacist before starting supplements or a new exercise programme, especially if you have a medical condition, take medication, or are
        pregnant.
      </footer>

      {!DEMO && <AuthDialog open={auth !== null} initialMode={auth ?? "signin"} onClose={() => setAuth(null)} onSubmit={handleAuth} />}
    </div>
  );
}
