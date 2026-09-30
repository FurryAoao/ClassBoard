import { usePersistentState } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

/** 剪贴板历史：手动收藏模式（轻量，不常驻监听） */
export default function ClipboardCard() {
  const [items, setItems] = usePersistentState<string[]>("clipboard:list", []);
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t && !items.includes(t)) setItems([t, ...items].slice(0, 30));
    } catch { alert("浏览器预览限制：请允许剪贴板读取，或在桌面端使用"); }
  };
  return (
    <div className="space-y-2">
      <CardHeader icon="clipboard" title="剪贴板历史" sub="最多 30 条" />
      <button onClick={paste} className="cb-btn-primary w-full !py-2.5 flex items-center justify-center gap-1.5"><UiIcon k="plus" size={13} />收藏当前剪贴板</button>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {items.map((t, i) => (
          <div key={i} className="cb-row !py-2 text-[11px]">
            <span className="flex-1 truncate text-neutral-700 dark:text-neutral-200">{t}</span>
            <button className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0" onClick={() => navigator.clipboard?.writeText(t).catch(() => {})}>复制</button>
            <button className="cb-icon-btn !w-5 !h-5" onClick={() => setItems(items.filter((_, j) => j !== i))}><UiIcon k="x" size={10} /></button>
          </div>
        ))}
        {items.length === 0 && <div className="cb-empty">点上方按钮把常用板书 / 链接收进来</div>}
      </div>
    </div>
  );
}
