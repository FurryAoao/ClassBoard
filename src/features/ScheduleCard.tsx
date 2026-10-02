import { useEffect, useMemo, useRef, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { useSettings } from "../store/useSettings";
import { useLesson } from "../store/useLesson";
import { weekZh, uid, isTauri } from "../lib/utils";
import { saveFile, stampName } from "../lib/export-file";
import { kvGet, kvSet } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }

/** 课程表与当前课程：手动 + ICS 文件导入 */
export default function ScheduleCard() {
  const [courses, setCourses] = usePersistentState<Course[]>("schedule:list", []);
  const { openFeature } = useSettings();
  const { activeCourse, lastLesson, dismissLast, startClass, endClass, setFocusOn } = useLesson();
  const [summary, setSummary] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [name, setName] = useState(""); const [day, setDay] = useState(1);
  const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("08:45");
  const [room, setRoom] = useState("");
  const [icsMsg, setIcsMsg] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [bellOn, setBellOnState] = useState(true);
  const [bellLead, setBellLeadState] = useState(0);
  const [lastBell, setLastBell] = useState("");
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      import("../lib/class-bell").then(({ isBellOn, getBellLead, getLastBell, bellText }) => {
        if (!alive) return;
        setBellOnState(isBellOn());
        setBellLeadState(getBellLead());
        const r = getLastBell();
        if (r) setLastBell(bellText(r));
      });
    };
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);
  // 同一天时间重叠即撞车：start < c.end && c.start < end（HH:MM 字符串可直接比）
  const findClash = (dayIdx: number, s: string, e: string) =>
    courses.filter((c) => c.day === dayIdx && s < c.end && c.start < e);
  const addCourse = () => {
    setAddMsg("");
    if (!name.trim()) { setAddMsg("课程名不能为空"); return; }
    if (start >= end) { setAddMsg("开始时间要早于结束时间"); return; }
    const clash = findClash(day, start, end);
    if (clash.length) {
      const c = clash[0];
      setAddMsg(`时间撞了：${c.name} ${c.start}-${c.end}，已拦下没加`);
      return;
    }
    setCourses([...courses, { id: uid(), day, start, end, name: name.trim(), room: room.trim() }]);
    setName(""); setRoom("");
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const now = useNow(true);

  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const d = (now.getDay() + 6) % 7;
  const todayList = useMemo(() => courses.filter((c) => c.day === d).sort((a, b) => a.start.localeCompare(b.start)), [courses, d]);
  const current = useMemo(() => todayList.find((c) => c.start <= t && t <= c.end) ?? null, [todayList, t]);
  const next = useMemo(() => todayList.find((c) => c.start > t) ?? null, [todayList, t]);
  // 周视图：周一到周日分组，今天高亮
  const weekGroups = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((dd) => ({ day: dd, list: courses.filter((c) => c.day === dd).sort((a, b) => a.start.localeCompare(b.start)) })),
    [courses]
  );

  const exportIcs = async () => {
    if (!courses.length) { setIcsMsg("课表是空的，先加几节课"); return; }
    try {
      // 以本周为基准，把周课表落到具体日期，手机日历可直接订阅
      const monday = new Date(now);
      monday.setDate(now.getDate() - d);
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ClassBoard//Schedule//CN"];
      for (const c of courses) {
        const dayD = new Date(monday);
        dayD.setDate(monday.getDate() + c.day);
        const [sh, sm] = c.start.split(":").map(Number);
        const [eh, em] = c.end.split(":").map(Number);
        const s = new Date(dayD); s.setHours(sh, sm, 0, 0);
        const e = new Date(dayD); e.setHours(eh, em, 0, 0);
        const f = (x: Date) =>
          `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}T${String(x.getHours()).padStart(2, "0")}${String(x.getMinutes()).padStart(2, "0")}00`;
        lines.push("BEGIN:VEVENT", `UID:${c.id}@classboard`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`,
          `SUMMARY:${c.name.replace(/[,;]/g, " ")}`, ...(c.room ? [`LOCATION:${c.room.replace(/[,;]/g, " ")}`] : []), "END:VEVENT");
      }
      lines.push("END:VCALENDAR");
      const where = await saveFile(stampName("classboard-schedule", "ics"), lines.join("\r\n"));
      setIcsMsg(where ? `已导出 ${courses.length} 节${isTauri() ? `到 ${short(where)}` : "，手机日历可导入"}` : "已取消");
    } catch { setIcsMsg("导出失败，再试一次"); }
  };
  const short = (p: string) => (p.length > 40 ? "…" + p.slice(-40) : p);
  // 课表一键发群：把整周课表拼成文本，复制发群/发家长群
  const copyWeek = async () => {
    if (!courses.length) { setIcsMsg("课表是空的，先加几节课"); return; }
    const zh = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const lines = [`ClassBoard 课表（共 ${courses.length} 节）`];
    weekGroups.forEach((g) => {
      if (!g.list.length) return;
      const one = g.list.map((c) => `${c.start}-${c.end} ${c.name}${c.room ? `@${c.room}` : ""}`).join("；");
      lines.push(`${zh[g.day]}：${one}`);
    });
    try { await navigator.clipboard.writeText(lines.join("\n")); setIcsMsg(`已复制 ${courses.length} 节，发群直接粘贴`); }
    catch { setIcsMsg("复制失败：请手动长按复制"); }
  };
  // 今日发群：只拼今天的课表，每天发群更常用
  const copyToday = async () => {
    if (!todayList.length) { setIcsMsg(`今天${weekZh(now.getDay())}没有课，不用发群`); return; }
    const lines = [`今日课表 ${weekZh(now.getDay())}（${todayList.length} 节）`];
    todayList.forEach((c) => lines.push(`${c.start}-${c.end} ${c.name}${c.room ? `@${c.room}` : ""}`));
    try { await navigator.clipboard.writeText(lines.join("\n")); setIcsMsg(`已复制今日 ${todayList.length} 节，发群直接粘贴`); }
    catch { setIcsMsg("复制失败：请手动长按复制"); }
  };

  const importIcs = async (f: File) => {
    try {
      const text = await f.text();
      const lines = text.replace(/\r\n/g, "\n").split("\n");
      let cur: Record<string, string> = {};
      const out: Course[] = [];
      const push = () => {
        if (!cur["SUMMARY"]) { cur = {}; return; }
        const dt = cur["DTSTART"] ?? "";
        // 支持 YYYYMMDDTHHMMSS / YYYYMMDDTHHMM / 带时区后缀 Z（按本地时间粗读）
        const m = dt.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        if (!m) { cur = {}; return; }
        const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
        const jsDay = date.getDay();
        const dayIdx = (jsDay + 6) % 7;
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        // 时长：DTEND - DTSTART，缺省 45 分钟
        let durMin = 45;
        const me = (cur["DTEND"] ?? "").match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        if (me) {
          const e2 = new Date(Number(me[1]), Number(me[2]) - 1, Number(me[3]), Number(me[4]), Number(me[5]));
          durMin = Math.max(15, Math.round((e2.getTime() - date.getTime()) / 60000));
        }
        const endD = new Date(date.getTime() + durMin * 60000);
        const eh = String(endD.getHours()).padStart(2, "0");
        const em = String(endD.getMinutes()).padStart(2, "0");
        out.push({ id: uid(), day: dayIdx, start: `${hh}:${mi}`, end: `${eh}:${em}`, name: cur["SUMMARY"].slice(0, 40), room: (cur["LOCATION"] ?? "").slice(0, 20) });
        cur = {};
      };
      for (const ln of lines) {
        if (ln.startsWith("BEGIN:VEVENT")) cur = {};
        else if (ln.startsWith("END:VEVENT")) push();
        else {
          const i = ln.indexOf(":");
          if (i > 0) {
            const k = ln.slice(0, i).split(";")[0];
            if (["SUMMARY", "DTSTART", "DTEND", "LOCATION"].includes(k)) cur[k] = ln.slice(i + 1).replace(/\\,/g, ",").replace(/\\n/g, " ");
          }
        }
      }
      if (!out.length) { setIcsMsg("未从 ICS 读到课程事件"); return; }
      // 按“每周重复”理解：同一 weekday+start 去重后并入；与现有课表撞时间的跳过
      const key = (c: Course) => `${c.day}-${c.start}-${c.name}`;
      const have = new Set(courses.map(key));
      const clashWith = (pool: Course[], c: Course) => pool.some((x) => x.day === c.day && c.start < x.end && x.start < c.end);
      const merged: Course[] = [...courses];
      let clashN = 0;
      const fresh = out.filter((c) => {
        if (have.has(key(c)) || clashWith(merged, c)) { if (!have.has(key(c))) clashN++; return false; }
        merged.push(c);
        return true;
      });
      setCourses(merged);
      setIcsMsg(`已导入 ${fresh.length} 节（文件中共 ${out.length} 个事件${clashN ? `，${clashN} 节撞时间已跳过` : ""}）`);
    } catch { setIcsMsg("ICS 解析失败"); }
  };

  const saveSummary = async (dest: "todo" | "widget") => {
    if (!summary.trim() || !lastLesson) return;
    try {
      // 同步记一份到日历当天，方便月底回顾本月上了什么
      const { fmtDate } = await import("../lib/utils");
      const todayK = fmtDate(new Date());
      const rawCal = await kvGet("calendar:events");
      const cal = rawCal ? JSON.parse(rawCal) : {};
      cal[todayK] = [...(cal[todayK] ?? []), `【${lastLesson.course.name}】${summary.trim()}`];
      await kvSet("calendar:events", JSON.stringify(cal));
      if (dest === "todo") {
        const raw = await kvGet("todos:list");
        const list = raw ? JSON.parse(raw) : [];
        list.push({ id: uid(), text: `【${lastLesson.course.name}小结】${summary.trim()}`, done: false });
        await kvSet("todos:list", JSON.stringify(list));
        setSavedMsg("已记入待办，马上跳转…");
        setTimeout(() => { dismissLast(); setSavedMsg(""); setSummary(""); openFeature("todos"); }, 600);
      } else {
        const raw = await kvGet("plugins:widgets");
        const list = raw ? JSON.parse(raw) : [];
        list.push({ id: uid(), title: `${lastLesson.course.name}·课堂小结`, body: summary.trim() });
        await kvSet("plugins:widgets", JSON.stringify(list));
        setSavedMsg("已记入小部件，马上跳转…");
        setTimeout(() => { dismissLast(); setSavedMsg(""); setSummary(""); openFeature("plugins"); }, 600);
      }
      setSummary("");
    } catch { setSavedMsg("保存失败，再试一次"); }
  };

  return (
    <div className="space-y-2">
      <CardHeader icon="schedule" title="课程表" sub={`今天${weekZh(now.getDay())} · 本周 ${courses.length} 节`}
        right={
          <span className="flex gap-1">
            <button onClick={() => void copyToday()} title="只拼今天的课表，每天发群更常用"
              className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500 hover:bg-black/[0.09] transition-colors">今日发群</button>
            <button onClick={() => void copyWeek()} title="把整周课表拼成文本，复制发群"
              className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500 hover:bg-black/[0.09] transition-colors">整周发群</button>
            <button onClick={() => void exportIcs()} title="把本周课表存成 ICS，手机日历可导入"
              className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500 hover:bg-black/[0.09] transition-colors">ICS 导出</button>
            <button onClick={() => fileRef.current?.click()} title="从 ICS 日历文件导入"
              className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500 hover:bg-black/[0.09] transition-colors">ICS 导入</button>
          </span>
        } />
      <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importIcs(f); e.target.value = ""; }} />
      {icsMsg && <div className="text-[10px] font-bold text-sky-600 px-1">{icsMsg}</div>}
      {lastBell && <div className="text-[10px] font-bold text-neutral-400 px-1">上次铃声：{lastBell}</div>}
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
        <span className="flex-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-300">上下课铃 · 到点自动响</span>
        <div className="flex items-center gap-1 shrink-0" title="预备铃：上课前几分钟先响一声">
          {[0, 3, 5, 10].map((m) => (
            <button key={m}
              onClick={async () => {
                const { setBellLead } = await import("../lib/class-bell");
                setBellLead(m);
                setBellLeadState(m);
              }}
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${bellLead === m ? "bg-sky-500 text-white" : "text-neutral-400 hover:text-neutral-600"}`}>
              {m === 0 ? "不预备" : `${m}分`}
            </button>
          ))}
        </div>
        <button className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0" title="试听上课铃（高音四声）"
          onClick={() => import("../lib/sound").then(({ beep }) => beep(4, 988))}>试上课</button>
        <button className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0" title="试听下课铃（低音两声）"
          onClick={() => import("../lib/sound").then(({ beep }) => beep(2, 523))}>试下课</button>
        <button
          onClick={async () => {
            const { setBellOn } = await import("../lib/class-bell");
            const next = !bellOn;
            setBellOn(next);
            setBellOnState(next);
          }}
          className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${bellOn ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
          title={bellOn ? "点击关闭铃声" : "点击开启铃声"}
        >
          <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${bellOn ? "left-[20px]" : "left-[2px]"}`} />
        </button>
      </div>
      {!activeCourse && lastLesson && (
        <div className="px-3 py-2.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 space-y-1.5 animate-fade-in">
          <div className="text-[12px] font-bold text-neutral-800 dark:text-neutral-100">
            {lastLesson.course.name} 已下课{lastLesson.startedAt ? ` · 本节 ${Math.max(1, Math.round((lastLesson.endedAt - lastLesson.startedAt) / 60000))} 分钟` : ""}
          </div>
          <input value={summary} onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void saveSummary("todo"); }}
            placeholder="一句话记本节要点，回车记入待办" className="cb-input !py-1.5 !text-[11px]" />
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-black hover:bg-emerald-600 transition-colors" onClick={() => void saveSummary("todo")}>记入待办</button>
            <button className="px-3 py-1.5 rounded-full bg-black/[0.05] dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-[11px] font-bold hover:bg-black/[0.09] transition-colors" onClick={() => void saveSummary("widget")}>记入小部件</button>
            <button className="ml-auto text-[11px] text-neutral-400 hover:text-neutral-600" onClick={() => { dismissLast(); setSummary(""); setSavedMsg(""); }}>关闭</button>
          </div>
          {savedMsg && <div className="text-[10px] font-bold text-emerald-600">{savedMsg}</div>}
        </div>
      )}
      {activeCourse && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-violet-600 text-white text-[12px] font-bold shadow-sm shadow-violet-600/30 animate-fade-in">
          <span className="flex-1 truncate">上课中：{activeCourse.name}{activeCourse.room && ` · ${activeCourse.room}`}</span>
          <button className="shrink-0 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-bold transition-colors" onClick={() => endClass()}>下课</button>
        </div>
      )}
      {current ? (
        <div className="px-3 py-2.5 rounded-2xl bg-emerald-500 text-white text-[12px] font-bold animate-fade-in shadow-sm shadow-emerald-500/30">
          <div>正在上课：{current.name} · {current.start}-{current.end}{current.room && ` · ${current.room}`}</div>
          {(!activeCourse || activeCourse.id !== current.id) && (
            <button className="mt-1.5 px-3 py-1.5 rounded-full bg-white text-emerald-700 text-[11px] font-black hover:bg-emerald-50 transition-colors"
              onClick={() => { startClass(current); setFocusOn(false); openFeature("picker"); }}>
              一键开课 · 跳点名
            </button>
          )}
        </div>
      ) : next ? (
        <div className="px-3 py-2.5 rounded-2xl bg-sky-500/12 border border-sky-500/20 text-[12px] font-bold text-sky-700 dark:text-sky-300">
          <div>下一节 {next.start} · {next.name}{next.room && ` · ${next.room}`}</div>
          {!activeCourse && (() => {
            const [h, m] = next.start.split(":").map(Number);
            const target = new Date(now); target.setHours(h, m, 0, 0);
            const diff = Math.max(0, Math.round((target.getTime() - now.getTime()) / 1000));
            const cd = `${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`;
            return <div className="mt-0.5 text-[11px] font-black tabular-nums">距上课 {cd}</div>;
          })()}
          <button className="mt-1.5 px-3 py-1.5 rounded-full bg-sky-500 text-white text-[11px] font-black hover:bg-sky-600 transition-colors"
            onClick={() => { startClass(next); setFocusOn(false); openFeature("picker"); }}>
            提前开课 · 跳点名
          </button>
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] text-[12px] text-neutral-500">今天{ todayList.length ? "课程已结束" : "没有课程"}</div>
      )}
      <div className="space-y-1 max-h-44 overflow-y-auto">
        {courses.length === 0 && <div className="cb-empty !py-3">在下方添加，或点右上 ICS 导入</div>}
        {weekGroups.map((g) => (
          <div key={g.day} className={`rounded-xl px-1 ${g.day === d ? "bg-sky-500/[0.06] border border-sky-500/20" : ""}`}>
            <div className="flex items-center gap-1.5 px-1 pt-1 pb-0.5">
              <span className={`text-[11px] font-black ${g.day === d ? "text-sky-600 dark:text-sky-400" : "text-neutral-500"}`}>周{["一", "二", "三", "四", "五", "六", "日"][g.day]}</span>
              {g.day === d && <span className="text-[9px] font-black px-1.5 py-px rounded-full bg-sky-500 text-white">今天</span>}
              <span className="text-[10px] text-neutral-400">{g.list.length ? `${g.list.length} 节` : "无课"}</span>
            </div>
            {g.list.map((c) => (
              <div key={c.id} className="cb-row !py-1.5 text-[11px]">
                <span className="text-neutral-400" style={{ fontVariantNumeric: "tabular-nums" }}>{c.start}-{c.end}</span>
                <span className="font-bold flex-1 truncate text-neutral-800 dark:text-neutral-100">{c.name}{c.room && <span className="font-normal text-neutral-400"> · {c.room}</span>}</span>
                <button className="cb-icon-btn !w-5 !h-5" onClick={() => setCourses(courses.filter((x) => x.id !== c.id))}><UiIcon k="x" size={10} /></button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="cb-input !w-auto text-[11px]">
          {[0, 1, 2, 3, 4, 5, 6].map((dd) => <option key={dd} value={dd}>周{["一", "二", "三", "四", "五", "六", "日"][dd]}</option>)}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="cb-input !w-[76px] text-[11px] !px-1" />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="cb-input !w-[76px] text-[11px] !px-1" />
      </div>
      {addMsg && <div className="text-[10px] font-bold text-red-500 px-1">{addMsg}</div>}
      <div className="flex gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="课程名" className="cb-input" />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="教室" className="cb-input !w-16 !px-2" />
        <button className="cb-btn-primary !px-3.5 flex items-center" title="加课：时间撞了自动拦下"
          onClick={addCourse}><UiIcon k="plus" size={13} /></button>
      </div>
    </div>
  );
}
