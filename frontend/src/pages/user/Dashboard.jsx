import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  BarChart3,
  Flame,
  LayoutDashboard,
  Medal,
  PieChart,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useDashChartHeight } from "../../hooks/useDashChartHeight";
import { dashboardApexChartRoot, dashboardApexTooltip } from "../../utils/dashboardApexDefaults";
import ContentWrapper from "../../components/layout/ContentWrapper";
import DashboardContainer from "../../components/layout/DashboardContainer";
import ResponsiveGrid from "../../components/layout/ResponsiveGrid";
import SectionBlock from "../../components/layout/SectionBlock";
import { DashboardSkeleton } from "../../components/ui/PremiumSkeleton";
import { displayLocalPart, getSessionEmail } from "../../utils/emailIdentity";
import { notify } from "../../utils/notifications";
import "../../styles/admin/Dashboard.css";

/**
 * ApexCharts radar stroke/fill hovers sometimes omit a valid dataPointIndex; the custom
 * tooltip then returned "" and the library surfaced the generic SVG accessibility caption.
 * Snap to the nearest visible marker using pointer coordinates.
 */
function nearestRadarCategoryIndex(w, categoryCount) {
  if (!categoryCount || !w?.dom?.baseEl) return 0;
  const cx0 = w.interact?.clientX;
  const cy0 = w.interact?.clientY;
  if (cx0 == null || cy0 == null) return 0;
  const markers = w.dom.baseEl.querySelectorAll(
    ".apexcharts-radar-series .apexcharts-series-markers .apexcharts-marker"
  );
  if (!markers.length) return 0;
  let best = 0;
  let bestD = Infinity;
  markers.forEach((node) => {
    const rel = Number.parseInt(node.getAttribute("rel") ?? "", 10);
    if (!Number.isFinite(rel) || rel < 0 || rel >= categoryCount) return;
    const rect = node.getBoundingClientRect();
    const mx = rect.left + rect.width / 2;
    const my = rect.top + rect.height / 2;
    const d = (mx - cx0) ** 2 + (my - cy0) ** 2;
    if (d < bestD) {
      bestD = d;
      best = rel;
    }
  });
  return best;
}

function normalizeRadarDataPointIndex(w, dataPointIndex, categoryCount) {
  const j = Number(dataPointIndex);
  if (Number.isFinite(j) && j >= 0 && j < categoryCount) return j;
  return nearestRadarCategoryIndex(w, categoryCount);
}

const emptyDashboard = {
  user: { name: "User", email: "" },
  stats: {
    completed_challenges: 0,
    accuracy: 0,
    in_progress: 0,
    rank: 0,
    total_xp: 0,
    code_of_day_streak: 0,
  },
  language_progress: [],
  monthly_activity: [],
  performance: [],
  overview: {
    week_activity: [],
    completed_by_module: [],
  },
};

function normalizeDashboardData(data) {
  return {
    ...emptyDashboard,
    ...(data || {}),
    user: { ...emptyDashboard.user, ...(data?.user || {}) },
    stats: { ...emptyDashboard.stats, ...(data?.stats || {}) },
    overview: { ...emptyDashboard.overview, ...(data?.overview || {}) },
    language_progress: Array.isArray(data?.language_progress) ? data.language_progress : [],
    monthly_activity: Array.isArray(data?.monthly_activity) ? data.monthly_activity : [],
    performance: Array.isArray(data?.performance) ? data.performance : [],
  };
}

