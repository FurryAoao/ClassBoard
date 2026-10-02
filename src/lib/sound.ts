/** 到点哔声：Web Audio 合成，无需联网、无需新依赖；收起/切卡时也能听见 */
let ctx: AudioContext | null = null;

export function isSoundOn(): boolean {
  try {
    const raw = localStorage.getItem("cb:sound:on");
    if (raw === null) return true;
    return JSON.parse(raw) !== false;
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try { localStorage.setItem("cb:sound:on", JSON.stringify(on)); } catch { /* ignore */ }
  import("./store-helpers").then(({ kvSet }) => kvSet("sound:on", JSON.stringify(on)));
}

/** times=响几声，freq=音高；失败静默（浏览器拦音频时不打扰） */
export function beep(times = 3, freq = 880, dur = 0.18) {
  if (!isSoundOn()) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0base = ctx.currentTime + 0.02;
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t0 = t0base + i * (dur + 0.14);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
  } catch {
    /* 忽略：有视觉“时间到”兜底 */
  }
}
