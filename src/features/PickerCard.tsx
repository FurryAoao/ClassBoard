import { useMemo, useRef, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";
import { useLesson } from "../store/useLesson";
import { saveFile, stampName } from "../lib/export-file";

/** 随机点名 / 分组：不重复点完一轮 + 历史 */
export default function PickerCard() {
  const { activeCourse } = useLesson();
  const [check, setCheck] = usePersistentState<Record<string, string>>("picker:check", {});
  const [names, setNames] = usePersistentState<string[]>("picker:names", []);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<string | string[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [groupN, setGroupN] = useState(4);
  const [picked, setPicked] = usePersistentState<string[]>("picker:picked", []);
  const [fair, setFair] = usePersistentState("picker:fair", true);
  const [seatMode, setSeatMode] = usePersistentState("picker:seat", false);
  const [cols, setCols] = usePersistentState("picker:cols", 6);
  const [csvMsg, setCsvMsg] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [rosterMsg, setRosterMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // 名单快导：从 txt/csv 文件读名单，自动按行/逗号/空格拆，去重并入
  const importRoster = async (f: File) => {
    try {
      const text = await f.text();
      const incoming = text.split(/[\n,，、\s;；]+/).map((s) => s.trim()).filter(Boolean);
      if (!incoming.length) { setRosterMsg("文件里没读到名字"); return; }
      const seen = new Set(names);
      const fresh: string[] = [];
      for (const n of incoming) {
        if (!seen.has(n)) { seen.add(n); fresh.push(n); }
      }
      if (!fresh.length) { setRosterMsg("名单都已在，无新增"); return; }
      setNames([...names, ...fresh]);
      setPicked([]);
      setRosterMsg(`已导入 ${fresh.length} 人（文件共 ${incoming.length} 个名字）`);
    } catch { setRosterMsg("导入失败，再试一次"); }
    setTimeout(() => setRosterMsg(""), 2500);
  };
  // 考勤导出：走统一存文件帮手，桌面端弹保存框，浏览器直接下载；不开课也能导
  const exportCsv = async () => {
    if (!names.length) return;
    try {
      const lines = ["\uFEFF姓名,状态"];
      names.forEach((n) => lines.push(`${n},${check[n] ?? "未点"}`));
      const label = activeCourse ? activeCourse.name : new Date().toISOString().slice(0, 10);
      const where = await saveFile(stampName(`${label}-考勤`, "csv"), lines.join("\n"));
      setCsvMsg(where ? `已导出 ${names.length} 人${where.length > 24 ? "到 …" + where.slice(-24) : ""}` : "已取消");
    } catch { setCsvMsg("导出失败，再试一次"); }
    setTimeout(() => setCsvMsg(""), 2500);
  };
  // 复制缺勤名单：缺 + 假 + 未点，一行发群
  const copyAbsence = async () => {
    const que = names.filter((n) => check[n] === "缺");
    const jia = names.filter((n) => check[n] === "假");
    const un = names.filter((n) => !check[n]);
    if (!que.length && !jia.length && !un.length) { setCopyMsg("全员到齐"); setTimeout(() => setCopyMsg(""), 2000); return; }
    const parts: string[] = [];
    if (que.length) parts.push(`缺 ${que.length} 人：${que.join("、")}`);
    if (jia.length) parts.push(`假 ${jia.length} 人：${jia.join("、")}`);
    if (un.length) parts.push(`未点 ${un.length} 人：${un.join("、")}`);
    const text = `${activeCourse ? activeCourse.name : "本节"}考勤｜${parts.join("｜")}`;
    try { await navigator.clipboard.writeText(text); setCopyMsg("缺勤名单已复制，发群直接粘贴"); }
    catch { setCopyMsg("复制失败：请手动长按复制"); }
    setTimeout(() => setCopyMsg(""), 2500);
  };

  const remaining = useMemo(() => names.filter((n) => !picked.includes(n)), [names, picked]);

  const pick = () => {
    const pool = fair ? (remaining.length ? remaining : names) : names;
    if (!pool.length) return;
    // 一轮点完自动开启新一轮
    const freshRound = fair && remaining.length === 0;
    const base = freshRound ? [] : picked;
    setRolling(true);
    let i = 0;
    const t = setInterval(() => {
      const name = pool[Math.floor(Math.random() * pool.length)];
      setResult(name);
      if (++i > 10) {
        clearInterval(t); setRolling(false);
        if (fair && typeof name === "string") setPicked([...base, name]);
        // 点中即到：点出来回答问题默认人在，未点才自动记到，不覆盖缺/假
        if (typeof name === "string") {
          setCheck((prev) => (prev[name] ? prev : { ...prev, [name]: "到" }));
        }
      }
    }, 70);
  };
  const groups = useMemo(() => {
    if (!Array.isArray(result) || !result) return null;
    return result as string[];
  }, [result]);

  // 考勤打标循环：未点→到→缺→假→未点
  const cycleCheck = (n: string) => {
    const order = ["到", "缺", "假"];
    const cur = check[n];
    const next = !cur ? order[0] : order.includes(cur) ? (order[(order.indexOf(cur) + 1) % 4] ?? "") : order[0];
    const c2 = { ...check };
    if (!next) delete c2[n]; else c2[n] = next;
    setCheck(c2);
  };
  // 座位点击：不开课也能打考勤，点一下循环打标
  const onSeatClick = (n: string) => {
    cycleCheck(n);
  };
  const seatColor = (n: string) => {
    if (check[n] === "到") return "bg-emerald-500 text-white border-emerald-500";
    if (check[n] === "缺") return "bg-red-500 text-white border-red-500";
    if (check[n] === "假") return "bg-amber-400 text-black border-amber-400";
    if (result === n) return "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/30";
    return "bg-white/70 dark:bg-white/[0.05] text-neutral-700 dark:text-neutral-200 border-black/10 dark:border-white/10";
  };

  return (
    <div className="space-y-2">
      <CardHeader icon="picker" title="随机点名" sub={`${names.length} 人${fair && names.length ? ` · 剩 ${remaining.length} 未点` : ""}`}
        right={
          names.length > 0 ? (
            <button onClick={() => setFair(!fair)} title="公平模式：点完一轮前不重复"
              className={`cb-chip !text-[10px] transition-colors ${fair ? "bg-violet-500/15 text-violet-600" : "bg-black/[0.05] dark:bg-white/10 text-neutral-400"}`}>
              {fair ? "不重复" : "可重复"}
            </button>
          ) : undefined
        } />
      <div className="min-h-[84px] flex items-center justify-center rounded-3xl bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border border-black/5 dark:border-white/10 px-3">
        {result === null ? <span className="text-[12px] text-neutral-400">点击下方点名</span>
          : Array.isArray(result) ? (
            <div className="flex flex-wrap gap-1.5 p-2 justify-center">
              {result.map((g, i) => <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300">{g}</span>)}
            </div>
          ) : <span className={`text-3xl font-black tracking-tight text-neutral-900 dark:text-white ${rolling ? "animate-pulse" : "animate-pop-in"}`}>{result}</span>}
      </div>
      {groups}
      {names.length > 0 && (
        <div className="px-3 py-2 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] text-[11px] font-bold text-neutral-600 dark:text-neutral-300 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate">{activeCourse ? `上课中：${activeCourse.name} · 点到谁记谁` : "未开课也能记考勤：点名单打标，随时导出"}</span>
            <button className="shrink-0 px-2.5 py-1 rounded-full bg-violet-600 text-white text-[10px] font-black" onClick={() => void exportCsv()}>导出考勤 CSV</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate font-normal text-neutral-500">
              到 {(Object.values(check).filter((v) => v === "到").length) || 0} · 缺 {(Object.values(check).filter((v) => v === "缺").length) || 0} · 假 {(Object.values(check).filter((v) => v === "假").length) || 0}
            </span>
            <button className="shrink-0 text-[10px] font-black text-violet-600 hover:underline" onClick={() => void copyAbsence()}>复制缺勤名单</button>
          </div>
          {(csvMsg || copyMsg) && <div className="text-[10px] font-bold text-violet-600">{csvMsg || copyMsg}</div>}
        </div>
      )}
      {names.length > 0 && (
        <div className="flex items-center gap-1.5 px-0.5">
          <div className="flex p-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07]">
            {(["list", "seat"] as const).map((m) => (
              <button key={m} onClick={() => setSeatMode(m === "seat")}
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all ${seatMode === (m === "seat") ? "bg-white dark:bg-white/90 text-neutral-900 shadow" : "text-neutral-500"}`}>
                {m === "list" ? "名单" : "座位"}
              </button>
            ))}
          </div>
          {seatMode && (
            <div className="flex items-center gap-1 ml-auto">
              <button className="cb-icon-btn !w-5 !h-5" onClick={() => setCols(Math.max(4, (typeof cols === "number" ? cols : 6) - 1))} title="减少列"><UiIcon k="minus" size={10} /></button>
              <span className="text-[10px] text-neutral-400 font-bold tabular-nums">{typeof cols === "number" ? cols : 6} 列</span>
              <button className="cb-icon-btn !w-5 !h-5" onClick={() => setCols(Math.min(8, (typeof cols === "number" ? cols : 6) + 1))} title="增加列"><UiIcon k="plus" size={10} /></button>
            </div>
          )}
        </div>
      )}
      {names.length > 0 && (
        <div className="flex gap-1.5 px-0.5">
          {(["到", "缺", "假"] as const).map((s) => (
            <button key={s} className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500" title={`${s}：点下面名单打标记`}>
              {s} {(Object.values(check).filter((v) => v === s).length) || 0}
            </button>
          ))}
          <button className="text-[10px] font-black text-emerald-600 hover:underline" title="先全部记到，再改缺/假，最快" onClick={() => setCheck(Object.fromEntries(names.map((n) => [n, "到"])))}>全到</button>
          <button className="ml-auto text-[10px] text-neutral-400 hover:text-red-500" onClick={() => setCheck({})}>清标记</button>
        </div>
      )}
      {names.length > 0 && (seatMode ? (
        <div className="space-y-1.5">
          <div className="mx-auto w-24 text-center text-[10px] font-black tracking-widest text-neutral-400 border border-dashed border-black/15 dark:border-white/15 rounded-lg py-1">讲 台</div>
          <div className="grid gap-1.5 max-h-56 overflow-y-auto px-0.5" style={{ gridTemplateColumns: `repeat(${typeof cols === "number" ? cols : 6}, minmax(0,1fr))` }}>
            {names.map((n) => (
              <button key={n} title="点一下循环：未点→到→缺→假→未点"
                onClick={() => onSeatClick(n)}
                className={`min-w-0 px-1 py-1.5 rounded-lg border text-[11px] font-bold truncate transition-all active:scale-[0.95] ${seatColor(n)}`}>
                {n}{check[n] ? `·${check[n]}` : ""}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-neutral-400 text-center">点座位打考勤（到/缺/假循环），不开课也能记</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto px-0.5">
          {names.map((n) => (
            <button key={n} title="点一下循环：未点→到→缺→假→未点" onClick={() => cycleCheck(n)}
              className={`text-[11px] px-2 py-1 rounded-full font-bold transition-all ${check[n] === "到" ? "bg-emerald-500 text-white" : check[n] === "缺" ? "bg-red-500 text-white" : check[n] === "假" ? "bg-amber-400 text-black" : "bg-black/[0.05] dark:bg-white/10 text-neutral-500"}`}>
              {n}{check[n] ? `·${check[n]}` : ""}
            </button>
          ))}
        </div>
      ))}
      {picked.length > 0 && !Array.isArray(result) && (
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-neutral-400 flex-1 truncate">已点：{picked.slice(-6).join("、")}{picked.length > 6 ? ` 等 ${picked.length} 人` : ""}</span>
          <button className="text-[10px] text-neutral-400 hover:text-red-500 shrink-0" onClick={() => setPicked([])}>重开一轮</button>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={pick} disabled={!names.length || rolling} className="cb-btn-primary flex-1 !py-2.5 !text-[13px]">点一名</button>
        <div className="flex items-center gap-1.5">
          <input type="number" min={2} value={groupN} onChange={(e) => setGroupN(Number(e.target.value))} className="w-11 px-1 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] outline-none text-center text-[12px]" />
          <button className="cb-btn-ghost"
            onClick={() => {
              const arr = [...names].sort(() => Math.random() - 0.5);
              const n = Math.max(2, groupN);
              setResult(arr.slice(0, n));
            }}>分组抽</button>
        </div>
      </div>
      <textarea value={names.join("\n")} onChange={(e) => { setNames(e.target.value.split(/[\n,，、\s]+/).map((s) => s.trim()).filter(Boolean)); setPicked([]); }}
        placeholder="粘贴全班名单（一行一人，也可用逗号/空格分隔），自动保存" rows={3}
        className="cb-input resize-none !py-2.5" />
      <input ref={fileRef} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void importRoster(f); e.target.value = ""; }} />
      {rosterMsg && <div className="text-[10px] font-bold text-sky-600 px-1">{rosterMsg}</div>}
      <div className="flex gap-1.5">
        <button className="cb-btn-ghost flex-1 !text-[11px]" title="从 txt/csv 文件读名单，自动去重并入" onClick={() => fileRef.current?.click()}>从文件导入名单</button>
        <button className="cb-btn-ghost" title="导出当前名单为 txt，换班/换机直接带走" onClick={() => void (async () => {
          if (!names.length) { setRosterMsg("没有名单可导出"); setTimeout(() => setRosterMsg(""), 2000); return; }
          try {
            const where = await saveFile(stampName("classboard-roster", "txt"), `\uFEFF${names.join("\n")}\n`);
            setRosterMsg(where ? `已导出 ${names.length} 人` : "已取消");
          } catch { setRosterMsg("导出失败，再试一次"); }
          setTimeout(() => setRosterMsg(""), 2500);
        })()}>导出名单</button>
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="单个添加姓名" className="cb-input" />
        <button className="cb-btn-accent !px-3.5 flex items-center" onClick={() => { if (draft.trim()) { setNames([...names, draft.trim()]); setDraft(""); } }}><UiIcon k="plus" size={13} /></button>
        <button className="cb-btn-ghost" onClick={() => { setNames([]); setResult(null); setPicked([]); }}>清空</button>
      </div>
    </div>
  );
}
