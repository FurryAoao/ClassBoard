import { useEffect, useRef, useState } from "react";
import { useSettings } from "../store/useSettings";
import { FEATURE_META, FEATURE_ORDER, isTauri } from "../lib/utils";
import { FeatureIcon, UiIcon } from "./icons";
import { FEATURE_TINT } from "./CardHeader";
import pkg from "../../package.json";

const APP_VERSION: string = pkg.version;

/** 应用内更新日志（与 README 版本演进表同源，保持简短） */
const CHANGELOG: [string, string][] = [
  ["v2.3 铃留痕", "上次铃声是哪节"],
  ["v2.2 预备铃", "课前几分钟先响一声"],
  ["v2.1 先听为快", "课表页试听上下课铃"],
  ["v2.0 上下课铃", "到点自动响，课表页可开关"],
  ["v1.9 听得见", "到点哔声提醒，设置页可开关"],
  ["v1.8 课表防撞", "撞时间自动拦，导入跳过计数"],
  ["v1.7 一眼在手", "首页实时角标，胶囊专注倒计时"],
  ["v1.6 考勤收尾", "考勤保存框导出，缺勤名单复制发群"],
  ["v1.5 带得走", "白板存图，课表导出，待办复制发群"],
  ["v1.4 投屏统一", "白板投屏同源，互切不打架"],
  ["v1.3 课前三秒", "快捷置顶，板书钉选一键复制"],
  ["v1.2 后台专注", "切卡收起照跑，跑完记轮，关即暂停"],
  ["v1.1 后台计时", "切卡收起照跑，胶囊标签轮显，关即暂停"],
  ["v1.0 收官", "快捷键一览 + 关于页，版本号应用内对齐"],
  ["v0.9 串起来", "日历课表联动、小结同步记入日历、截图直达快捷方式"],
  ["v0.8 座位表", "点名座位模式，讲台 + 可调列数，上课点座位打考勤"],
  ["v0.7 周览秒开", "课表周视图，功能卡懒加载，主包减负约两成"],
  ["v0.6 打磨", "搜索跳过内部键，文档去符号化"],
  ["v0.5 稳字当头", "窗口位置记忆，缩放锚定，备份版本兼容"],
  ["v0.4 下课流", "下课小结记入待办/小部件，课间倒计时接下一节"],
  ["v0.3 上课流", "一键开课串起计时、点名、专注"],
  ["v0.2 课堂闭环", "单实例运行，开机自启"],
];

const SHORTCUTS: [string, string][] = [
  ["唤起 / 展开", "Alt + Space 或 Ctrl + `"],
  ["收起", "Esc"],
  ["固定展开", "点右上图钉，鼠标离开不收起"],
  ["自动展开 / 收起", "悬停 120ms 展开 · 离开 320ms 收起"],
];

