import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid } from "../lib/utils";

interface Todo { id: string; text: string; done: boolean; }

/** 待办 */
export default function TodosCard() {
  const [todos, setTodos] = usePersistentState<Todo[]>("todos:list", []);
  const [draft, setDraft] = useState("");
  const left = todos.filter((t) => !t.done).length;
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">✅ 待办 <span className="font-normal text-neutral-400">· 剩 {left} 项</span></div>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {todos.map((t) => (
          <label key={t.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/50 dark:bg-white/5 text-[12px] cursor-pointer">
            <input type="checkbox" checked={t.done} onChange={() => setTodos(todos.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} className="w-4 h-4 accent-emerald-500" />
            <span className={`flex-1 ${t.done ? "line-through text-neutral-400" : "font-medium"}`}>{t.text}</span>
            <button className="text-neutral-400 hover:text-red-500" onClick={(e) => { e.preventDefault(); setTodos(todos.filter((x) => x.id !== t.id)); }}>✕</button>
          </label>
        ))}
        {todos.length === 0 && <div className="text-center text-[11px] text-neutral-400 py-4">暂无待办，在下方添加</div>}
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { setTodos([...todos, { id: uid(), text: draft.trim(), done: false }]); setDraft(""); } }}
          placeholder="回车快速添加…" className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <button className="text-[12px] px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold"
          onClick={() => { if (draft.trim()) { setTodos([...todos, { id: uid(), text: draft.trim(), done: false }]); setDraft(""); } }}>＋</button>
      </div>
      {todos.some((t) => t.done) && (
        <button className="text-[11px] text-neutral-400 hover:text-red-500" onClick={() => setTodos(todos.filter((t) => !t.done))}>清除已完成</button>
      )}
    </div>
  );
}
