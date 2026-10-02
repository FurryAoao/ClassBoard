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

export function checkClassBell(now: Date): { kind: "start" | "end"; name: string } | null {
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
    for (const c of courses) {
      if (!c || c.day !== day) continue;
      if (c.start === t) {
        const id = `${dateStr}|${c.id}|start`;
        if (!rung[id]) {
          mark(id);
          return { kind: "start", name: typeof c.name === "string" ? c.name : "" };
        }
      }
      if (c.end === t) {
        const id = `${dateStr}|${c.id}|end`;
        if (!rung[id]) {
          mark(id);
          return { kind: "end", name: typeof c.name === "string" ? c.name : "" };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
