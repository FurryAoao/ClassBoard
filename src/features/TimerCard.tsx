import { useEffect, useRef, useState } from "react";

/** 计时器 / 倒计时：仅挂载时运行，关闭即停 */
export default function TimerCard() {
  const [mode, setMode] = useState<"up" | "down">("down");
  const [secs, setSecs] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [minsInput, setMinsInput] = useState("5");
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setSecs((s) => {
        if (mode === "down") {
          if (s <= 1) { setRunning(false); return 0; }
          return s - 1;
        }
        return s + 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, mode]);

  // 卸载 = 关闭功能：清掉计时器，不留后台任务
  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="text-center space-y-2 py-2">
      <div className="flex justify-center gap-2 text-[11px]">
        <button onClick={() => { setMode("down"); setRunning(false); }} className={`px-3 py-1.5 rounded-full font-bold ${mode === "down" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "bg-black/5 dark:bg-white/10"}`}>倒计时</button>
        <button onClick={() => { setMode("up"); setRunning(false); }} className={`px-3 py-1.5 rounded-full font-bold ${mode === "up" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "bg-black/5 dark:bg-white/10"}`}>正计时</button>
      </div>
      <div className="text-5xl font-black" style={{ fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</div>
      {secs === 0 && mode === "down" && <div className="text-[13px] font-bold text-emerald-600 animate-pulse">⏰ 时间到！</div>}
      {mode === "down" && !running && (
        <div className="flex justify-center gap-1.5">
          {[1, 3, 5, 10].map((m) => (
            <button key={m} onClick={() => { setSecs(m * 60); setMinsInput(String(m)); }} className="text-[11px] px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">{m}分</button>
          ))}
          <input value={minsInput} onChange={(e) => setMinsInput(e.target.value)} className="w-12 text-[11px] px-1.5 py-1 rounded-full bg-black/5 dark:bg-black/30 outline-none text-center" />
          <button onClick={() => setSecs(Math.max(1, Number(minsInput) || 1) * 60)} className="text-[11px] px-2.5 py-1 rounded-full bg-sky-500 text-white font-bold">设</button>
        </div>
      )}
      <div className="flex justify-center gap-2">
        <button onClick={() => setRunning(!running)} className={`text-[13px] px-6 py-2 rounded-full font-bold ${running ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>
          {running ? "暂停" : "开始"}
        </button>
        <button onClick={() => { setRunning(false); setSecs(mode === "down" ? (Number(minsInput) || 5) * 60 : 0); }} className="text-[13px] px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 font-bold">重置</button>
      </div>
    </div>
  );
}
