import { create } from "zustand";
import type { FeatureKey } from "../lib/utils";

export type View = "home" | "feature" | "settings";

interface SettingsState {
  enabled: Record<FeatureKey, boolean>;
  activeFeature: FeatureKey | null;
  view: View;
  pinned: boolean;
  expanded: boolean;
  toggleFeature: (k: FeatureKey) => void;
  setFeature: (k: FeatureKey, on: boolean) => void;
  openFeature: (k: FeatureKey) => void;
  setView: (v: View) => void;
  setPinned: (p: boolean) => void;
  setExpanded: (e: boolean) => void;
  exportAll: () => Promise<string>;
  importAll: (json: string) => Promise<void>;
}

const DEFAULTS: Record<FeatureKey, boolean> = {
  clock: true,
  board: false,
  shortcuts: false,
  schedule: false,
  calendar: false,
  timer: false,
  picker: false,
  todos: false,
  search: false,
  focus: false,
  capture: false,
  clipboard: false,
  weather: false,
  display: false,
  plugins: false,
};

function loadEnabled(): Record<FeatureKey, boolean> {
  try {
    const raw = localStorage.getItem("cb:enabled");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULTS;
}
function saveEnabled(e: Record<FeatureKey, boolean>) {
  try { localStorage.setItem("cb:enabled", JSON.stringify(e)); } catch { /* ignore */ }
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("enabled", JSON.stringify(e)));
}

export const useSettings = create<SettingsState>((set, get) => ({
  enabled: loadEnabled(),
  activeFeature: "clock",
  view: "home",
  pinned: false,
  expanded: false,
  toggleFeature: (k) => {
    const next = { ...get().enabled, [k]: !get().enabled[k] };
    saveEnabled(next);
    // 关闭当前正看的功能 -> 回首页；关闭功能不卸载数据，只隐藏入口
    if (!next[k] && get().activeFeature === k) {
      set({ enabled: next, view: "home", activeFeature: "clock" });
    } else set({ enabled: next });
  },
  setFeature: (k, on) => {
    const next = { ...get().enabled, [k]: on };
    saveEnabled(next);
    set({ enabled: next });
  },
  openFeature: (k) => set({ activeFeature: k, view: "feature", expanded: true }),
  setView: (view) => set({ view }),
  setPinned: (pinned) => set({ pinned }),
  setExpanded: (expanded) => set({ expanded }),
  exportAll: async () => {
    const dump: Record<string, unknown> = {};
    dump.enabled = get().enabled;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("cb:")) {
        try { dump[k] = JSON.parse(localStorage.getItem(k)!); }
        catch { dump[k] = localStorage.getItem(k); }
      }
    }
    return JSON.stringify(dump, null, 2);
  },
  importAll: async (json) => {
    const dump = JSON.parse(json);
    for (const [k, v] of Object.entries(dump)) {
      const key = k.startsWith("cb:") ? k : `cb:${k}`;
      try { localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v)); }
      catch { /* ignore */ }
    }
    if (dump.enabled) set({ enabled: { ...DEFAULTS, ...dump.enabled } });
    location.reload();
  },
}));
