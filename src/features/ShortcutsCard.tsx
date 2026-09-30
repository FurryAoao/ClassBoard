import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid, isTauri } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Link { id: string; name: string; target: string; kind: "file" | "web"; }

/** 文件 / 网址快捷方式：上课一键直达课件 */
export default function ShortcutsCard() {
  const [links, setLinks] = usePersistentState<Link[]>("shortcuts:list", []);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState("");

  const pickFile = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const sel = await open({ multiple: false });
      if (typeof sel === "string") {
        setTarget(sel);
        if (!name.trim()) {
          const base = sel.replace(/\\/g, "/").split("/").pop() ?? sel;
          setName(base.replace(/\.[a-z0-9]+$/i, "").slice(0, 24));
        }
      }
    } catch { setMsg("调不出文件框：请手动粘贴路径"); }
  };

  const open = async (l: Link) => {
    setMsg("");
    if (!isTauri()) { window.open(l.target, "_blank"); return; }
    try {
      const { openUrl, openPath } = await import("@tauri-apps/plugin-opener");
      if (l.kind === "web") await openUrl(l.target);
      else await openPath(l.target);
    } catch { setMsg(`打不开：${l.target.slice(0, 60)}`); }
  };

  const add = () => {
    if (!name.trim() || !target.trim()) { setMsg("名称和路径都要填"); return; }
    setLinks([...links, { id: uid(), name: name.trim(), target: target.trim(), kind: /^https?:/i.test(target.trim()) ? "web" : "file" }]);
    setName(""); setTarget(""); setMsg("已添加");
  };

  return (
    <div className="space-y-2">
      <CardHeader icon="shortcuts" title="快捷方式" sub={`${links.length} 个直达`} />
      {msg && <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 px-1 animate-fade-in">{msg}</div>}
      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] hover:border-black/15 dark:hover:border-white/20 transition-colors">
            <span className="text-neutral-400 shrink-0"><UiIcon k={l.kind === "web" ? "globe" : "file"} size={13} /></span>
            <button className="flex-1 text-left text-[12px] font-bold truncate text-neutral-800 dark:text-neutral-100" title={l.target} onClick={() => open(l)}>{l.name}</button>
            <button className="cb-icon-btn !w-5 !h-5" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}><UiIcon k="x" size={10} /></button>
          </div>
        ))}
        {links.length === 0 && <div className="col-span-2 cb-empty">把课件 / 班级相册 / 网址收进来，上课一键直达</div>}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名称，如：三年二班课件" className="cb-input" />
      <div className="flex gap-1.5">
        <input value={target} onChange={(e) => setTarget(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="路径或网址 https://…" className="cb-input" />
        {isTauri() && <button className="cb-btn-ghost shrink-0" title="从系统选文件" onClick={pickFile}>浏览</button>}
        <button className="cb-btn-primary shrink-0" onClick={add}>添加</button>
      </div>
    </div>
  );
}
