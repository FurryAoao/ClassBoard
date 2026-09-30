import { useEffect } from "react";
import { useSettings } from "./store/useSettings";
import { syncWindowSize } from "./lib/utils";
import Capsule from "./components/Capsule";
import ExpandedPanel from "./components/ExpandedPanel";

const W_COLLAPSED = { w: 208, h: 56 };
const W_EXPANDED = { w: 368, h: 560 };

export default function App() {
  const { expanded, setExpanded, pinned } = useSettings();

  // 悬停展开 / 移出收起（固定时不收起）
  const onEnter = () => {
    setExpanded(true);
    syncWindowSize(W_EXPANDED.w, W_EXPANDED.h);
  };
  const onLeave = () => {
    if (useSettings.getState().pinned) return;
    setExpanded(false);
    syncWindowSize(W_COLLAPSED.w, W_COLLAPSED.h);
  };

  // 快捷键 Alt+Space 唤起 / 收起；Esc 收起
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        const s = useSettings.getState();
        const next = !s.expanded;
        s.setExpanded(next);
        syncWindowSize(next ? W_EXPANDED.w : W_COLLAPSED.w, next ? W_EXPANDED.h : W_COLLAPSED.h);
      }
      if (e.key === "Escape" && !useSettings.getState().pinned) {
        useSettings.getState().setExpanded(false);
        syncWindowSize(W_COLLAPSED.w, W_COLLAPSED.h);
      }
    };
    window.addEventListener("keydown", key);
    // Tauri 全局快捷键（失焦也能唤起，不抢焦点）
    (async () => {
      try {
        const { register } = await import("@tauri-apps/plugin-global-shortcut");
        await register("Alt+Space", (e: any) => {
          if (e.state === "Pressed") {
            const s = useSettings.getState();
            const next = !s.expanded;
            s.setExpanded(next);
            syncWindowSize(next ? W_EXPANDED.w : W_COLLAPSED.w, next ? W_EXPANDED.h : W_COLLAPSED.h);
          }
        });
      } catch { /* browser preview */ }
    })();
    syncWindowSize(W_COLLAPSED.w, W_COLLAPSED.h);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    // 固定状态变化时同步尺寸
    if (pinned && !expanded) {
      setExpanded(true);
      syncWindowSize(W_EXPANDED.w, W_EXPANDED.h);
    }
  }, [pinned, expanded, setExpanded]);

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
            setExpanded(false);
            syncWindowSize(W_COLLAPSED.w, W_COLLAPSED.h);
          }}
        />
      )}
    </div>
  );
}
