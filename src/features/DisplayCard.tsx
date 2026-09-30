import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";

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
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">🖥️ 投屏控制</div>
      <div className="grid grid-cols-3 gap-1.5">
        {(["mirror", "extend", "off"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`py-2.5 rounded-xl text-[11px] font-bold ${mode === m ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "bg-black/5 dark:bg-white/10"}`}>
            {m === "mirror" ? "🪞 镜像" : m === "extend" ? "↔️ 扩展" : "⏹ 停止"}
          </button>
        ))}
      </div>
      <div className="text-[11px] px-2.5 py-2 rounded-xl bg-white/50 dark:bg-white/5">
        当前状态：<b>{mode === "mirror" ? "镜像投屏中" : mode === "extend" ? "扩展屏讲课" : "未投屏"}</b>
        <span className="block text-neutral-400 text-[10px] mt-0.5">Win+P / macOS 显示器设置切换实体投屏，这里只做状态记录</span>
      </div>
      <button onClick={detect} className="w-full text-[12px] py-2 rounded-xl bg-sky-500 text-white font-bold">检测显示器</button>
      {monitors.map((m, i) => <div key={i} className="text-[11px] px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-black/30">{m}</div>)}
    </div>
  );
}
