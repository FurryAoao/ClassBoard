import { useEffect, useState } from "react";
import { isTauri } from "./utils";

/** 现在时间，每秒刷新；调用方卸载即停止（关闭功能后停后台任务） */
export function useNow(active: boolean, ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [active, ms]);
  return now;
}

/** SQLite 优先、localStorage 兜底的 KV 存取。关闭功能后保留数据。 */
const mem = new Map<string, string>();
let db: any = null;

async function getDb() {
  if (!isTauri()) return null;
  if (db) return db;
  try {
    const { default: Database } = await import("@tauri-apps/plugin-sql");
    db = await Database.load("sqlite:classboard.db");
    await db.execute(
      "CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)"
    );
    return db;
  } catch {
    return null;
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const d = await getDb();
  if (d) {
    try {
      const rows: Array<{ v: string }> = await d.select("SELECT v FROM kv WHERE k = $1", [key]);
      if (rows?.length) return rows[0].v;
    } catch { /* fallthrough */ }
  }
  try {
    const v = localStorage.getItem("cb:" + key);
    if (v !== null) return v;
  } catch { /* ignore */ }
  return mem.get(key) ?? null;
}

export async function kvSet(key: string, value: string) {
  mem.set(key, value);
  try { localStorage.setItem("cb:" + key, value); } catch { /* ignore */ }
  const d = await getDb();
  if (d) {
    try {
      await d.execute(
        "INSERT INTO kv(k,v) VALUES($1,$2) ON CONFLICT(k) DO UPDATE SET v=$2",
        [key, value]
      );
    } catch { /* ignore */ }
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    kvGet(key).then((raw) => {
      if (raw !== null) {
        try { setVal(JSON.parse(raw)); } catch { /* keep initial */ }
      }
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T | ((p: T) => T)) => {
    setVal((prev) => {
      const next = typeof v === "function" ? (v as any)(prev) : v;
      kvSet(key, JSON.stringify(next));
      return next;
    });
  };
  return [val, set, loaded] as const;
}
