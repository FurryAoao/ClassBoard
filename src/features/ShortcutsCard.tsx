import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { uid, isTauri } from "../lib/utils";

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
      <div className="text-[12px] font-bold">🔗 快捷方式 <span className="font-normal text-neutral-400">· 文件/文件夹/网址</span></div>
      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <button className="flex-1 text-left text-[12px] font-bold truncate" title={l.target} onClick={() => open(l)}>
              {l.kind === "web" ? "🌐" : "📁"} {l.name}
            </button>
            <button className="text-neutral-400 hover:text-red-500" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}>✕</button>
          </div>
        ))}
        {links.length === 0 && <div className="col-span-2 text-center text-[11px] text-neutral-400 py-4">还没有快捷方式，在下方添加</div>}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名称，如：三年二班课件"
        className="w-full text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
      <div className="flex gap-2">
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="路径或网址 https://…"
          className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <button className="text-[12px] px-3 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold"
          onClick={() => {
            if (!name.trim() || !target.trim()) return;
            setLinks([...links, { id: uid(), name: name.trim(), target: target.trim(), kind: /^https?:/i.test(target) ? "web" : "file" }]);
            setName(""); setTarget("");
          }}>添加</button>
      </div>
    </div>
  );
}
