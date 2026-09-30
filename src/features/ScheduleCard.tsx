import { useMemo, useRef, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { weekZh, uid } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }

/** 课程表与当前课程：手动 + ICS 文件导入 */
export default function ScheduleCard() {
  const [courses, setCourses] = usePersistentState<Course[]>("schedule:list", []);
  const [name, setName] = useState(""); const [day, setDay] = useState(1);
  const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("08:45");
  const [room, setRoom] = useState("");
  const [icsMsg, setIcsMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const now = useNow(true);

  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const d = (now.getDay() + 6) % 7;
  const todayList = useMemo(() => courses.filter((c) => c.day === d).sort((a, b) => a.start.localeCompare(b.start)), [courses, d]);
  const current = useMemo(() => todayList.find((c) => c.start <= t && t <= c.end) ?? null, [todayList, t]);
  const next = useMemo(() => todayList.find((c) => c.start > t) ?? null, [todayList, t]);

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
      // 按“每周重复”理解：同一 weekday+start 去重后并入
      const key = (c: Course) => `${c.day}-${c.start}-${c.name}`;
      const have = new Set(courses.map(key));
      const fresh = out.filter((c) => !have.has(key(c)));
      setCourses([...courses, ...fresh]);
      setIcsMsg(`已导入 ${fresh.length} 节（文件中共 ${out.length} 个事件）`);
    } catch { setIcsMsg("ICS 解析失败"); }
  };

  return (
    <div className="space-y-2">
      <CardHeader icon="schedule" title="课程表" sub={`今天${weekZh(now.getDay())}`}
        right={
          <button onClick={() => fileRef.current?.click()} title="从 ICS 日历文件导入"
            className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500 hover:bg-black/[0.09] transition-colors">ICS 导入</button>
        } />
      <input ref={fileRef} type="file" accept=".ics,text/calendar" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importIcs(f); e.target.value = ""; }} />
      {icsMsg && <div className="text-[10px] font-bold text-sky-600 px-1">{icsMsg}</div>}
      {current ? (
        <div className="px-3 py-2.5 rounded-2xl bg-emerald-500 text-white text-[12px] font-bold animate-fade-in shadow-sm shadow-emerald-500/30">
          正在上课：{current.name} · {current.start}-{current.end}{current.room && ` · ${current.room}`}
        </div>
      ) : next ? (
        <div className="px-3 py-2.5 rounded-2xl bg-sky-500/12 border border-sky-500/20 text-[12px] font-bold text-sky-700 dark:text-sky-300">
          下一节 {next.start} · {next.name}{next.room && ` · ${next.room}`}
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] text-[12px] text-neutral-500">今天{ todayList.length ? "课程已结束" : "没有课程"}</div>
      )}
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {courses.map((c) => (
          <div key={c.id} className="cb-row !py-1.5 text-[11px]">
            <span className="font-bold text-neutral-700 dark:text-neutral-200">周{["一", "二", "三", "四", "五", "六", "日"][c.day]}</span>
            <span className="text-neutral-400" style={{ fontVariantNumeric: "tabular-nums" }}>{c.start}-{c.end}</span>
            <span className="font-bold flex-1 truncate text-neutral-800 dark:text-neutral-100">{c.name}{c.room && <span className="font-normal text-neutral-400"> · {c.room}</span>}</span>
            <button className="cb-icon-btn !w-5 !h-5" onClick={() => setCourses(courses.filter((x) => x.id !== c.id))}><UiIcon k="x" size={10} /></button>
          </div>
        ))}
        {courses.length === 0 && <div className="cb-empty !py-3">在下方添加，或点右上 ICS 导入</div>}
      </div>
      <div className="flex gap-1.5">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="cb-input !w-auto text-[11px]">
          {[0, 1, 2, 3, 4, 5, 6].map((dd) => <option key={dd} value={dd}>周{["一", "二", "三", "四", "五", "六", "日"][dd]}</option>)}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="cb-input !w-[76px] text-[11px] !px-1" />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="cb-input !w-[76px] text-[11px] !px-1" />
      </div>
      <div className="flex gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="课程名" className="cb-input" />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="教室" className="cb-input !w-16 !px-2" />
        <button className="cb-btn-primary !px-3.5 flex items-center"
          onClick={() => {
            if (!name.trim()) return;
            setCourses([...courses, { id: uid(), day, start, end, name: name.trim(), room: room.trim() }]);
            setName(""); setRoom("");
          }}><UiIcon k="plus" size={13} /></button>
      </div>
    </div>
  );
}
