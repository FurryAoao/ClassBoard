import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import CardHeader from "../components/CardHeader";

/** 多屏 / 投屏控制：状态记录 + 扩展屏提示 */
export default function DisplayCard() {
  const [mode, setMode] = usePersistentState<"mirror" | "extend" | "off">("display:mode", "off");
  const [monitors, setMonitors] = useState<string[]>([]);
  const detect = async () => {
    try {
      const { currentMonitor } = await import("@tauri-apps/api/window");
      const wins = await currentMonitor();
      setMonitors([wins ? `主屏 ${wins.size.width}×${wins.size.height} @${wins.scaleFactor}x` : "主屏可用"]);
    } catch { setMonitors(["浏览器预览：无法读取显示器信息"]); }
  };
  const label = mode === "mirror" ? "镜像投屏中" : mode === "extend" ? "扩展屏讲课" : "未投屏";
  return (
    <div className="space-y-2">
      <CardHeader icon="display" title="投屏控制" sub={label} />
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
        {(["mirror", "extend", "off"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`py-2 rounded-xl text-[11px] font-bold transition-all ${mode === m ? "bg-white dark:bg-white/90 text-neutral-900 shadow" : "text-neutral-500"}`}>
            {m === "mirror" ? "镜像" : m === "extend" ? "扩展" : "停止"}
          </button>
        ))}
      </div>
      <div className="cb-panel-card text-[11px] text-neutral-600 dark:text-neutral-300">
        当前状态：<b className="text-neutral-900 dark:text-white">{label}</b>
        <span className="block text-neutral-400 text-[10px] mt-0.5">Win+P / macOS 显示器设置切换实体投屏，这里只做状态记录</span>
      </div>
      <button onClick={detect} className="cb-btn-accent w-full !py-2.5">检测显示器</button>
      {monitors.map((m, i) => <div key={i} className="cb-row !py-1.5 text-[11px] text-neutral-500">{m}</div>)}
    </div>
  );
}
