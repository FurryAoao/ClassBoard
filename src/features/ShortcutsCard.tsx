import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid, isTauri } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

interface Link { id: string; name: string; target: string; kind: "file" | "web"; }

/** 文件 / 文件夹 / 网页快捷方式 */
export default function ShortcutsCard() {
  const [links, setLinks] = usePersistentState<Link[]>("shortcuts:list", []);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const open = async (l: Link) => {
    if (!isTauri()) { window.open(l.target, "_blank"); return; }
    try {
      const { openUrl, openPath } = await import("@tauri-apps/plugin-opener");
      if (l.kind === "web") await openUrl(l.target);
      else await openPath(l.target);
    } catch { window.open(l.target, "_blank"); }
  };

  return (
    <div className="space-y-2">
      <CardHeader icon="shortcuts" title="快捷方式" sub="文件 / 网址" />
      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] hover:border-black/10 transition-colors">
            <span className="text-neutral-400 shrink-0"><UiIcon k={l.kind === "web" ? "globe" : "file"} size={13} /></span>
            <button className="flex-1 text-left text-[12px] font-bold truncate text-neutral-800 dark:text-neutral-100" title={l.target} onClick={() => open(l)}>{l.name}</button>
            <button className="cb-icon-btn !w-5 !h-5" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}><UiIcon k="x" size={10} /></button>
          </div>
        ))}
        {links.length === 0 && <div className="col-span-2 cb-empty">还没有快捷方式，在下方添加</div>}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名称，如：三年二班课件" className="cb-input" />
      <div className="flex gap-1.5">
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="路径或网址 https://…" className="cb-input" />
        <button className="cb-btn-primary"
          onClick={() => {
            if (!name.trim() || !target.trim()) return;
            setLinks([...links, { id: uid(), name: name.trim(), target: target.trim(), kind: /^https?:/i.test(target) ? "web" : "file" }]);
            setName(""); setTarget("");
          }}>添加</button>
      </div>
    </div>
  );
}
