import { useSettings } from "../store/useSettings";
import { FEATURE_META, FEATURE_ORDER } from "../lib/utils";
import { FeatureIcon, UiIcon } from "./icons";
import { FEATURE_TINT } from "./CardHeader";
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
      className="glass no-drag rounded-[22px] flex flex-col overflow-hidden animate-pop-in text-neutral-800 dark:text-neutral-100"
      style={{ width, height: height - 8 }}
    >
      {/* 标题栏：可拖拽区 */}
      <div
        className="drag-region flex items-center gap-2 pl-3 pr-2.5 pt-2.5 pb-2 cursor-move shrink-0"
        onMouseDown={(e) => { if (e.button === 0 && !(e.target as HTMLElement).closest("button")) startDrag(); }}
      >
        <span className="w-6 h-6 rounded-[8px] bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
          <UiIcon k="logo" size={14} />
        </span>
        <span className="text-[13px] font-bold tracking-tight">ClassBoard</span>
        <span className="text-[10px] text-neutral-400 font-medium">单悬窗 · 不打扰</span>
        <div className="flex-1" />
        <button title={pinned ? "取消固定" : "固定展开"} onClick={() => setPinned(!pinned)}
          className={`no-drag w-7 h-7 rounded-full flex items-center justify-center transition-all ${pinned ? "bg-amber-400 text-black shadow-sm shadow-amber-400/40" : "text-neutral-400 hover:bg-black/[0.05] dark:hover:bg-white/10"}`}><UiIcon k="pin" size={13} /></button>
        <button title="设置" onClick={() => setView(view === "settings" ? "feature" : "settings")}
          className={`no-drag w-7 h-7 rounded-full flex items-center justify-center transition-all ${view === "settings" ? "bg-sky-500 text-white shadow-sm shadow-sky-500/40" : "text-neutral-400 hover:bg-black/[0.05] dark:hover:bg-white/10"}`}><UiIcon k="gear" size={13} /></button>
        <button title="收起 (Esc)" onClick={onCollapse}
          className="no-drag w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-all"><UiIcon k="minus" size={13} /></button>
      </div>

      {/* 标签栏：只显示已开启功能的入口（关闭即隐藏） */}
      {view !== "settings" && visible.length > 0 && (
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto shrink-0">
          {visible.map((k) => (
            <button
              key={k}
              title={FEATURE_META[k].desc}
              onClick={() => openFeature(k)}
              className={`shrink-0 flex items-center gap-1.5 text-[11px] pl-1.5 pr-2.5 py-1.5 rounded-full font-bold transition-all active:scale-[0.97] ${
                activeFeature === k
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.07] dark:hover:bg-white/[0.1]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${activeFeature === k ? "bg-white/20 dark:bg-black/10" : FEATURE_TINT[k]}`}>
                <FeatureIcon k={k} size={11} />
              </span>
              {FEATURE_META[k].name}
            </button>
          ))}
        </div>
      )}

      {/* 内容区：同一窗口内视图切换，不开新窗口 */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 animate-slide-up" key={String(view) + String(activeFeature)}>
        {renderFeature()}
      </div>

      <div className="px-3.5 pb-2.5 pt-1 text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 flex justify-between border-t border-black/[0.04] dark:border-white/[0.06]">
        <span>悬停展开 · 移出收起 · Alt+Space 唤起 · 可拖拽</span>
        <span className="font-bold">{visible.length} 功能开</span>
      </div>
    </div>
  );
}

function EmptyHint() {
  const { setView } = useSettings();
  return (
    <div className="text-center py-12">
      <div className="text-[12px] text-neutral-500">该功能已关闭，数据已保留</div>
      <button className="mt-3 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-[12px] font-bold transition-colors" onClick={() => setView("settings")}>
        去设置中开启
      </button>
    </div>
  );
}
