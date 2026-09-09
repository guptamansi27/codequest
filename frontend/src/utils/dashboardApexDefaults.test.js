import {
  dashboardApexChartRoot,
  dashboardApexLegend,
  dashboardApexTooltip,
} from "./dashboardApexDefaults";

describe("dashboard Apex defaults", () => {
  test("sets readable dashboard chart defaults", () => {
    expect(dashboardApexTooltip.theme).toBe("dark");
    expect(dashboardApexTooltip.fillSeriesColor).toBe(false);
    expect(dashboardApexChartRoot.toolbar.show).toBe(false);
    expect(dashboardApexChartRoot.zoom.enabled).toBe(false);
    expect(dashboardApexLegend.labels.colors).toBe("#334155");
  });
});
