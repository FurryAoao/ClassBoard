import CardHeader from "../components/CardHeader";
import { FeatureIcon } from "../components/icons";

/** 截图 / 录屏：系统级能力入口说明（Tauri 内调用系统工具） */
export default function CaptureCard() {
  const tip = (s: string) => alert(s);
  return (
    <div className="space-y-2">
      <CardHeader icon="capture" title="截图 / 录屏" sub="调用系统能力" />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => tip("Windows: Win+Shift+S\nmacOS: Cmd+Shift+4\nLinux: Shift+Print")}
          className="py-5 rounded-3xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] hover:border-sky-500/40 hover:bg-sky-500/[0.04] transition-all active:scale-[0.98] group">
          <span className="flex justify-center text-sky-500"><FeatureIcon k="capture" size={20} /></span>
          <span className="block mt-1.5 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">系统截图</span>
          <span className="block text-[10px] font-normal text-neutral-400">调用系统快捷键</span>
        </button>
        <button onClick={() => tip("Windows: Win+G (Xbox Game Bar)\nmacOS: Cmd+Shift+5\nLinux: OBS / Peek")}
          className="py-5 rounded-3xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] hover:border-rose-500/40 hover:bg-rose-500/[0.04] transition-all active:scale-[0.98]">
          <span className="flex justify-center text-rose-500"><FeatureIcon k="display" size={20} /></span>
          <span className="block mt-1.5 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">系统录屏</span>
          <span className="block text-[10px] font-normal text-neutral-400">调用系统工具</span>
        </button>
      </div>
      <div className="text-[10px] text-neutral-400 leading-relaxed px-1">
        轻量原则：不内置重型录屏引擎，直接唤起各平台原生截图 / 录屏能力，文件保存后可在「快捷方式」里快速打开课堂目录。
      </div>
    </div>
  );
}
