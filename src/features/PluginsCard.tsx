import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid } from "../lib/utils";

interface Widget { id: string; title: string; body: string; }

/** 插件扩展：自定义文本小部件 */
export default function PluginsCard() {
  const [widgets, setWidgets] = usePersistentState<Widget[]>("plugins:widgets", []);
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">🧩 插件扩展 <span className="font-normal text-neutral-400">· 自定义小部件</span></div>
      {widgets.map((w) => (
        <div key={w.id} className="px-3 py-2.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold flex-1">{w.title}</span>
            <button className="text-neutral-400 hover:text-red-500 text-[11px]" onClick={() => setWidgets(widgets.filter((x) => x.id !== w.id))}>删除</button>
          </div>
          <div className="text-[11px] text-neutral-500 whitespace-pre-wrap">{w.body}</div>
        </div>
      ))}
      {widgets.length === 0 && <div className="text-center text-[11px] text-neutral-400 py-3">如下课倒计时牌、值日表…都可做成小部件</div>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="小部件标题" className="w-full text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="内容…" rows={2} className="w-full text-[12px] p-2.5 rounded-xl bg-black/5 dark:bg-black/30 outline-none resize-none" />
      <button className="w-full text-[12px] py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold"
        onClick={() => { if (!title.trim()) return; setWidgets([...widgets, { id: uid(), title: title.trim(), body }]); setTitle(""); setBody(""); }}>添加小部件</button>
    </div>
  );
}
