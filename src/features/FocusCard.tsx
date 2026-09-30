import { useEffect, useState } from "react";
import CardHeader from "../components/CardHeader";

/** 专注模式：免打扰遮罩提示 + 专注计时（卸载即停） */
export default function FocusCard() {
  const [mins, setMins] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    if (left <= 0) { setOn(false); return; }
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [on, left]);

  return (
    <div className="space-y-3">
      <CardHeader icon="focus" title="专注模式"
        right={on ? <span className="cb-chip bg-emerald-500/15 text-emerald-600">免打扰中</span> : undefined} />
      <div className={`text-center py-4 rounded-3xl border transition-colors ${on ? "bg-violet-500/[0.08] border-violet-500/20" : "bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border-black/5 dark:border-white/10"}`}>
        <div className={`text-[52px] leading-none font-black tracking-tight ${on ? "text-violet-600 dark:text-violet-400" : "text-neutral-900 dark:text-white"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
          {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
        </div>
        {!on && (
          <div className="mt-3 flex justify-center gap-1.5">
            {[15, 25, 40].map((m) => (
              <button key={m} onClick={() => { setMins(m); setLeft(m * 60); }}
                className={`text-[11px] px-3 py-1.5 rounded-full font-bold transition-all ${mins === m ? "bg-violet-600 text-white shadow-sm shadow-violet-600/25" : "bg-black/[0.04] dark:bg-white/[0.07] text-neutral-500"}`}>{m} 分钟</button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => { if (!on) setLeft(mins * 60); setOn(!on); }}
        className={`w-full text-[13px] py-2.5 rounded-2xl font-bold text-white active:scale-[0.99] transition-all ${on ? "bg-neutral-400 hover:bg-neutral-500" : "bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-600/25"}`}>
        {on ? "结束专注" : "开始专注"}
      </button>
      <div className="text-[10px] text-neutral-400 text-center">专注期间建议固定窗口并保持置顶，不弹窗不抢焦点</div>
    </div>
  );
}
