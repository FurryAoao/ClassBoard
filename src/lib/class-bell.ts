/** 上下课铃：按课表到点自动响一嗓子，复用哔声底子；每节每天只响一次 */
export function isBellOn(): boolean {
  try {
    const raw = localStorage.getItem("cb:bell:on");
    if (raw === null) return true;
    return JSON.parse(raw) !== false;
  } catch {
    return true;
  }
}

export function setBellOn(on: boolean) {
  try { localStorage.setItem("cb:bell:on", JSON.stringify(on)); } catch { /* ignore */ }
  import("./store-helpers").then(({ kvSet }) => kvSet("bell:on", JSON.stringify(on)));
}

/** 预备铃提前几分钟：0=关，只认 0/3/5/10 四档，脏数据回落为 0 */
export function getBellLead(): number {
  try {
    const raw = localStorage.getItem("cb:bell:lead");
    if (raw === null) return 0;
    const n = Number(JSON.parse(raw));
    return n === 3 || n === 5 || n === 10 ? n : 0;
  } catch {
    return 0;
  }
}

export function setBellLead(mins: number) {
  const n = mins === 3 || mins === 5 || mins === 10 ? mins : 0;
  try { localStorage.setItem("cb:bell:lead", JSON.stringify(n)); } catch { /* ignore */ }
  import("./store-helpers").then(({ kvSet }) => kvSet("bell:lead", JSON.stringify(n)));
}

/** 上次铃声留痕：响过后记一条，课表页一眼看到刚才响的是哪节 */
export interface BellRecord { kind: "pre" | "start" | "end"; name: string; at: string; date: string }

export function getLastBell(): BellRecord | null {
  try {
    const raw = localStorage.getItem("cb:bell:last");
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    return o as BellRecord;
  } catch {
    return null;
  }
}

export function bellText(r: BellRecord): string {
  const k = r.kind === "pre" ? "预备" : r.kind === "start" ? "上课" : "下课";
  return `${r.at} ${k}${r.name ? ` · ${r.name}` : ""}`;
}

export function checkClassBell(now: Date): { kind: "pre" | "start" | "end"; name: string } | null {
  try {
    // 总开关：关了哔声，铃声也不打扰；铃声自己也可独立关
    try {
      const rawSound = localStorage.getItem("cb:sound:on");
      if (rawSound !== null && JSON.parse(rawSound) === false) return null;
    } catch { /* ignore */ }
    if (!isBellOn()) return null;
    // 没开课表就不盯
    try {
      const rawEn = localStorage.getItem("cb:enabled");
      if (rawEn && !JSON.parse(rawEn).schedule) return null;
    } catch { /* ignore */ }
    const rawList = localStorage.getItem("cb:schedule:list");
    if (!rawList) return null;
    const courses = JSON.parse(rawList);
    if (!Array.isArray(courses) || !courses.length) return null;
    const day = (now.getDay() + 6) % 7;
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const lead = getBellLead();
    const shiftHM = (hm: string, deltaMin: number): string | null => {
      try {
        const [h, m] = String(hm).split(":").map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
        const total = h * 60 + m + deltaMin;
        if (total < 0 || total >= 24 * 60) return null;
        return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      } catch { return null; }
    };
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let rung: Record<string, 1> = {};
    try {
      const rawRung = localStorage.getItem("cb:bell:rung");
      rung = rawRung ? JSON.parse(rawRung) : {};
      if (!rung || typeof rung !== "object") rung = {};
    } catch { rung = {}; }
    const mark = (id: string) => {
      rung[id] = 1;
      // 只留今天 + 最近 100 条，防越积越大
      const keys = Object.keys(rung);
      if (keys.length > 120) {
        for (const k of keys) {
          if (!k.startsWith(dateStr)) delete rung[k];
          if (Object.keys(rung).length <= 100) break;
        }
      }
      try { localStorage.setItem("cb:bell:rung", JSON.stringify(rung)); } catch { /* ignore */ }
      import("./store-helpers").then(({ kvSet }) => kvSet("bell:rung", JSON.stringify(rung))).catch(() => {});
    };
    const recordLast = (kind: "pre" | "start" | "end", name: string) => {
      try {
        const rec: BellRecord = { kind, name, at: t, date: dateStr };
        localStorage.setItem("cb:bell:last", JSON.stringify(rec));
      } catch { /* ignore */ }
    };
    for (const c of courses) {
      if (!c || c.day !== day) continue;
      // 预备铃：上课 lead 分钟前先响一声（每节每天一次），方便提前进教室
      if (lead > 0) {
        const preT = shiftHM(c.start, -lead);
        if (preT && preT === t) {
          const id = `${dateStr}|${c.id}|pre`;
          if (!rung[id]) {
            mark(id);
            const nm = typeof c.name === "string" ? c.name : "";
            recordLast("pre", nm);
            return { kind: "pre", name: nm };
          }
        }
      }
      if (c.start === t) {
        const id = `${dateStr}|${c.id}|start`;
        if (!rung[id]) {
          mark(id);
          const nm = typeof c.name === "string" ? c.name : "";
          recordLast("start", nm);
          return { kind: "start", name: nm };
        }
      }
      if (c.end === t) {
        const id = `${dateStr}|${c.id}|end`;
        if (!rung[id]) {
          mark(id);
          const nm = typeof c.name === "string" ? c.name : "";
          recordLast("end", nm);
          return { kind: "end", name: nm };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
