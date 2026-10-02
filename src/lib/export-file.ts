import { isTauri } from "./utils";

/**
 * 存文件小帮手：桌面端弹系统保存框写盘，浏览器里走 a[download] 下载。
 * 文本走 writeTextFile，二进制（PNG 等）走 writeFile。
 * 成功返回路径或文件名，失败/取消返回 null。
 */
export async function saveFile(
  defaultName: string,
  content: string | Uint8Array
): Promise<string | null> {
  if (isTauri()) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const ext = defaultName.includes(".") ? defaultName.split(".").pop()! : "";
      const path = await save({
        defaultPath: defaultName,
        filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : undefined,
      });
      if (!path) return null;
      if (typeof content === "string") {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        await writeTextFile(path, content);
      } else {
        const { writeFile } = await import("@tauri-apps/plugin-fs");
        await writeFile(path, content);
      }
      return path;
    } catch {
      /* 掉到浏览器下载兜底 */
    }
  }
  const blob =
    typeof content === "string"
      ? new Blob([content], { type: "text/plain;charset=utf-8" })
      : new Blob([content as unknown as BlobPart], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return defaultName;
}

/** dataURL (data:...;base64,...) 转 Uint8Array，给 PNG 存盘用 */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** 文件名用日期戳：classboard-board-20261002-1530 */
export function stampName(prefix: string, ext: string): string {
  const d = new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}
