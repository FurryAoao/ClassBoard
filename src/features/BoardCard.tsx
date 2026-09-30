import { useRef, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

/** 教学白板 / 投屏状态：小画布速写 + 投屏状态标记（仍在单窗口内） */
export default function BoardCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState("#ef4444");
  const [mirroring, setMirroring] = usePersistentState("board:mirror", false);
  const [note, setNote] = usePersistentState("board:note", "");

  const pos = (e: React.MouseEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  return (
    <div className="space-y-2">
      <CardHeader icon="board" title="教学白板"
        right={
          <button onClick={() => setMirroring(!mirroring)}
            className={`cb-chip transition-colors ${mirroring ? "bg-emerald-500 text-white" : "bg-black/[0.05] dark:bg-white/10 text-neutral-500"}`}>
            <UiIcon k="dot" size={7} />{mirroring ? "投屏中" : "未投屏"}
          </button>
        } />
      <canvas ref={canvasRef} width={640} height={300}
        className="w-full rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 cursor-crosshair touch-none shadow-sm"
        onMouseDown={(e) => { drawing.current = true; const p = pos(e); canvasRef.current!.getContext("2d")!.beginPath(); canvasRef.current!.getContext("2d")!.moveTo(p.x, p.y); }}
        onMouseMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext("2d")!;
          const p = pos(e);
          ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = "round";
          ctx.lineTo(p.x, p.y); ctx.stroke();
        }}
        onMouseUp={() => (drawing.current = false)}
        onMouseLeave={() => (drawing.current = false)}
      />
      <div className="flex items-center gap-2 px-0.5">
        {["#ef4444", "#0ea5e9", "#22c55e", "#a855f7", "#111827"].map((c) => (
          <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full border-2 border-white dark:border-white/20 shadow-sm transition-transform hover:scale-110"
            style={{ background: c, boxShadow: color === c ? "0 0 0 2px #0ea5e9" : undefined }} />
        ))}
        <button className="ml-auto text-[11px] font-bold px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] text-neutral-500 hover:bg-black/[0.08] transition-colors"
          onClick={() => canvasRef.current!.getContext("2d")!.clearRect(0, 0, 640, 300)}>清空画布</button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="本节要点备注（自动保存）" className="cb-input" />
    </div>
  );
}
