import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Widget { id: string; title: string; body: string; }

/** 插件扩展：自定义文本小部件（值日表 / 倒计时牌 / 口号） */
export default function PluginsCard() {
  const [widgets, setWidgets] = usePersistentState<Widget[]>("plugins:widgets", []);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const add = () => { if (!title.trim()) return; setWidgets([...widgets, { id: uid(), title: title.trim(), body }]); setTitle(""); setBody(""); };
  return (
    <div className="space-y-2">
      <CardHeader icon="plugins" title="插件扩展" sub={`${widgets.length} 个小部件`} />
      {widgets.map((wd) => (
        <div key={wd.id} className="cb-panel-card">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold flex-1 truncate text-neutral-800 dark:text-neutral-100">{wd.title}</span>
            <button title="改内容" className="cb-icon-btn !w-6 !h-6 !hover:text-sky-500" onClick={() => { setEditing(editing === wd.id ? null : wd.id); setEditBody(wd.body); }}>
              <UiIcon k="sliders" size={11} />
            </button>
            <button title="复制一份" className="cb-icon-btn !w-6 !h-6 !hover:text-sky-500" onClick={() => setWidgets([...widgets, { ...wd, id: uid(), title: wd.title + "·副本" }])}>
              <UiIcon k="plus" size={10} />
            </button>
            <button title="删除" className="cb-icon-btn !w-6 !h-6" onClick={() => setWidgets(widgets.filter((x) => x.id !== wd.id))}><UiIcon k="x" size={10} /></button>
          </div>
          {editing === wd.id ? (
            <div className="mt-1.5 flex gap-1.5">
              <input autoFocus value={editBody} onChange={(e) => setEditBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setWidgets(widgets.map((x) => x.id === wd.id ? { ...x, body: editBody } : x)); setEditing(null); } if (e.key === "Escape") setEditing(null); }}
                className="cb-input !py-1.5" />
              <button className="cb-btn-accent !py-1.5" onClick={() => { setWidgets(widgets.map((x) => x.id === wd.id ? { ...x, body: editBody } : x)); setEditing(null); }}>
                <UiIcon k="check" size={12} />
              </button>
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-neutral-500 whitespace-pre-wrap">{wd.body || "（空内容，点左侧按钮补充）"}</div>
          )}
        </div>
      ))}
      {widgets.length === 0 && <div className="cb-empty">如下课倒计时牌、值日表，都可做成小部件</div>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="小部件标题" className="cb-input" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="内容" rows={2} className="cb-input resize-none !py-2.5" />
      <button className="cb-btn-primary w-full !py-2.5" onClick={add}>添加小部件</button>
    </div>
  );
}
