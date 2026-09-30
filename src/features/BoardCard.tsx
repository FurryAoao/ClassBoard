import { useRef, useState } from "react";
import { usePersistentState } from "../lib/store-helpers";

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
      <div className="flex items-center gap-2 text-[12px] font-bold">
        ✏️ 教学白板
        <button onClick={() => setMirroring(!mirroring)}
          className={`ml-auto text-[11px] px-2.5 py-1 rounded-full font-bold ${mirroring ? "bg-emerald-500 text-white" : "bg-black/5 dark:bg-white/10"}`}>
          {mirroring ? "● 投屏中" : "○ 未投屏"}
        </button>
      </div>
      <canvas ref={canvasRef} width={640} height={300}
        className="w-full rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 cursor-crosshair touch-none"
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
      <div className="flex items-center gap-2">
        {["#ef4444", "#0ea5e9", "#22c55e", "#111827"].map((c) => (
          <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full border-2"
            style={{ background: c, borderColor: color === c ? "#fff" : "transparent", boxShadow: color === c ? "0 0 0 2px #0ea5e9" : "none" }} />
        ))}
        <button className="ml-auto text-[11px] px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10"
          onClick={() => canvasRef.current!.getContext("2d")!.clearRect(0, 0, 640, 300)}>清空</button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="本节要点备注…（自动保存）"
        className="w-full text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
    </div>
  );
}
