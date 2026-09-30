/** 截图 / 录屏：系统级能力入口说明（Tauri 内调用系统工具） */
export default function CaptureCard() {
  const tip = (s: string) => alert(s);
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">📸 截图 / 录屏</div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => tip("Windows: Win+Shift+S\nmacOS: Cmd+Shift+4\nLinux: Shift+Print")}
          className="py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[12px] font-bold">📸 系统截图<br /><span className="text-[10px] font-normal text-neutral-400">调用系统快捷键</span></button>
        <button onClick={() => tip("Windows: Win+G (Xbox Game Bar)\nmacOS: Cmd+Shift+5\nLinux: OBS / Peek")}
          className="py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[12px] font-bold">🎬 系统录屏<br /><span className="text-[10px] font-normal text-neutral-400">调用系统工具</span></button>
      </div>
      <div className="text-[10px] text-neutral-400 leading-relaxed px-1">
        轻量原则：不内置重型录屏引擎，直接唤起各平台原生截图/录屏能力，文件保存后可在「快捷方式」里快速打开课堂目录。
      </div>
    </div>
  );
}
