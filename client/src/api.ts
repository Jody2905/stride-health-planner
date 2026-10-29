import type { Profile, Units } from "@stride/engine";

/** Demo builds have no backend: everything is stored in the browser. */
export const DEMO = import.meta.env.MODE === "demo";

export interface User {
  id: number;
  name: string;
  email: string;
}
export interface WeightEntry {
  date: string;
  weightKg: number;
}
export interface WorkoutEntry {
  date: string;
  title: string;
}
export interface StepEntry {
  date: string;
  steps: number;
}
export interface Friend {
  id: number;
  name: string;
}
export interface FriendsState {
  code: string;
  friends: Friend[];
  incoming: Friend[];
  outgoing: Friend[];
  message?: string;
}
export interface BoardMember {
  id: number;
  name: string;
  isMe: boolean;
  goal: number;
  daily: number[];
  total: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "stride" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Request failed.");
  return data as T;
}

export const api = {
  me: () => call<{ user: User; profile: Profile | null; units: Units }>("GET", "/api/auth/me"),
  register: (name: string, email: string, password: string) => call<{ user: User }>("POST", "/api/auth/register", { name, email, password }),
  login: (email: string, password: string) => call<{ user: User }>("POST", "/api/auth/login", { email, password }),
  logout: () => call<void>("POST", "/api/auth/logout"),
  deleteAccount: () => call<void>("DELETE", "/api/account"),
  saveProfile: (profile: Profile, units: Units) => call("PUT", "/api/profile", { profile, units }),
  friends: () => call<FriendsState>("GET", "/api/friends"),
  addFriend: (code: string) => call<FriendsState>("POST", "/api/friends", { code }),
  acceptFriend: (id: number) => call<FriendsState>("POST", `/api/friends/${id}/accept`),
  removeFriend: (id: number) => call<FriendsState>("DELETE", `/api/friends/${id}`),
  resetCode: () => call<FriendsState>("POST", "/api/friends/code"),
  leaderboard: (week: string) => call<{ week: string[]; members: BoardMember[] }>("GET", `/api/walking/leaderboard?week=${encodeURIComponent(week)}`),
};

/* ------------------------------------------------------------------ */
/* Progress storage: the API when signed in, the browser otherwise.    */
/* ------------------------------------------------------------------ */

export interface ProgressStore {
  weights(): Promise<WeightEntry[]>;
  addWeight(e: WeightEntry): Promise<WeightEntry[]>;
  deleteWeight(date: string): Promise<WeightEntry[]>;
  workouts(): Promise<WorkoutEntry[]>;
  addWorkout(e: WorkoutEntry): Promise<WorkoutEntry[]>;
  deleteWorkout(date: string): Promise<WorkoutEntry[]>;
  steps(): Promise<StepEntry[]>;
  addSteps(e: StepEntry): Promise<StepEntry[]>;
  deleteSteps(date: string): Promise<StepEntry[]>;
}

export const apiStore: ProgressStore = {
  weights: () => call("GET", "/api/weights"),
  addWeight: (e) => call("POST", "/api/weights", e),
  deleteWeight: (d) => call("DELETE", `/api/weights/${encodeURIComponent(d)}`),
  workouts: () => call("GET", "/api/workouts"),
  addWorkout: (e) => call("POST", "/api/workouts", e),
  deleteWorkout: (d) => call("DELETE", `/api/workouts/${encodeURIComponent(d)}`),
  steps: () => call("GET", "/api/steps"),
  addSteps: (e) => call("POST", "/api/steps", e),
  deleteSteps: (d) => call("DELETE", `/api/steps/${encodeURIComponent(d)}`),
};

export const local = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`stride.${key}`);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`stride.${key}`, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  },
};

function upsert<T extends { date: string }>(key: string, entry: T): T[] {
  const list = local.get<T[]>(key, []).filter((x) => x.date !== entry.date);
  list.push(entry);
  list.sort((a, b) => a.date.localeCompare(b.date));
  local.set(key, list);
  return list;
}
function remove<T extends { date: string }>(key: string, date: string): T[] {
  const list = local.get<T[]>(key, []).filter((x) => x.date !== date);
  local.set(key, list);
  return list;
}

export const localStore: ProgressStore = {
  weights: async () => local.get("weights", []),
  addWeight: async (e) => upsert("weights", e),
  deleteWeight: async (d) => remove("weights", d),
  workouts: async () => local.get("workouts", []),
  addWorkout: async (e) => upsert("workouts", e),
  deleteWorkout: async (d) => remove("workouts", d),
  steps: async () => local.get("steps", []),
  addSteps: async (e) => upsert("steps", e),
  deleteSteps: async (d) => remove("steps", d),
};
