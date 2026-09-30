import { useMemo, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { weekZh, uid } from "../lib/utils";

interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }

/** 课程表与当前课程 */
export default function ScheduleCard() {
  const [courses, setCourses] = usePersistentState<Course[]>("schedule:list", []);
  const [name, setName] = useState(""); const [day, setDay] = useState(1);
  const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("08:45");
  const [room, setRoom] = useState("");
  const now = useNow(true);

  const current = useMemo(() => {
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const d = (now.getDay() + 6) % 7; // 周一=0
    return courses.find((c) => c.day === d && c.start <= t && t <= c.end) ?? null;
  }, [courses, now]);

  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">📚 课程表 <span className="font-normal text-neutral-400">· 今天{weekZh(now.getDay())}</span></div>
      {current ? (
        <div className="px-3 py-2.5 rounded-2xl bg-emerald-500 text-white text-[12px] font-bold animate-fade-in">
          正在上课：{current.name} · {current.start}-{current.end}{current.room && ` · ${current.room}`}
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 text-[12px] text-neutral-500">当前没有课程</div>
      )}
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {courses.map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-xl bg-white/50 dark:bg-white/5">
            <span className="font-bold">周{["一", "二", "三", "四", "五", "六", "日"][c.day]}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{c.start}-{c.end}</span>
            <span className="font-bold flex-1 truncate">{c.name}{c.room && ` · ${c.room}`}</span>
            <button className="text-neutral-400 hover:text-red-500" onClick={() => setCourses(courses.filter((x) => x.id !== c.id))}>✕</button>
          </div>
        ))}
        {courses.length === 0 && <div className="text-center text-[11px] text-neutral-400 py-2">在下方添加本周课程</div>}
      </div>
      <div className="flex gap-1.5">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="text-[11px] px-1.5 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>周{["一", "二", "三", "四", "五", "六", "日"][d]}</option>)}
        </select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-[74px] text-[11px] px-1 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-[74px] text-[11px] px-1 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
      </div>
      <div className="flex gap-1.5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="课程名" className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="教室" className="w-16 text-[12px] px-2 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <button className="text-[12px] px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold"
          onClick={() => {
            if (!name.trim()) return;
            setCourses([...courses, { id: uid(), day, start, end, name: name.trim(), room: room.trim() }]);
            setName(""); setRoom("");
          }}>＋</button>
      </div>
    </div>
  );
}
