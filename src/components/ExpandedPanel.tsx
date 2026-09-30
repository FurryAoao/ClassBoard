import { useSettings } from "../store/useSettings";
import { FEATURE_META, FEATURE_ORDER } from "../lib/utils";
import SettingsView from "./SettingsView";
import ClockCard from "../features/ClockCard";
import BoardCard from "../features/BoardCard";
import ShortcutsCard from "../features/ShortcutsCard";
import ScheduleCard from "../features/ScheduleCard";
import CalendarCard from "../features/CalendarCard";
import TimerCard from "../features/TimerCard";
import PickerCard from "../features/PickerCard";
import TodosCard from "../features/TodosCard";
import SearchCard from "../features/SearchCard";
import FocusCard from "../features/FocusCard";
import CaptureCard from "../features/CaptureCard";
import ClipboardCard from "../features/ClipboardCard";
import WeatherCard from "../features/WeatherCard";
import DisplayCard from "../features/DisplayCard";
import PluginsCard from "../features/PluginsCard";

async function startDrag() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch { /* browser: ignore */ }
}

export default function ExpandedPanel({ width, height, onCollapse }: { width: number; height: number; onCollapse: () => void }) {
  const { enabled, activeFeature, openFeature, view, setView, pinned, setPinned } = useSettings();
  const visible = FEATURE_ORDER.filter((k) => enabled[k]);

  const renderFeature = () => {
    // 关闭功能后不加载、不显示、不运行：只挂载 enabled 的
    if (view === "settings") return <SettingsView />;
    switch (activeFeature) {
      case "clock": return enabled.clock ? <ClockCard /> : <EmptyHint />;
      case "board": return enabled.board ? <BoardCard /> : <EmptyHint />;
      case "shortcuts": return enabled.shortcuts ? <ShortcutsCard /> : <EmptyHint />;
      case "schedule": return enabled.schedule ? <ScheduleCard /> : <EmptyHint />;
      case "calendar": return enabled.calendar ? <CalendarCard /> : <EmptyHint />;
      case "timer": return enabled.timer ? <TimerCard /> : <EmptyHint />;
      case "picker": return enabled.picker ? <PickerCard /> : <EmptyHint />;
      case "todos": return enabled.todos ? <TodosCard /> : <EmptyHint />;
      case "search": return enabled.search ? <SearchCard /> : <EmptyHint />;
      case "focus": return enabled.focus ? <FocusCard /> : <EmptyHint />;
      case "capture": return enabled.capture ? <CaptureCard /> : <EmptyHint />;
      case "clipboard": return enabled.clipboard ? <ClipboardCard /> : <EmptyHint />;
      case "weather": return enabled.weather ? <WeatherCard /> : <EmptyHint />;
      case "display": return enabled.display ? <DisplayCard /> : <EmptyHint />;
      case "plugins": return enabled.plugins ? <PluginsCard /> : <EmptyHint />;
      default: return <EmptyHint />;
    }
  };

  return (
    <div
      className="glass no-drag rounded-3xl flex flex-col overflow-hidden animate-pop-in text-neutral-800 dark:text-neutral-100"
      style={{ width, height: height - 8 }}
    >
      {/* 标题栏：可拖拽区 */}
      <div
        className="drag-region flex items-center gap-2 px-3 pt-2.5 pb-2 cursor-move shrink-0"
        onMouseDown={(e) => { if (e.button === 0 && !(e.target as HTMLElement).closest("button")) startDrag(); }}
      >
        <span className="text-base">🎓</span>
        <span className="text-[13px] font-bold tracking-wide">ClassBoard</span>
        <span className="text-[10px] text-neutral-400">单悬窗 · 不打扰</span>
        <div className="flex-1" />
        <button title={pinned ? "取消固定" : "固定展开"} onClick={() => setPinned(!pinned)}
          className={`no-drag text-xs px-2 py-1 rounded-full ${pinned ? "bg-amber-400/80 text-black" : "bg-black/5 dark:bg-white/10"}`}>📌</button>
        <button title="设置" onClick={() => setView(view === "settings" ? "feature" : "settings")}
          className={`no-drag text-xs px-2 py-1 rounded-full ${view === "settings" ? "bg-sky-500 text-white" : "bg-black/5 dark:bg-white/10"}`}>⚙️</button>
        <button title="收起 (Esc)" onClick={onCollapse}
          className="no-drag text-xs px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">—</button>
      </div>

      {/* 标签栏：只显示已开启功能的入口（关闭即隐藏） */}
      {view !== "settings" && (
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto shrink-0">
          {visible.map((k) => (
            <button
              key={k}
              title={FEATURE_META[k].desc}
              onClick={() => openFeature(k)}
              className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-full border transition-all ${
                activeFeature === k
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent font-bold"
                  : "bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/10 hover:scale-105"
              }`}
            >
              {FEATURE_META[k].icon} {FEATURE_META[k].name}
            </button>
          ))}
        </div>
      )}

      {/* 内容区：同一窗口内视图切换，不开新窗口 */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 animate-slide-up" key={String(view) + String(activeFeature)}>
        {renderFeature()}
      </div>

      <div className="px-3 pb-2 text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 flex justify-between">
        <span>悬停展开 · 移出收起 · Alt+Space 唤起 · 可拖拽</span>
        <span>{visible.length} 功能开</span>
      </div>
    </div>
  );
}

function EmptyHint() {
  const { setView } = useSettings();
  return (
    <div className="text-center text-xs text-neutral-500 py-10">
      该功能已关闭，数据已保留。<br />
      <button className="mt-2 px-3 py-1.5 rounded-full bg-sky-500 text-white" onClick={() => setView("settings")}>
        去设置中开启
      </button>
    </div>
  );
}