export default function SettingsView() {
  const { enabled, toggleFeature, exportAll, importAll } = useSettings();
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");
  const [soundOn, setSoundOnState] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const onCount = FEATURE_ORDER.filter((k) => enabled[k]).length;
  const [autoOn, setAutoOn] = useState<boolean | null>(null);
  const [showLog, setShowLog] = useState(false);
  useEffect(() => {
    if (!isTauri()) { setAutoOn(false); return; }
    import("@tauri-apps/plugin-autostart").then(({ isEnabled }) => isEnabled().then(setAutoOn).catch(() => setAutoOn(false)));
  }, []);
  useEffect(() => {
    import("../lib/sound").then(({ isSoundOn }) => setSoundOnState(isSoundOn()));
  }, []);

  const downloadFile = async () => {
    const j = await exportAll();
    setJson(j);
    const name = `classboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (isTauri()) {
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({ defaultPath: name, filters: [{ name: "JSON", extensions: ["json"] }] });
        if (path) { await writeTextFile(path, j); setMsg(`已保存到 ${path}`); }
        return;
      } catch { /* fallback to browser download */ }
    }
    const blob = new Blob([j], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg("已导出文件 + 下方文本框，复制保存均可。");
  };

  const readFile = async (f: File) => {
    try {
      const text = await f.text();
      setJson(text);
      await importAll(text);
      setMsg("导入成功，已刷新。");
    } catch (e) { setMsg(`导入失败：${e instanceof Error ? e.message : "文件不是有效的 ClassBoard 备份"}`); }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-0.5">
        <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center"><UiIcon k="sliders" size={14} /></span>
        <span className="text-[13px] font-bold tracking-tight">功能开关</span>
        <span className="cb-chip bg-emerald-500/15 text-emerald-600 !text-[10px]">{onCount} / {FEATURE_ORDER.length} 开启</span>
      </div>
      <div className="flex gap-1.5">
        <button className="cb-btn-ghost flex-1 !py-1.5 !text-[11px]" onClick={() => {
          const { setFeature } = useSettings.getState();
          FEATURE_ORDER.forEach((k) => { if (k !== "clock") setFeature(k, true); });
          setMsg("已全部开启");
        }}>全部开启</button>
        <button className="cb-btn-ghost flex-1 !py-1.5 !text-[11px]" onClick={() => {
          const { setFeature } = useSettings.getState();
          FEATURE_ORDER.forEach((k) => { if (k !== "clock") setFeature(k, false); });
          setMsg("已只留时钟（默认唯时）");
        }}>只留时钟</button>
      </div>
      <div className="text-[10px] text-neutral-400 px-0.5 -mt-1">关闭后隐藏入口 / 停止任务 / 保留数据</div>
      <label className="flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
        <span className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <UiIcon k="logo" size={15} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-bold text-neutral-800 dark:text-neutral-100">开机自启</span>
          <span className="block text-[10px] text-neutral-400 truncate">教师机每天重启，开机即回右下角{isTauri() ? "" : "（桌面端可用）"}</span>
        </span>
        <button
          onClick={async (e) => {
            e.preventDefault();
            if (!isTauri()) { setMsg("浏览器预览不支持，桌面端可用"); return; }
            try {
              const m = await import("@tauri-apps/plugin-autostart");
              if (autoOn) await m.disable(); else await m.enable();
              setAutoOn(!autoOn);
              setMsg(autoOn ? "已关闭开机自启" : "已开启开机自启");
            } catch { setMsg("系统不支持开机自启"); }
          }}
          className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${autoOn ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
          title={autoOn ? "点击关闭" : "点击开启"}
        >
          <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${autoOn ? "left-[20px]" : "left-[2px]"}`} />
        </button>
      </label>
      <div className="flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
        <span className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <FeatureIcon k="timer" size={15} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-bold text-neutral-800 dark:text-neutral-100">到点哔声提醒</span>
          <span className="block text-[10px] text-neutral-400 truncate">计时/专注跑完响三声，收起也能听见</span>
        </span>
        <button
          onClick={async (e) => {
            e.preventDefault();
            const { setSoundOn } = await import("../lib/sound");
            const next = !soundOn;
            setSoundOn(next);
            setSoundOnState(next);
            setMsg(next ? "已开启到点提醒" : "已关闭到点提醒");
          }}
          className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${soundOn ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
          title={soundOn ? "点击关闭" : "点击开启"}
        >
          <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${soundOn ? "left-[20px]" : "left-[2px]"}`} />
        </button>
      </div>
      <div className="flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
        <span className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <UiIcon k="logo" size={15} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-bold text-neutral-800 dark:text-neutral-100">窗口位置</span>
          <span className="block text-[10px] text-neutral-400 truncate">拖动后自动记住，下次启动回到原位</span>
        </span>
        <button
          onClick={async (e) => {
            e.preventDefault();
            try {
              localStorage.removeItem("cb:pos");
              if (isTauri()) {
                const { dockWindow } = await import("../lib/utils");
                const s = useSettings.getState();
                await dockWindow(s.expanded ? 368 : 232, s.expanded ? 560 : 56);
              }
              setMsg("窗口已回右下角，位置记忆已清除");
            } catch { setMsg("浏览器预览无需定位"); }
          }}
          className="cb-btn-ghost !py-1.5 !px-3 !text-[11px] shrink-0"
        >
          回右下角
        </button>
      </div>
      <div className="space-y-1.5">
        {FEATURE_ORDER.map((k) => (
          <label key={k} className="flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] cursor-pointer hover:border-black/10 dark:hover:border-white/15 transition-colors">
            <span className={`w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 ${FEATURE_TINT[k]}`}><FeatureIcon k={k} size={15} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-bold text-neutral-800 dark:text-neutral-100">{FEATURE_META[k].name}
                {k === "clock" && <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">默认开</span>}
              </span>
              <span className="block text-[10px] text-neutral-400 truncate">{FEATURE_META[k].desc}</span>
            </span>
            <button
              onClick={(e) => { e.preventDefault(); toggleFeature(k); }}
              className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${enabled[k] ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
              title={enabled[k] ? "点击关闭" : "点击开启"}
            >
              <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${enabled[k] ? "left-[20px]" : "left-[2px]"}`} />
            </button>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 px-0.5 pt-1">
        <span className="w-6 h-6 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center"><FeatureIcon k="shortcuts" size={14} /></span>
        <span className="text-[13px] font-bold tracking-tight">快捷键</span>
      </div>
      <div className="cb-panel-card !py-1.5 space-y-0.5">
        {SHORTCUTS.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-[11px] py-1">
            <span className="text-neutral-500 shrink-0">{k}</span>
            <span className="ml-auto font-mono font-bold text-neutral-800 dark:text-neutral-100 bg-black/[0.05] dark:bg-white/[0.08] px-2 py-0.5 rounded-lg">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-0.5 pt-1">
        <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center"><UiIcon k="logo" size={14} /></span>
        <span className="text-[13px] font-bold tracking-tight">关于</span>
        <span className="cb-chip bg-sky-500/15 text-sky-600 !text-[10px]">v{APP_VERSION}</span>
      </div>
      <div className="cb-panel-card space-y-1">
        <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-100">ClassBoard · 师者屏隅轻辅</div>
        <div className="text-[10px] text-neutral-400 leading-relaxed">悬停即启，一窗百用，默认唯时，诸能可择。本地优先，不登录不联网也能用。</div>
        <button onClick={() => setShowLog(!showLog)} className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
          {showLog ? "收起更新日志" : "查看更新日志"}
        </button>
        {showLog && (
          <div className="space-y-1 pt-0.5 animate-slide-up">
            {CHANGELOG.map(([v, d]) => (
              <div key={v} className="flex gap-2 text-[10px] leading-relaxed">
                <span className="font-black text-neutral-700 dark:text-neutral-200 shrink-0">{v}</span>
                <span className="text-neutral-500">{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-0.5 pt-1">
        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><UiIcon k="database" size={14} /></span>
        <span className="text-[13px] font-bold tracking-tight">本地数据 · 导出 / 导入</span>
      </div>
      <div className="flex gap-1.5">
        <button className="cb-btn-primary flex-1" onClick={downloadFile}>导出备份文件</button>
        <button className="cb-btn-ghost flex-1" onClick={() => fileRef.current?.click()}>从文件导入</button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
      </div>
      <div className="flex gap-1.5">
        <button className="cb-btn-ghost flex-1 !text-[11px]"
          onClick={async () => { const j = await exportAll(); setJson(j); setMsg("已导出到下方文本框，复制保存即可。"); }}>
          导出到文本框
        </button>
        <button className="cb-btn-ghost flex-1 !text-[11px]"
          onClick={async () => {
            try { await importAll(json); setMsg("导入成功，已刷新。"); } catch (e) { setMsg(`导入失败：${e instanceof Error ? e.message : "JSON 格式不正确"}`); }
          }}>
          从文本框导入
        </button>
      </div>
      <textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder="文本框方式：导出 JSON 显示在这里；粘贴备份后点导入"
        className="cb-input !h-20 !text-[10px] font-mono resize-none" />
      {msg && <div className="text-[11px] font-bold text-emerald-600 px-1">{msg}</div>}
      <div className="text-[10px] text-neutral-400 px-1 pb-2 text-center">本地优先 · SQLite + localStorage 双存 · 不登录不联网也能用</div>
    </div>
  );
}
