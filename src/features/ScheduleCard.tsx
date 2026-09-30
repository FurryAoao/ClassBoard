import { useMemo, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { weekZh, uid } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

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
    const d = (now.getDay() + 6) % 7;
    return courses.find((c) => c.day === d && c.start <= t && t <= c.end) ?? null;
  }, [courses, now]);

  return (
    <div className="space-y-2">
      <CardHeader icon="schedule" title="课程表" sub={`今天${weekZh(now.getDay())}`} />
      {current ? (
        <div className="px-3 py-2.5 rounded-2xl bg-emerald-500 text-white text-[12px] font-bold animate-fade-in shadow-sm shadow-emerald-500/30">
          正在上课：{current.name} · {current.start}-{current.end}{current.room && ` · ${current.room}`}
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] text-[12px] text-neutral-500">当前没有课程</div>
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
        {courses.length === 0 && <div className="cb-empty !py-3">在下方添加本周课程</div>}
      </div>
      <div className="flex gap-1.5">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="cb-input !w-auto text-[11px]">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>周{["一", "二", "三", "四", "五", "六", "日"][d]}</option>)}
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
