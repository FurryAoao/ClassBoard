import { useEffect, useState } from "react";

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
    <div className="text-center space-y-2 py-2">
      <div className="text-[12px] font-bold">🎯 专注模式 {on && <span className="text-emerald-600">· 免打扰中</span>}</div>
      <div className={`text-5xl font-black ${on ? "text-violet-600" : ""}`} style={{ fontVariantNumeric: "tabular-nums" }}>
        {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
      </div>
      {!on && (
        <div className="flex justify-center gap-1.5">
          {[15, 25, 40].map((m) => (
            <button key={m} onClick={() => { setMins(m); setLeft(m * 60); }}
              className={`text-[11px] px-3 py-1.5 rounded-full font-bold ${mins === m ? "bg-violet-600 text-white" : "bg-black/5 dark:bg-white/10"}`}>{m} 分钟</button>
          ))}
        </div>
      )}
      <button onClick={() => { if (!on) setLeft(mins * 60); setOn(!on); }}
        className={`text-[13px] px-6 py-2 rounded-full font-bold ${on ? "bg-neutral-400 text-white" : "bg-violet-600 text-white"}`}>
        {on ? "结束专注" : "开始专注"}
      </button>
      <div className="text-[10px] text-neutral-400">专注期间建议固定窗口并保持置顶，不弹窗不抢焦点</div>
    </div>
  );
}
