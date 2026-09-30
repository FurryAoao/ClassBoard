import { useEffect, useRef } from "react";
import { useSettings } from "./store/useSettings";
import { syncWindowSize } from "./lib/utils";
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

  // 快捷键 Alt+Space 唤起 / 收起；Esc 收起
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        clearTimers();
        const s = useSettings.getState();
        const next = !s.expanded;
        s.setExpanded(next);
        syncWindowSize(next ? W_EXPANDED.w : W_COLLAPSED.w, next ? W_EXPANDED.h : W_COLLAPSED.h);
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
          if (e.state === "Pressed") {
            clearTimers();
            const s = useSettings.getState();
            const next = !s.expanded;
            s.setExpanded(next);
            syncWindowSize(next ? W_EXPANDED.w : W_COLLAPSED.w, next ? W_EXPANDED.h : W_COLLAPSED.h);
          }
        });
      } catch { /* browser preview */ }
    })();
    syncWindowSize(W_COLLAPSED.w, W_COLLAPSED.h);
    return () => { window.removeEventListener("keydown", key); clearTimers(); };
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
