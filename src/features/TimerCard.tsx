import { useEffect, useRef, useState } from "react";
import CardHeader from "../components/CardHeader";

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

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      <CardHeader icon="timer" title="计时器" sub={mode === "down" ? "倒计时" : "正计时"} />
      <div className="flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.07]">
        {(["down", "up"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setRunning(false); }}
            className={`flex-1 text-[11px] py-1.5 rounded-full font-bold transition-all ${mode === m ? "bg-white dark:bg-white/90 text-neutral-900 shadow" : "text-neutral-500"}`}>
            {m === "down" ? "倒计时" : "正计时"}
          </button>
        ))}
      </div>
      <div className="text-center py-4 rounded-3xl bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border border-black/5 dark:border-white/10">
        <div className="text-[52px] leading-none font-black tracking-tight text-neutral-900 dark:text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</div>
        {secs === 0 && mode === "down" && <div className="mt-1 text-[13px] font-bold text-emerald-600 animate-pulse">时间到</div>}
      </div>
      {mode === "down" && !running && (
        <div className="flex items-center justify-center gap-1.5">
          {[1, 3, 5, 10].map((m) => (
            <button key={m} onClick={() => { setSecs(m * 60); setMinsInput(String(m)); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] font-medium hover:bg-black/[0.08] transition-colors">{m} 分</button>
          ))}
          <input value={minsInput} onChange={(e) => setMinsInput(e.target.value)} className="w-11 text-[11px] px-1 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] outline-none text-center" />
          <button onClick={() => setSecs(Math.max(1, Number(minsInput) || 1) * 60)} className="text-[11px] px-2.5 py-1.5 rounded-full bg-sky-500 text-white font-bold">设定</button>
        </div>
      )}
      <div className="flex justify-center gap-2">
        <button onClick={() => setRunning(!running)}
          className={`text-[13px] px-8 py-2.5 rounded-full font-bold text-white shadow-sm active:scale-[0.98] transition-all ${running ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25"}`}>
          {running ? "暂停" : "开始"}
        </button>
        <button onClick={() => { setRunning(false); setSecs(mode === "down" ? (Number(minsInput) || 5) * 60 : 0); }}
          className="cb-btn-ghost !rounded-full px-5">重置</button>
      </div>
    </div>
  );
}
