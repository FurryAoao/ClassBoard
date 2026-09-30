export type FeatureKey =
  | "clock" | "board" | "shortcuts" | "schedule" | "calendar"
  | "timer" | "picker" | "todos" | "search" | "focus"
  | "capture" | "clipboard" | "weather" | "display" | "plugins";

export const FEATURE_META: Record<FeatureKey, { name: string; icon: string; desc: string }> = {
  clock: { name: "时钟", icon: "🕒", desc: "时间 / 日期 / 星期" },
  board: { name: "教学白板", icon: "✏️", desc: "速写 + 投屏状态" },
  shortcuts: { name: "快捷方式", icon: "🔗", desc: "文件 / 文件夹 / 网页" },
  schedule: { name: "课程表", icon: "📚", desc: "周课表 + 当前课程" },
  calendar: { name: "日历", icon: "📅", desc: "月视图 + 日程" },
  timer: { name: "计时器", icon: "⏱️", desc: "正计时 / 倒计时" },
  picker: { name: "随机点名", icon: "🎲", desc: "点名 / 随机分组" },
  todos: { name: "待办", icon: "✅", desc: "课堂待办清单" },
  search: { name: "全局搜索", icon: "🔍", desc: "跨功能搜索" },
  focus: { name: "专注模式", icon: "🎯", desc: "免打扰 + 专注计时" },
  capture: { name: "截图录屏", icon: "📸", desc: "截图 / 录屏入口" },
  clipboard: { name: "剪贴板", icon: "📋", desc: "剪贴板历史" },
  weather: { name: "天气", icon: "🌤️", desc: "天气 + 备忘小部件" },
  display: { name: "投屏控制", icon: "🖥️", desc: "多屏 / 投屏状态" },
  plugins: { name: "插件扩展", icon: "🧩", desc: "自定义小部件" },
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
