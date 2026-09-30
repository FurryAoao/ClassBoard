import { useEffect, useRef, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

/** 教学白板：速写 + 投屏状态标记 + 自动落盘（仍在单窗口内） */
export default function BoardCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef<string[]>([]);
  const [color, setColor] = usePersistentState("board:color", "#ef4444");
  const [width, setWidth] = usePersistentState("board:width", 5);
  const [mirroring, setMirroring] = usePersistentState("board:mirror", false);
  const [note, setNote] = usePersistentState("board:note", "");
  const [saved, setSaved] = useState(false);

  // 恢复上次画布
  useEffect(() => {
    try {
      const data = localStorage.getItem("cb:board:img");
      if (data && canvasRef.current) {
        const img = new Image();
        img.onload = () => canvasRef.current!.getContext("2d")!.drawImage(img, 0, 0, 640, 300);
        img.src = data;
      }
    } catch {}
  }, []);
  const persist = () => {
    try {
      localStorage.setItem("cb:board:img", canvasRef.current!.toDataURL("image/png"));
      setSaved(true); setTimeout(() => setSaved(false), 1200);
    } catch {}
  };
  const snapshot = () => {
    try { strokes.current.push(canvasRef.current!.toDataURL("image/png")); if (strokes.current.length > 20) strokes.current.shift(); } catch {}
  };
  const undo = () => {
    const last = strokes.current.pop();
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, 640, 300);
    if (last) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, 640, 300); img.src = last; }
    else persist();
  };
  const pos = (clientX: number, clientY: number) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * c.width, y: ((clientY - r.top) / r.height) * c.height };
  };
  const down = (x: number, y: number) => {
    snapshot(); drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(x, y);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  const move = (x: number, y: number) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(x, y);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const up = () => { if (drawing.current) { drawing.current = false; persist(); } };

  return (
    <div className="space-y-2">
      <CardHeader icon="board" title="教学白板"
        right={
          <button onClick={() => setMirroring(!mirroring)}
            className={`cb-chip transition-colors ${mirroring ? "bg-emerald-500 text-white" : "bg-black/[0.05] dark:bg-white/10 text-neutral-500"}`}>
            <UiIcon k="dot" size={7} />{mirroring ? "投屏中" : "未投屏"}{saved ? " · 已存" : ""}
          </button>
        } />
      <canvas ref={canvasRef} width={640} height={300}
        className="w-full rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 cursor-crosshair touch-none shadow-sm"
        onMouseDown={(e) => down(e.clientX, e.clientY)}
        onMouseMove={(e) => move(e.clientX, e.clientY)}
        onMouseUp={up} onMouseLeave={up}
        onTouchStart={(e) => { const t = e.touches[0]; down(t.clientX, t.clientY); }}
        onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; move(t.clientX, t.clientY); }}
        onTouchEnd={up}
      />
      <div className="flex items-center gap-2 px-0.5">
        {["#ef4444", "#0ea5e9", "#22c55e", "#a855f7", "#111827"].map((c) => (
          <button key={c} onClick={() => setColor(c)} title={c}
            className="w-6 h-6 rounded-full border-2 border-white dark:border-white/20 shadow-sm transition-transform hover:scale-110"
            style={{ background: c, boxShadow: color === c ? "0 0 0 2px #0ea5e9" : undefined }} />
        ))}
        <div className="flex items-center gap-1 ml-1">
          {[3, 5, 9].map((wd) => (
            <button key={wd} onClick={() => setWidth(wd)} title={`笔宽 ${wd}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${width === wd ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : "bg-black/[0.05] dark:bg-white/10 text-neutral-500"}`}>
              <span className="rounded-full bg-current" style={{ width: wd + 4, height: Math.max(2, wd - 2) }} />
            </button>
          ))}
        </div>
        <button className="ml-auto text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] text-neutral-500 hover:bg-black/[0.08] transition-colors" onClick={undo}>撤销</button>
        <button className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] text-neutral-500 hover:text-red-500 transition-colors"
          onClick={() => { snapshot(); canvasRef.current!.getContext("2d")!.clearRect(0, 0, 640, 300); persist(); }}>清空</button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="本节要点备注（自动保存）" className="cb-input" />
    </div>
  );
}
