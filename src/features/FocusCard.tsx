import { useEffect } from "react";
import CardHeader from "../components/CardHeader";
import { useNow } from "../lib/store-helpers";
import { useLesson } from "../store/useLesson";
import { useFocus, displayLeft, settleFocusIfExpired } from "../store/useFocus";

/** 专注模式：时间戳推导，切卡/收起后台照跑；关功能即暂停保留进度 */
export default function FocusCard() {
  const { activeCourse } = useLesson();
  const { mins, baseLeft, running, runningSince, done, day, setMins, start, stop } = useFocus();
  const now = useNow(true, 500);
  const nowMs = now.getTime();

  // 每 tick 结算一次：后台跑完切回来直接看到轮数+1
  useEffect(() => {
    settleFocusIfExpired(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMs]);

  const left = displayLeft({ baseLeft, running, runningSince }, nowMs);
  const today = new Date().toISOString().slice(0, 10);
  const todayDone = day === today ? done : 0;

  return (
    <div className="space-y-3">
      <CardHeader icon="focus" title="专注模式" sub={activeCourse ? `上课中 · ${activeCourse.name}` : undefined}
        right={running ? <span className="cb-chip bg-emerald-500/15 text-emerald-600">免打扰中 · 后台跑</span>
          : todayDone > 0 ? <span className="cb-chip bg-violet-500/10 text-violet-600">今日 {todayDone} 轮</span> : undefined} />
      <div className={`text-center py-4 rounded-3xl border transition-colors ${running ? "bg-violet-500/[0.08] border-violet-500/20" : "bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border-black/5 dark:border-white/10"}`}>
        <div className={`text-[52px] leading-none font-black tracking-tight ${running ? "text-violet-600 dark:text-violet-400" : "text-neutral-900 dark:text-white"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
          {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
        </div>
        {running && <div className="mt-1 text-[10px] text-neutral-400">切到别的功能照常跑 · 回来继续看</div>}
        {!running && (
          <div className="mt-3 flex justify-center gap-1.5">
            {[15, 25, 40].map((m) => (
              <button key={m} onClick={() => setMins(m)}
                className={`text-[11px] px-3 py-1.5 rounded-full font-bold transition-all ${mins === m ? "bg-violet-600 text-white shadow-sm shadow-violet-600/25" : "bg-black/[0.04] dark:bg-white/[0.07] text-neutral-500"}`}>{m} 分钟</button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => { if (running) stop(); else start(); }}
        className={`w-full text-[13px] py-2.5 rounded-2xl font-bold text-white active:scale-[0.99] transition-all ${running ? "bg-neutral-400 hover:bg-neutral-500" : "bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-600/25"}`}>
        {running ? (left < mins * 60 ? "结束专注（已跑部分不计轮）" : "结束专注") : baseLeft > 0 && baseLeft < mins * 60 ? "继续专注" : "开始专注"}
      </button>
      <div className="text-[10px] text-neutral-400 text-center">切卡收起照跑 · 关功能即暂停保留进度 · 建议固定窗口，不弹窗不抢焦点</div>
    </div>
  );
}
