import { useEffect } from "react";
import CardHeader from "../components/CardHeader";
import { useNow } from "../lib/store-helpers";
import { useSettings } from "../store/useSettings";
import { useLesson } from "../store/useLesson";
import { useTimer, displaySecs, settleTimerIfExpired } from "../store/useTimer";

const LESSON_PRESETS = [
  { label: "导入", mins: 3 },
  { label: "讲授", mins: 15 },
  { label: "练习", mins: 10 },
  { label: "展示", mins: 5 },
  { label: "总结", mins: 5 },
];

/** 计时器 / 倒计时：时间戳推导，切卡/收起后台照跑；关闭功能即停；附课堂环节一键模板 */
export default function TimerCard() {
  const { openFeature } = useSettings();
  const { activeCourse, endClass } = useLesson();
  const {
    mode, setMode, baseSecs, setBaseSecs,
    running, runningSince, lesson, setLesson,
    minsInput, setMinsInput, startLesson, start, pause, reset,
  } = useTimer();
  const now = useNow(true, 500);
  const nowMs = now.getTime();

  // 每 tick 结算一次：后台跑完切回来直接看到“时间到”
  useEffect(() => {
    settleTimerIfExpired(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMs]);

  const secs = displaySecs({ mode, baseSecs, running, runningSince }, nowMs);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <div className="space-y-2.5">
      <CardHeader icon="timer" title="计时器" sub={activeCourse ? `上课中 · ${activeCourse.name}` : lesson && mode === "down" ? `环节 · ${lesson}` : mode === "down" ? "倒计时" : "正计时"}
        right={running ? <span className="cb-chip bg-emerald-500/15 text-emerald-600 !text-[10px]">后台运行中</span> : undefined} />
      <div className="flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.07]">
        {(["down", "up"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 text-[11px] py-1.5 rounded-full font-bold transition-all ${mode === m ? "bg-white dark:bg-white/90 text-neutral-900 shadow" : "text-neutral-500"}`}>
            {m === "down" ? "倒计时" : "正计时"}
          </button>
        ))}
      </div>
      <div className="text-center py-4 rounded-3xl bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border border-black/5 dark:border-white/10">
        <div className="text-[52px] leading-none font-black tracking-tight text-neutral-900 dark:text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</div>
        {running && <div className="mt-1 text-[10px] text-neutral-400">切到别的功能照常跑 · 回来继续看</div>}
        {secs === 0 && mode === "down" && (
          <div className="mt-1.5">
            <div className="text-[13px] font-bold text-emerald-600 animate-pulse">时间到{lesson ? ` · ${lesson}结束` : ""}</div>
            {activeCourse && (
              <button className="mt-1.5 px-4 py-1.5 rounded-full bg-violet-600 text-white text-[11px] font-black hover:bg-violet-700 transition-colors"
                onClick={() => { endClass(); openFeature("schedule"); }}>
                给 {activeCourse.name} 下课 · 回课表
              </button>
            )}
          </div>
        )}
      </div>
      {mode === "down" && (
        <div>
          <div className="text-[10px] font-bold text-neutral-400 px-1 mb-1">课堂环节一键开始</div>
          <div className="flex flex-wrap gap-1.5">
            {LESSON_PRESETS.map((p) => (
              <button key={p.label} onClick={() => startLesson(p.label, p.mins)}
                className={`text-[11px] px-2.5 py-1.5 rounded-full font-bold transition-all ${lesson === p.label && running ? "bg-emerald-500 text-white shadow-sm" : "bg-black/[0.04] dark:bg-white/[0.07] text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.08]"}`}>
                {p.label} {p.mins}分
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === "down" && !running && (
        <div className="flex items-center justify-center gap-1.5">
          {[1, 3, 5, 10].map((m) => (
            <button key={m} onClick={() => { setBaseSecs(m * 60); setMinsInput(String(m)); setLesson(null); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] font-medium hover:bg-black/[0.08] transition-colors">{m} 分</button>
          ))}
          <input value={minsInput} onChange={(e) => setMinsInput(e.target.value)} className="w-11 text-[11px] px-1 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] outline-none text-center" />
          <button onClick={() => { setBaseSecs(Math.max(1, Number(minsInput) || 1) * 60); setLesson(null); }} className="text-[11px] px-2.5 py-1.5 rounded-full bg-sky-500 text-white font-bold">设定</button>
        </div>
      )}
      <div className="flex justify-center gap-2">
        <button onClick={() => { if (running) pause(); else start(); }}
          className={`text-[13px] px-8 py-2.5 rounded-full font-bold text-white shadow-sm active:scale-[0.98] transition-all ${running ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25"}`}>
          {running ? "暂停" : "开始"}
        </button>
        <button onClick={() => reset(mode === "down" ? (Number(minsInput) || 5) * 60 : 0)}
          className="cb-btn-ghost !rounded-full px-5">重置</button>
      </div>
    </div>
  );
}
