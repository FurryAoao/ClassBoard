import { useMemo, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";

/** 随机点名 / 分组 */
export default function PickerCard() {
  const [names, setNames] = usePersistentState<string[]>("picker:names", []);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<string | string[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [groupN, setGroupN] = useState(4);

  const pick = () => {
    if (!names.length) return;
    setRolling(true);
    let i = 0;
    const t = setInterval(() => {
      setResult(names[Math.floor(Math.random() * names.length)]);
      if (++i > 10) { clearInterval(t); setRolling(false); }
    }, 70);
  };
  const groups = useMemo(() => {
    if (!Array.isArray(result) || !result) return null;
    return result as string[];
  }, [result]);

  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">🎲 随机点名 <span className="font-normal text-neutral-400">· {names.length} 人</span></div>
      <div className="min-h-[76px] flex items-center justify-center rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
        {result === null ? <span className="text-[12px] text-neutral-400">点击下方点名</span>
          : Array.isArray(result) ? (
            <div className="flex flex-wrap gap-1.5 p-2 justify-center">
              {result.map((g, i) => <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-sky-500/15">{g}</span>)}
            </div>
          ) : <span className={`text-2xl font-black ${rolling ? "animate-pulse" : "animate-pop-in"}`}>{result}</span>}
      </div>
      {groups}
      <div className="flex gap-2">
        <button onClick={pick} disabled={!names.length || rolling} className="flex-1 text-[13px] py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold disabled:opacity-40">🎲 点一名</button>
        <div className="flex items-center gap-1 text-[11px]">
          <input type="number" min={2} value={groupN} onChange={(e) => setGroupN(Number(e.target.value))} className="w-11 px-1.5 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none text-center" />
          <button className="px-2.5 py-2 rounded-xl bg-black/5 dark:bg-white/10 font-bold"
            onClick={() => {
              const arr = [...names].sort(() => Math.random() - 0.5);
              const n = Math.max(2, groupN);
              setResult(arr.slice(0, n));
            }}>分组抽</button>
        </div>
      </div>
      <textarea value={names.join("\n")} onChange={(e) => setNames(e.target.value.split(/[\n,，、\s]+/).map((s) => s.trim()).filter(Boolean))}
        placeholder="粘贴全班名单（一行一人，也可用逗号/空格分隔），自动保存" rows={3}
        className="w-full text-[12px] p-2.5 rounded-xl bg-black/5 dark:bg-black/30 outline-none resize-none" />
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="单个添加姓名" className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <button className="text-[12px] px-3 rounded-xl bg-sky-500 text-white font-bold" onClick={() => { if (draft.trim()) { setNames([...names, draft.trim()]); setDraft(""); } }}>＋</button>
        <button className="text-[11px] px-2.5 rounded-xl bg-black/5 dark:bg-white/10" onClick={() => { setNames([]); setResult(null); }}>清空</button>
      </div>
    </div>
  );
}
