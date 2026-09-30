import type { FeatureKey } from "../lib/utils";

function Svg({ size = 14, children, strokeWidth = 1.8 }: { size?: number; children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

/** 15 个功能统一线性图标：细描边、圆角，替代 emoji */
export function FeatureIcon({ k, size = 14 }: { k: FeatureKey; size?: number }) {
  switch (k) {
    case "clock":
      return <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Svg>;
    case "board":
      return <Svg size={size}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;
    case "shortcuts":
      return <Svg size={size}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Svg>;
    case "schedule":
      return <Svg size={size}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /><path d="M9 8h7M9 12h5" /></Svg>;
    case "calendar":
      return <Svg size={size}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9.5h18" /></Svg>;
    case "timer":
      return <Svg size={size}><circle cx="12" cy="13" r="8" /><path d="M12 9.5V13l2.5 2.5M9 2h6" /></Svg>;
    case "picker":
      return <Svg size={size}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></Svg>;
    case "todos":
      return <Svg size={size}><path d="M20 6 9 17l-5-5" /></Svg>;
    case "search":
      return <Svg size={size}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
    case "focus":
      return <Svg size={size}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></Svg>;
    case "capture":
      return <Svg size={size}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="3.5" /></Svg>;
    case "clipboard":
      return <Svg size={size}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h4" /></Svg>;
    case "weather":
      return <Svg size={size}><path d="M17.5 18a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6.2 10.5 3.8 3.8 0 0 0 7 18h10.5Z" /><path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5" /></Svg>;
    case "display":
      return <Svg size={size}><rect x="2" y="3" width="20" height="13" rx="2" /><path d="M8 21h8M12 16v5" /></Svg>;
    case "plugins":
      return <Svg size={size}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></Svg>;
  }
}

export type UiIconKey = "pin" | "gear" | "minus" | "plus" | "x" | "logo" | "sliders" | "database" | "dot" | "globe" | "file" | "chevL" | "chevR" | "search" | "check";

/** 标题栏 / 设置区小图标 */
export function UiIcon({ k, size = 13 }: { k: UiIconKey; size?: number }) {
  switch (k) {
    case "pin":
      return <Svg size={size}><path d="M9 3h6l-1 7 3 3H7l3-3-1-7Z" /><path d="M12 13v8" /></Svg>;
    case "gear":
      return <Svg size={size}><circle cx="12" cy="12" r="3" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></Svg>;
    case "minus":
      return <Svg size={size} strokeWidth={2.2}><path d="M5 12h14" /></Svg>;
    case "plus":
      return <Svg size={size} strokeWidth={2.2}><path d="M12 5v14M5 12h14" /></Svg>;
    case "chevL":
      return <Svg size={size} strokeWidth={2.2}><path d="m15 18-6-6 6-6" /></Svg>;
    case "chevR":
      return <Svg size={size} strokeWidth={2.2}><path d="m9 18 6-6-6-6" /></Svg>;
    case "search":
      return <Svg size={size}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
    case "check":
      return <Svg size={size} strokeWidth={2.2}><path d="M20 6 9 17l-5-5" /></Svg>;
    case "x":
      return <Svg size={size} strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
    case "logo":
      return <Svg size={size} strokeWidth={1.9}><path d="m22 10-10-5L2 10l10 5 10-5Z" /><path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" /></Svg>;
    case "sliders":
      return <Svg size={size}><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2" /><circle cx="10" cy="16" r="2" /></Svg>;
    case "database":
      return <Svg size={size}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></Svg>;
    case "dot":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
    case "globe":
      return <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></Svg>;
    case "file":
      return <Svg size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></Svg>;
  }
}
