import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Todo { id: string; text: string; done: boolean; }

/** 待办 */
export default function TodosCard() {
  const [todos, setTodos] = usePersistentState<Todo[]>("todos:list", []);
  const [draft, setDraft] = useState("");
  const left = todos.filter((t) => !t.done).length;
  const add = () => { if (draft.trim()) { setTodos([...todos, { id: uid(), text: draft.trim(), done: false }]); setDraft(""); } };
  return (
    <div className="space-y-2">
      <CardHeader icon="todos" title="待办" sub={left > 0 ? `剩 ${left} 项` : "全部完成"} />
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {todos.map((t) => (
          <label key={t.id} className="cb-row cursor-pointer hover:border-black/10 dark:hover:border-white/15 transition-colors">
            <input type="checkbox" checked={t.done} onChange={() => setTodos(todos.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} className="w-4 h-4 accent-emerald-500 shrink-0" />
            <span className={`flex-1 text-[12px] ${t.done ? "line-through text-neutral-400" : "font-medium text-neutral-800 dark:text-neutral-100"}`}>{t.text}</span>
            <button className="cb-icon-btn !w-5 !h-5" onClick={(e) => { e.preventDefault(); setTodos(todos.filter((x) => x.id !== t.id)); }}><UiIcon k="x" size={10} /></button>
          </label>
        ))}
        {todos.length === 0 && <div className="cb-empty">暂无待办，在下方添加</div>}
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="回车快速添加" className="cb-input" />
        <button className="cb-btn-primary !px-3.5 flex items-center" onClick={add}><UiIcon k="plus" size={13} /></button>
      </div>
      {todos.some((t) => t.done) && (
        <button className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors" onClick={() => setTodos(todos.filter((t) => !t.done))}>清除已完成</button>
      )}
    </div>
  );
}
