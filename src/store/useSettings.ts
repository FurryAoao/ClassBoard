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
function loadUi(): { activeFeature: FeatureKey; pinned: boolean } {
  try {
    const raw = localStorage.getItem("cb:ui");
    if (raw) {
      const o = JSON.parse(raw);
      const af: FeatureKey = typeof o.activeFeature === "string" ? o.activeFeature : "clock";
      return { activeFeature: af, pinned: !!o.pinned };
    }
  } catch { /* ignore */ }
  return { activeFeature: "clock", pinned: false };
}
function saveEnabled(e: Record<FeatureKey, boolean>) {
  try { localStorage.setItem("cb:enabled", JSON.stringify(e)); } catch { /* ignore */ }
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("enabled", JSON.stringify(e)));
}
function saveUi(activeFeature: FeatureKey | null, pinned: boolean) {
  try { localStorage.setItem("cb:ui", JSON.stringify({ activeFeature, pinned })); } catch { /* ignore */ }
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("ui", JSON.stringify({ activeFeature, pinned })));
}

const _ui = loadUi();

export const useSettings = create<SettingsState>((set, get) => ({
  enabled: loadEnabled(),
  activeFeature: _ui.activeFeature,
  view: "home",
  pinned: _ui.pinned,
  expanded: false,
  toggleFeature: (k) => {
    const next = { ...get().enabled, [k]: !get().enabled[k] };
    saveEnabled(next);
    // 关闭当前正看的功能 -> 回时钟；只隐藏入口停任务，数据保留
    if (!next[k] && get().activeFeature === k) {
      set({ enabled: next, view: "home", activeFeature: "clock" });
      saveUi("clock", get().pinned);
    } else {
      // 新开启的功能直接打开，省一次点击
      if (next[k]) {
        set({ enabled: next, activeFeature: k, view: "feature" });
        saveUi(k, get().pinned);
      } else set({ enabled: next });
    }
  },
  setFeature: (k, on) => {
    const next = { ...get().enabled, [k]: on };
    saveEnabled(next);
    set({ enabled: next });
  },
  // 打开功能（含搜索直达）：若没开启则自动开启，保证点得进、看得到
  openFeature: (k) => {
    const en = get().enabled;
    if (!en[k]) {
      const next = { ...en, [k]: true };
      saveEnabled(next);
      set({ enabled: next, activeFeature: k, view: "feature", expanded: true });
    } else set({ activeFeature: k, view: "feature", expanded: true });
    saveUi(k, get().pinned);
  },
  setView: (view) => set({ view }),
  setPinned: (pinned) => {
    set({ pinned });
    saveUi(get().activeFeature ?? "clock", pinned);
  },
  setExpanded: (expanded) => set({ expanded }),
  exportAll: async () => {
    const dump: Record<string, unknown> = {};
    dump.enabled = get().enabled;
    dump.ui = { activeFeature: get().activeFeature, pinned: get().pinned };
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
      if (k === "ui" || k === "cb:ui") continue;
      const key = k.startsWith("cb:") ? k : `cb:${k}`;
      try { localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v)); }
      catch { /* ignore */ }
    }
    const ui = (dump as any).ui ?? (dump as any)["cb:ui"];
    if (ui) {
      try { localStorage.setItem("cb:ui", typeof ui === "string" ? ui : JSON.stringify(ui)); } catch { /* ignore */ }
    }
    if (dump.enabled) set({ enabled: { ...DEFAULTS, ...dump.enabled } });
    location.reload();
  },
}));
