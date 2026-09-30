import { useMemo, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

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
      <CardHeader icon="picker" title="随机点名" sub={`${names.length} 人`} />
      <div className="min-h-[84px] flex items-center justify-center rounded-3xl bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border border-black/5 dark:border-white/10 px-3">
        {result === null ? <span className="text-[12px] text-neutral-400">点击下方点名</span>
          : Array.isArray(result) ? (
            <div className="flex flex-wrap gap-1.5 p-2 justify-center">
              {result.map((g, i) => <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300">{g}</span>)}
            </div>
          ) : <span className={`text-3xl font-black tracking-tight text-neutral-900 dark:text-white ${rolling ? "animate-pulse" : "animate-pop-in"}`}>{result}</span>}
      </div>
      {groups}
      <div className="flex gap-2">
        <button onClick={pick} disabled={!names.length || rolling} className="cb-btn-primary flex-1 !py-2.5 !text-[13px]">点一名</button>
        <div className="flex items-center gap-1.5">
          <input type="number" min={2} value={groupN} onChange={(e) => setGroupN(Number(e.target.value))} className="w-11 px-1 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] outline-none text-center text-[12px]" />
          <button className="cb-btn-ghost"
            onClick={() => {
              const arr = [...names].sort(() => Math.random() - 0.5);
              const n = Math.max(2, groupN);
              setResult(arr.slice(0, n));
            }}>分组抽</button>
        </div>
      </div>
      <textarea value={names.join("\n")} onChange={(e) => setNames(e.target.value.split(/[\n,，、\s]+/).map((s) => s.trim()).filter(Boolean))}
        placeholder="粘贴全班名单（一行一人，也可用逗号/空格分隔），自动保存" rows={3}
        className="cb-input resize-none !py-2.5" />
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="单个添加姓名" className="cb-input" />
        <button className="cb-btn-accent !px-3.5 flex items-center" onClick={() => { if (draft.trim()) { setNames([...names, draft.trim()]); setDraft(""); } }}><UiIcon k="plus" size={13} /></button>
        <button className="cb-btn-ghost" onClick={() => { setNames([]); setResult(null); }}>清空</button>
      </div>
    </div>
  );
}
