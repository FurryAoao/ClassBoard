import { useMemo, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { saveFile, stampName } from "../lib/export-file";
import { uid } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Todo { id: string; text: string; done: boolean; }

/** 待办：进度条 + 未完成优先 + 双击改名 */
export default function TodosCard() {
  const [todos, setTodos] = usePersistentState<Todo[]>("todos:list", []);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const copyLeft = async () => {
    const leftTodos = todos.filter((t) => !t.done);
    if (!leftTodos.length) { setCopyMsg("没有未完成项"); return; }
    const text = leftTodos.map((t, i) => `${i + 1}. ${t.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`已复制 ${leftTodos.length} 项，发群里直接粘贴`);
    } catch { setCopyMsg("复制失败：请手动长按复制"); }
    setTimeout(() => setCopyMsg(""), 2500);
  };
  const left = todos.filter((t) => !t.done).length;
  const pct = todos.length ? Math.round(((todos.length - left) / todos.length) * 100) : 0;
  const exportTxt = async () => {
    if (!todos.length) { setCopyMsg("没有待办可导出"); return; }
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    const lines = todos.map((t) => `${t.done ? "[x]" : "[ ]"} ${t.text}`);
    const text = `ClassBoard 待办（${stamp}，剩 ${left} 项）\n${lines.join("\n")}\n`;
    try {
      const where = await saveFile(stampName("classboard-todos", "txt"), `\uFEFF${text}`);
      setCopyMsg(where ? `已导出 ${todos.length} 项` : "已取消");
    } catch { setCopyMsg("导出失败，再试一次"); }
    setTimeout(() => setCopyMsg(""), 2500);
  };
  const sorted = useMemo(() => [...todos].sort((a, b) => Number(a.done) - Number(b.done)), [todos]);
  const add = () => { if (draft.trim()) { setTodos([...todos, { id: uid(), text: draft.trim(), done: false }]); setDraft(""); } };
  const commitEdit = (id: string) => {
    if (editText.trim()) setTodos(todos.map((x) => x.id === id ? { ...x, text: editText.trim() } : x));
    setEditing(null);
  };
  return (
    <div className="space-y-2">
      <CardHeader icon="todos" title="待办" sub={todos.length ? (left > 0 ? `剩 ${left} 项 · ${pct}%` : "全部完成") : "记下课前课后要做的事"} />
      {todos.length > 0 && (
        <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="space-y-1 max-h-52 overflow-y-auto">
        {sorted.map((t) => (
          <label key={t.id} className="cb-row cursor-pointer hover:border-black/10 dark:hover:border-white/15 transition-colors">
            <input type="checkbox" checked={t.done} onChange={() => setTodos(todos.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} className="w-4 h-4 accent-emerald-500 shrink-0" />
            {editing === t.id ? (
              <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                onBlur={() => commitEdit(t.id)} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(t.id); if (e.key === "Escape") setEditing(null); }}
                onClick={(e) => e.preventDefault()} className="flex-1 text-[12px] bg-transparent outline-none border-b border-sky-500" />
            ) : (
              <span onDoubleClick={(e) => { e.preventDefault(); setEditing(t.id); setEditText(t.text); }} title="双击改名"
                className={`flex-1 text-[12px] truncate ${t.done ? "line-through text-neutral-400" : "font-medium text-neutral-800 dark:text-neutral-100"}`}>{t.text}</span>
            )}
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
      <div className="flex items-center gap-2">
        {todos.length > 0 && (
          <button className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline" title="把全部待办存成文本文件（已完成打勾）" onClick={() => void exportTxt()}>导出文本</button>
        )}
        {left > 0 && (
          <button className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline" title="把未完成项拼成序号文本，复制发群" onClick={() => void copyLeft()}>复制未完成</button>
        )}
        {todos.some((t) => t.done) && (
          <button className="ml-auto text-[11px] text-neutral-400 hover:text-red-500 transition-colors" onClick={() => setTodos(todos.filter((t) => !t.done))}>清除已完成</button>
        )}
      </div>
      {copyMsg && <div className="text-[10px] font-bold text-sky-600 px-1">{copyMsg}</div>}
    </div>
  );
}
