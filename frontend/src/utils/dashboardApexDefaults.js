/**
 * Shared ApexCharts defaults for CodeQuest dashboards (user, admin, SME).
 * Ensures axis/legend/tooltip text stays readable regardless of parent CSS.
 */
export const dashboardApexTooltip = {
  theme: "dark",
  fillSeriesColor: false,
  style: {
    fontSize: "12px",
    fontFamily: "inherit, system-ui, -apple-system, sans-serif",
  },
};

export const dashboardApexChartRoot = {
  fontFamily: "inherit, system-ui, -apple-system, sans-serif",
  foreColor: "#334155",
  toolbar: { show: false },
  zoom: { enabled: false },
};

/** Donut / multi-series charts */
export const dashboardApexLegend = {
  fontSize: "12px",
  fontWeight: 500,
  labels: {
    colors: "#334155",
  },
};
