export type FeatureKey =
  | "clock" | "board" | "shortcuts" | "schedule" | "calendar"
  | "timer" | "picker" | "todos" | "search" | "focus"
  | "capture" | "clipboard" | "weather" | "display" | "plugins";

export const FEATURE_META: Record<FeatureKey, { name: string; desc: string }> = {
  clock: { name: "时钟", desc: "时间 / 日期 / 星期" },
  board: { name: "教学白板", desc: "速写 + 投屏状态" },
  shortcuts: { name: "快捷方式", desc: "文件 / 文件夹 / 网页" },
  schedule: { name: "课程表", desc: "周课表 + 当前课程" },
  calendar: { name: "日历", desc: "月视图 + 日程" },
  timer: { name: "计时器", desc: "正计时 / 倒计时" },
  picker: { name: "随机点名", desc: "点名 / 随机分组" },
  todos: { name: "待办", desc: "课堂待办清单" },
  search: { name: "全局搜索", desc: "跨功能搜索" },
  focus: { name: "专注模式", desc: "免打扰 + 专注计时" },
  capture: { name: "截图录屏", desc: "截图 / 录屏入口" },
  clipboard: { name: "剪贴板", desc: "剪贴板历史" },
  weather: { name: "天气", desc: "天气 + 备忘小部件" },
  display: { name: "投屏控制", desc: "多屏 / 投屏状态" },
  plugins: { name: "插件扩展", desc: "自定义小部件" },
};

export const FEATURE_ORDER: FeatureKey[] = [
  "clock", "schedule", "timer", "todos", "picker", "calendar",
  "shortcuts", "board", "search", "focus", "clipboard",
  "weather", "capture", "display", "plugins",
];

export const isTauri = () =>
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export async function syncWindowSize(w: number, h: number) {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_window_size", { width: w, height: h });
    await invoke("dock_window", { width: w, height: h });
  } catch { /* browser preview: ignore */ }
}

export function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekZh(n: number) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][n];
}
export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
