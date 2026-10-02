import { create } from "zustand";

export type DisplayMode = "mirror" | "extend" | "off";

interface DisplayState {
  mode: DisplayMode;
  setMode: (m: DisplayMode) => void;
  setMirroring: (on: boolean) => void;
}

function readRaw(key: string): string | null {
  try { return localStorage.getItem("cb:" + key); } catch { return null; }
}

function load(): DisplayMode {
  try {
    // 新键优先
    const raw = readRaw("display");
    if (raw) {
      const o = JSON.parse(raw);
      const m = typeof o === "string" ? o : o.mode;
      if (m === "mirror" || m === "extend" || m === "off") return m;
    }
    // 老键：DisplayCard 的 display:mode
    const old = readRaw("display:mode");
    if (old) {
      const m = JSON.parse(old);
      if (m === "mirror" || m === "extend" || m === "off") return m;
    }
    // 老键：BoardCard 的 board:mirror 布尔
    const bm = readRaw("board:mirror");
    if (bm) {
      try {
        if (JSON.parse(bm) === true) return "mirror";
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return "off";
}

function save(mode: DisplayMode) {
  try {
    localStorage.setItem("cb:display", JSON.stringify({ mode }));
    localStorage.setItem("cb:display:mode", JSON.stringify(mode));
    localStorage.setItem("cb:board:mirror", JSON.stringify(mode === "mirror"));
  } catch {}
  import("../lib/store-helpers").then(({ kvSet }) => {
    kvSet("display", JSON.stringify({ mode }));
    kvSet("display:mode", JSON.stringify(mode));
    kvSet("board:mirror", JSON.stringify(mode === "mirror"));
  });
}

export function displayLabel(mode: DisplayMode): string {
  return mode === "mirror" ? "镜像投屏中" : mode === "extend" ? "扩展屏讲课" : "未投屏";
}

const init = load();
// 启动即把三键对齐，防老版本残留各说各话
save(init);

export const useDisplay = create<DisplayState>(() => ({
  mode: init,
  setMode: (mode) => {
    useDisplay.setState({ mode });
    save(mode);
  },
  setMirroring: (on) => {
    const mode: DisplayMode = on ? "mirror" : "off";
    useDisplay.setState({ mode });
    save(mode);
  },
}));
