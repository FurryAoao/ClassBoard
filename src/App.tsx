import { useEffect, useRef } from "react";
import { useSettings } from "./store/useSettings";
import { settleTimerIfExpired } from "./store/useTimer";
import { settleFocusIfExpired } from "./store/useFocus";
import { syncWindowSize, isTauri } from "./lib/utils";
import Capsule from "./components/Capsule";
import ExpandedPanel from "./components/ExpandedPanel";

const W_COLLAPSED = { w: 232, h: 56 };
const W_EXPANDED = { w: 368, h: 560 };
const HOVER_OPEN_DELAY = 120;
const HOVER_CLOSE_DELAY = 320;

export default function App() {
  const { expanded, setExpanded, pinned } = useSettings();
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  const doExpand = () => {
    setExpanded(true);
    syncWindowSize(W_EXPANDED.w, W_EXPANDED.h);
  };
  const doCollapse = () => {
    if (useSettings.getState().pinned) return;
    setExpanded(false);
    syncWindowSize(W_COLLAPSED.w, W_COLLAPSED.h);
  };

  // 悬停意图：进 120ms 后展开，移出 320ms 后收起， Round-trip 不闪
  const onEnter = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    if (useSettings.getState().expanded || openTimer.current) return;
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      doExpand();
    }, HOVER_OPEN_DELAY);
  };
  const onLeave = () => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (!useSettings.getState().expanded || closeTimer.current) return;
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      doCollapse();
    }, HOVER_CLOSE_DELAY);
  };

  // 计时/专注后台结算：倒计时在切卡/收起时跑完，这里统一冻结，不丢状态
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      settleTimerIfExpired(now);
      settleFocusIfExpired(now);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // 快捷键 Alt+Space 唤起 / 收起；Esc 收起
  useEffect(() => {
    const toggle = () => {
      clearTimers();
      const s = useSettings.getState();
      const next = !s.expanded;
      s.setExpanded(next);
      syncWindowSize(next ? W_EXPANDED.w : W_COLLAPSED.w, next ? W_EXPANDED.h : W_COLLAPSED.h);
    };
    const key = (e: KeyboardEvent) => {
      // 备用唤起键 Ctrl+`：KDE 默认占用 Alt+Space 时用这个
      if (e.ctrlKey && e.code === "Backquote") {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && !useSettings.getState().pinned) {
        clearTimers();
        doCollapse();
      }
    };
    window.addEventListener("keydown", key);
    // Tauri 全局快捷键（失焦也能唤起，不抢焦点）
    (async () => {
      try {
        const { register } = await import("@tauri-apps/plugin-global-shortcut");
        await register("Alt+Space", (e: any) => {
          if (e.state === "Pressed") toggle();
        });
        try {
          await register("Ctrl+`", (e: any) => {
            if (e.state === "Pressed") toggle();
          });
        } catch { /* 快捷键被占用时忽略，Alt+Space 仍可用 */ }
      } catch { /* browser preview */ }
    })();
    // 窗口位置记忆：有记忆则恢复上次拖放位置，无记忆则吸附右下角；
    // 拖动后防抖 500ms 落盘（逻辑像素）。Wayland 下恢复调用无副作用。
    let unlistenMove: (() => void) | null = null;
    (async () => {
      if (!isTauri()) return;
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        try {
          const raw = localStorage.getItem("cb:pos");
          const o = raw ? JSON.parse(raw) : null;
          if (o && typeof o.x === "number" && typeof o.y === "number") {
            await invoke("restore_position", { x: o.x, y: o.y });
          } else {
            await invoke("dock_window", { width: W_COLLAPSED.w, height: W_COLLAPSED.h });
          }
        } catch { /* 无记忆位置则保持 Rust 侧默认吸附 */ }
        let saveT: number | null = null;
        unlistenMove = await win.onMoved(async ({ payload }) => {
          if (saveT) window.clearTimeout(saveT);
          saveT = window.setTimeout(async () => {
            try {
              const scale = await win.scaleFactor();
              const sc = scale || 1;
              localStorage.setItem("cb:pos", JSON.stringify({ x: payload.x / sc, y: payload.y / sc }));
            } catch { /* ignore */ }
          }, 500);
        });
      } catch { /* browser preview */ }
    })();
    return () => { window.removeEventListener("keydown", key); clearTimers(); if (unlistenMove) unlistenMove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 固定状态变化时同步尺寸
    if (pinned && !expanded) {
      clearTimers();
      doExpand();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned]);

  return (
    <div
      className="w-screen h-screen flex items-end justify-end"
      style={{ background: "transparent" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {!expanded ? (
        <Capsule />
      ) : (
        <ExpandedPanel
          width={W_EXPANDED.w}
          height={W_EXPANDED.h}
          onCollapse={() => {
            clearTimers();
            doCollapse();
          }}
        />
      )}
    </div>
  );
}
