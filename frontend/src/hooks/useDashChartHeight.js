import { useMemo, useSyncExternalStore } from "react";

function subscribe(onStoreChange) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onResize = () => onStoreChange();
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

function readViewportHeight() {
  return typeof window !== "undefined" ? window.innerHeight : 720;
}

/**
 * Responsive chart height for tabbed dashboards (ApexCharts needs a numeric height).
 * Scales with viewport so one screen fits more context before inner scroll.
 */
export function useDashChartHeight(options = {}) {
  const { min = 200, max = 268, ratio = 0.228 } = options;

  const vh = useSyncExternalStore(subscribe, readViewportHeight, () => 720);

  return useMemo(() => Math.round(Math.min(max, Math.max(min, vh * ratio))), [vh, min, max, ratio]);
}