const baseChart = {
  chart: {
    ...dashboardApexChartRoot,
    animations: { enabled: true, easing: "easeinout", speed: 520 },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: "#edf1f5",
    strokeDashArray: 4,
    padding: { top: 12, right: 10, bottom: 8, left: 6 },
  },
  tooltip: dashboardApexTooltip,
  noData: {
    text: "No activity data yet",
    align: "center",
    verticalAlign: "middle",
    offsetY: 12,
    style: { color: "#64748b", fontSize: "13px", fontWeight: 600 },
  },
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const chartH = useDashChartHeight({ min: 198, max: 262, ratio: 0.226 });
  const chartHSkills = useDashChartHeight({ min: 340, max: 460, ratio: 0.42 });

  const welcomeSource = dashboard.user.email || getSessionEmail();
  const welcomeId = displayLocalPart(welcomeSource) || "Learner";

  useEffect(() => {
    let isMounted = true;

    api
      .get("/dashboard/user/")
      .then((dashboardResponse) => {
        if (!isMounted) return;
        setDashboard(normalizeDashboardData(dashboardResponse.data));
      })
      .catch((error) => {
        if (isMounted) {
          setDashboard(emptyDashboard);
          setLoadError("Dashboard data is not available yet.");
        }
        notify.apiError(error, "User dashboard data could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Completed Challenges",
      value: String(dashboard.stats.completed_challenges),
      icon: Trophy,
      tone: "blue",
    },
    {
      label: "Accuracy %",
      value: `${dashboard.stats.accuracy}%`,
      icon: Target,
      tone: "green",
    },
    {
      label: "In Progress",
      value: String(dashboard.stats.in_progress),
      icon: BarChart3,
      tone: "yellow",
    },
    {
      label: "Rank",
      value: dashboard.stats.rank ? `#${dashboard.stats.rank}` : "-",
      icon: Medal,
      tone: "orange",
    },
  ];

  const languageChartData = useMemo(
    () =>
      dashboard.language_progress.map((language) => ({
        ...language,
        value: Math.max(0, Math.min(Number(language.value) || 0, 100)),
        fill: language.color,
      })),
    [dashboard.language_progress]
  );

  const averageLanguageProgress = languageChartData.length
    ? Math.round(languageChartData.reduce((total, language) => total + language.value, 0) / languageChartData.length)
    : 0;

  /** Apex radar: angle j=0 maps to top center; keep API order so first module (e.g. HTML) starts at 12 o'clock. */
  const languageRadar = useMemo(() => {
    const rows = languageChartData.length ? languageChartData : [];
    const categories = rows.map((l) => l.name);
    const data = rows.map((l) => l.value);
    return {
      options: {
        chart: {
          ...dashboardApexChartRoot,
          type: "radar",
          /* Apex injects getAccessibleChartLabel() into the root SVG <title>; browsers show
           * that as a second native tooltip and it overrides/conflicts with the HTML tooltip. */
          accessibility: { enabled: false },
          selection: { enabled: false },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 780,
            animateGradually: { enabled: true, delay: 40 },
            dynamicAnimation: { enabled: true, speed: 520 },
          },
          dropShadow: {
            enabled: true,
            top: 1,
            left: 0,
            blur: 6,
            opacity: 0.22,
            color: "#0284c7",
          },
        },
        colors: ["#22d3ee"],
        stroke: { width: 2.5, colors: ["#0891b2"], curve: "smooth" },
        fill: {
          type: "gradient",
          gradient: {
            shade: "dark",
            type: "vertical",
            shadeIntensity: 0.12,
            opacityFrom: 0.42,
            opacityTo: 0.06,
            stops: [0, 55, 100],
            colorStops: [
              { offset: 0, color: "#22d3ee", opacity: 0.5 },
              { offset: 55, color: "#3b82f6", opacity: 0.22 },
              { offset: 100, color: "#1e40af", opacity: 0.06 },
            ],
          },
        },
        markers: {
          size: 5,
          strokeWidth: 2,
          strokeColors: ["#ffffff"],
          colors: ["#06b6d4"],
          hover: {
            size: 9,
            sizeOffset: 2,
          },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        plotOptions: {
          radar: {
            offsetY: 4,
            polygons: {
              strokeColors: "rgba(148, 163, 184, 0.28)",
              strokeWidth: "1",
              connectorColors: "rgba(148, 163, 184, 0.2)",
              fill: {
                colors: ["rgba(248, 250, 252, 0.92)", "rgba(255, 255, 255, 0.45)"],
              },
            },
          },
        },
        xaxis: {
          categories,
          tooltip: { enabled: false },
          labels: {
            show: true,
            style: {
              colors: Array(categories.length).fill("#475569"),
              fontSize: "12px",
              fontWeight: 600,
            },
            maxHeight: 120,
          },
        },
        /* Hide spoke scale numbers (25/50/75/100) — only polygon grid stays visible */
        yaxis: {
          show: false,
          min: 0,
          max: 100,
          tickAmount: 4,
          labels: { show: false },
        },
        grid: {
          padding: { top: 18, right: 22, bottom: 18, left: 22 },
        },
        tooltip: {
          theme: "dark",
          intersect: true,
          shared: false,
          followCursor: true,
          fixed: { enabled: false },
          fillSeriesColor: false,
          style: {
            fontSize: "12px",
            fontFamily: "inherit, system-ui, -apple-system, sans-serif",
          },
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            const cats = categories;
            const n = cats.length;
            if (!n) return "";
            const idx = normalizeRadarDataPointIndex(w, dataPointIndex, n);
            const rawName = cats[idx];
            const val =
              series?.[seriesIndex]?.[idx] ??
              data[idx] ??
              rows[idx]?.value;
            if (rawName == null || val == null) return "";
            const name = String(rawName)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
            const pct = Math.round(Number(val));
            return (
              `<div class="apexcharts-tooltip apexcharts-theme-dark dash-radar-tooltip" ` +
              `style="padding:10px 14px;border-radius:10px;border:1px solid #334155;` +
              `box-shadow:0 14px 36px rgba(2,6,23,0.45);background:rgba(15,23,42,0.96)">` +
              `<div style="font-weight:750;font-size:13px;color:#f8fafc;margin:0 0 4px">${name}</div>` +
              `<div style="font-size:12px;font-weight:650;color:#a5f3fc">${pct}% <span style="opacity:0.88">complete</span></div>` +
              `</div>`
            );
          },
        },
        states: {
          hover: { filter: { type: "lighten", value: 0.08 } },
          active: { filter: { type: "none" } },
        },
        noData: {
          text: "No module progress yet",
          align: "center",
          verticalAlign: "middle",
          style: { color: "#64748b", fontSize: "13px", fontWeight: 600 },
        },
      },
      series: rows.length ? [{ name: "Completion", data }] : [],
    };
  }, [languageChartData]);

  const monthlyChart = useMemo(() => {
    const categories = dashboard.monthly_activity.map((row) => row.day);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "bar" },
        plotOptions: {
          bar: { borderRadius: 6, columnWidth: "55%" },
        },
        colors: ["#3b82f6"],
        xaxis: { categories, labels: { style: { colors: "#6b7280", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#6b7280", fontSize: "11px" } } },
      },
      series: [{ name: "Activity", data: dashboard.monthly_activity.map((row) => row.activity) }],
    };
  }, [dashboard.monthly_activity]);

  const performanceChart = useMemo(() => {
    const categories = dashboard.performance.map((row) => row.module);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "area" },
        stroke: { curve: "smooth", width: 3 },
        fill: {
          type: "gradient",
          gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 92, 100] },
        },
        colors: ["#10b981"],
        markers: { size: 0, hover: { size: 6 } },
        xaxis: { categories, labels: { style: { colors: "#6b7280", fontSize: "11px" } } },
        yaxis: {
          min: 0,
          max: 100,
          labels: { style: { colors: "#6b7280", fontSize: "11px" } },
        },
      },
      series: [{ name: "Score", data: dashboard.performance.map((row) => row.score) }],
    };
  }, [dashboard.performance]);

  const ovWeekActivity = dashboard.overview?.week_activity;

  const overviewWeekChart = useMemo(() => {
    const rows = ovWeekActivity || [];
    const categories = rows.map((row) => row.label);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "area" },
        grid: {
          ...baseChart.grid,
          padding: { top: 16, right: 12, bottom: 12, left: 8 },
        },
        stroke: { curve: "smooth", width: 2 },
        fill: {
          type: "gradient",
          gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.06, stops: [0, 92, 100] },
        },
        colors: ["#3b82f6"],
        markers: { size: 0, hover: { size: 5 } },
        xaxis: { categories, labels: { style: { colors: "#6b7280", fontSize: "12px" } } },
        yaxis: { labels: { style: { colors: "#6b7280", fontSize: "11px" } }, decimalsInFloat: 0 },
      },
      series: [{ name: "Challenge touches", data: rows.map((row) => row.activity) }],
    };
  }, [ovWeekActivity]);

  const languageProgressBar = useMemo(() => {
    const rows = languageChartData.length ? languageChartData : [];
    const categories = rows.map((l) => l.name);
    const colors = rows.map((l) => l.color || "#3b82f6");
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "bar" },
        grid: {
          ...baseChart.grid,
          padding: { top: 8, right: 14, bottom: 10, left: 14 },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 8,
            columnWidth: "48%",
            distributed: true,
          },
        },
        colors,
        dataLabels: {
          enabled: true,
          formatter: (val) => `${val}%`,
          style: { fontSize: "11px", fontWeight: 700, colors: ["#fff"] },
          offsetY: -4,
        },
        xaxis: {
          categories,
          labels: { style: { colors: "#6b7280", fontSize: "12px", fontWeight: 600 } },
        },
        yaxis: {
          min: 0,
          max: 100,
          labels: { style: { colors: "#6b7280", fontSize: "11px" }, formatter: (v) => `${v}%` },
        },
        legend: { show: false },
        tooltip: { y: { formatter: (val) => `${val}% complete` } },
      },
      series: [{ name: "Progress", data: rows.map((l) => l.value) }],
    };
  }, [languageChartData]);

  if (loading) {
    return (
      <DashboardContainer className="dashboard dashboard-page user-home-dashboard">
        <ContentWrapper>
          <DashboardSkeleton role="user" />
        </ContentWrapper>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer
      className="dashboard dashboard-page user-home-dashboard cq-dashboard-viewport"
    >
      <ContentWrapper>
        <header className="dashboard-header">
          <div className="dashboard-header-top">
            <div className="header-left">
              <h1>USER Dashboard</h1>
            </div>
          </div>
          <p
            className="dashboard-subtitle cq-dashboard-welcome-block"
            title={welcomeSource || undefined}
          >
            {welcomeSource ? (
              <>
                <span className="cq-dashboard-welcome-accent">Welcome {welcomeId}!</span>
                <span className="cq-dashboard-welcome-muted">
                  {" "}
                  Track your learning progress and achievements.
                </span>
              </>
            ) : (
              <span className="cq-dashboard-welcome-muted">
                Track your learning progress and achievements.
              </span>
            )}
          </p>
          {loadError ? (
            <p className="dashboard-subtitle cq-dashboard-welcome-muted" role="status">
              {loadError}
            </p>
          ) : null}
        </header>

        <Tabs.Root defaultValue="overview" className="cq-dash-tabs-root">
          <Tabs.List className="cq-dash-tabs-list" aria-label="Dashboard views">
            <Tabs.Trigger className="cq-dash-tabs-trigger cq-dash-tabs-trigger--icon" value="overview">
              <LayoutDashboard size={16} strokeWidth={2.2} aria-hidden />
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger className="cq-dash-tabs-trigger cq-dash-tabs-trigger--icon" value="skills">
              <PieChart size={16} strokeWidth={2.2} aria-hidden />
              Skills
            </Tabs.Trigger>
            <Tabs.Trigger className="cq-dash-tabs-trigger cq-dash-tabs-trigger--icon" value="momentum">
              <TrendingUp size={16} strokeWidth={2.2} aria-hidden />
              Momentum
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <ResponsiveGrid className="stats-grid" min="min(100%, 200px)" gap="clamp(12px, 1.3vw, 16px)">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article className={`stat-card stat-card-${stat.tone}`} key={stat.label}>
                      <div>
                        <p className="stat-label">{stat.label}</p>
                        <strong>{stat.value}</strong>
                      </div>
                      <Icon className="stat-icon" />
                    </article>
                  );
                })}
              </ResponsiveGrid>

              <SectionBlock as="article" className="streak-card cq-dash-streak-card">
                <div>
                  <h2>Code of the Day Streak</h2>
                  <p>
                    <strong>{dashboard.stats.code_of_day_streak} Days</strong>
                    <Flame className="streak-icon" />
                  </p>
                </div>
                <span>Keep it going!</span>
              </SectionBlock>

              <p className="cq-dash-overview-section-label">This week &amp; wins by stack</p>
              <div className="chart-grid">
                <SectionBlock as="article" className="dashboard-card chart-card">
                  <h2>Last 7 days</h2>
                  <p className="chart-card-subtitle">How often you opened or submitted challenges</p>
                  <div className="chart-wrap apex-chart-shell">
                    <Chart options={overviewWeekChart.options} series={overviewWeekChart.series} type="area" height={chartH} />
                  </div>
                </SectionBlock>

                <SectionBlock as="article" className="dashboard-card chart-card">
                  <h2>Progress by Language</h2>
                  <p className="chart-card-subtitle">Your completion % across each language track</p>
                  <div className="chart-wrap apex-chart-shell">
                    <Chart
                      options={languageProgressBar.options}
                      series={languageProgressBar.series}
                      type="bar"
                      height={chartH}
                    />
                  </div>
                </SectionBlock>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="skills" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <SectionBlock as="article" className="dashboard-card progress-card">
                <h2>Progress by Language</h2>
                
                <div className="language-chart-panel language-chart-panel--apex language-chart-panel--radar">
                  <div className="language-radar-chart-column">
                    <div className="language-apex-wrap apex-chart-shell language-radar-apex">
                      {languageChartData.length ? (
                        <Chart
                          options={languageRadar.options}
                          series={languageRadar.series}
                          type="radar"
                          height={chartHSkills}
                        />
                      ) : (
                        <div className="language-radar-empty" role="status">
                          Complete a challenge to populate your module radar.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="language-radar-sidebar">
                    <div className="language-progress-tiles">
                      {languageChartData.map((language) => (
                        <div className="language-progress-tile" key={language.name}>
                          <span className="language-color-dot" style={{ backgroundColor: language.color }} />
                          <div>
                            <strong>{language.name}</strong>
                            <span>{language.value}% complete</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <aside className="language-radar-avg-card" aria-label={`Average completion ${averageLanguageProgress}%`}>
                      <span className="language-radar-avg-label">Average completion</span>
                      <strong className="language-radar-avg-value">{languageChartData.length ? `${averageLanguageProgress}%` : "—"}</strong>
                      <span className="language-radar-avg-hint">Across visible modules</span>
                    </aside>
                  </div>
                </div>
              </SectionBlock>
            </div>
          </Tabs.Content>

          <Tabs.Content value="momentum" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <div className="chart-grid">
                <SectionBlock as="article" className="dashboard-card chart-card">
                  <h2>Monthly Activity</h2>
                  <p className="chart-card-subtitle">How many days you engaged with challenges this month.</p>
                  <div className="chart-wrap apex-chart-shell">
                    <Chart options={monthlyChart.options} series={monthlyChart.series} type="bar" height={chartH} />
                  </div>
                </SectionBlock>

                <SectionBlock as="article" className="dashboard-card chart-card">
                  <h2>Performance by Module</h2>
                  <p className="chart-card-subtitle">Recent scores by module (0–100 scale).</p>
                  <div className="chart-wrap apex-chart-shell">
                    <Chart options={performanceChart.options} series={performanceChart.series} type="area" height={chartH} />
                  </div>
                </SectionBlock>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </ContentWrapper>
    </DashboardContainer>
  );
}
