import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Activity, BarChart3, CheckCircle, Code2, LayoutDashboard, LineChart, PieChart, Target, Trash2, Users } from "lucide-react";
import api from "../../api/axiosInstance";
import ActivityDeleteConfirmModal from "../common/ActivityDeleteConfirmModal";
import { useDashChartHeight } from "../../hooks/useDashChartHeight";
import { useDismissedActivities } from "../../hooks/useDismissedActivities";
import ContentWrapper from "../layout/ContentWrapper";
import DashboardContainer from "../layout/DashboardContainer";
import ResponsiveGrid from "../layout/ResponsiveGrid";
import SectionBlock from "../layout/SectionBlock";
import { DashboardSkeleton } from "../ui/PremiumSkeleton";
import { buildActivityUserBandMap } from "../../utils/activityUserBands";
import { dashboardApexChartRoot, dashboardApexLegend, dashboardApexTooltip } from "../../utils/dashboardApexDefaults";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { displayLocalPart, getSessionEmail } from "../../utils/emailIdentity";
import { notify } from "../../utils/notifications";
import "../../styles/admin/Dashboard.css";

const emptyDashboard = {
  sme: { name: "SME", email: "", role: "SME" },
  kpis: {
    created_challenges: 0,
    active_challenges: 0,
    assigned_learners: 0,
    submissions_count: 0,
    success_rate: 0,
    average_score: 0,
    top_performing_challenge: null,
  },
  charts: {
    submission_trends: [],
    difficulty_analytics: [],
    completion_mix: [],
    technology_analytics: [],
    activity_heatmap: [],
    overview: {
      content_portfolio: [],
      attempt_mix: [],
    },
  },
  super_batches: [],
  batch_options: [],
  recent_activity: [],
};

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#0ea5e9"];

const baseChart = {
  chart: {
    ...dashboardApexChartRoot,
    animations: { enabled: true, easing: "easeinout", speed: 520 },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: "#eef2f7",
    strokeDashArray: 4,
    padding: { top: 10, right: 12, bottom: 4, left: 8 },
  },
  tooltip: dashboardApexTooltip,
  noData: {
    text: "No data for this filter yet",
    align: "center",
    verticalAlign: "middle",
    offsetY: 12,
    style: { color: "#64748b", fontSize: "13px", fontWeight: 600 },
  },
};

const SMEDashboardHome = () => {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [selectedSuperBatch, setSelectedSuperBatch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [showDeleteActivitiesModal, setShowDeleteActivitiesModal] = useState(false);
  const sessionEmail = getSessionEmail();
  const { dismissedIds, dismissActivities } = useDismissedActivities("sme-dashboard", sessionEmail);
  const storedProgram = localStorage.getItem("program_type") || "IGNITE";

  useEffect(() => {
    const params = {};
    if (storedProgram === "IGNITE" && selectedSuperBatch) params.super_batch = selectedSuperBatch;
    if (storedProgram === "IGNITE" && selectedBatch) params.batch = selectedBatch;

    api
      .get("/dashboard/sme/", { params })
      .then((response) => setDashboard(response.data))
      .catch((error) => {
        notify.apiError(error, "SME dashboard data could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [selectedSuperBatch, selectedBatch, storedProgram]);

  const kpis = dashboard.kpis;
  const superBatches = dashboard.super_batches || [];
  const batches = dashboard.batch_options || [];
  const topChallenge = kpis.top_performing_challenge;
  const smeProgram = dashboard.sme?.program_type || storedProgram;
  const isIgnite = smeProgram === "IGNITE";

  const cards = [
    { label: "Created Challenges", value: kpis.created_challenges, hint: "Created", icon: Code2, tone: "blue" },
    { label: "Assigned Learners", value: kpis.assigned_learners, hint: "Learners", icon: Users, tone: "green" },
    { label: "Submissions", value: kpis.submissions_count, hint: "Submissions", icon: Activity, tone: "orange" },
    { label: "Success Rate", value: `${kpis.success_rate}%`, hint: "Success", icon: CheckCircle, tone: "blue" },
  ];

  const submissionTrends = useMemo(
    () => dashboard.charts.submission_trends || [],
    [dashboard.charts.submission_trends]
  );
  const completionMix = useMemo(() => dashboard.charts.completion_mix || [], [dashboard.charts.completion_mix]);
  const difficultyAnalytics = useMemo(
    () => dashboard.charts.difficulty_analytics || [],
    [dashboard.charts.difficulty_analytics]
  );
  const technologyAnalytics = useMemo(
    () => dashboard.charts.technology_analytics || [],
    [dashboard.charts.technology_analytics]
  );
  const activityHeatmap = useMemo(() => dashboard.charts.activity_heatmap || [], [dashboard.charts.activity_heatmap]);
  const smeActivitySlice = useMemo(
    () => (dashboard.recent_activity || []).filter((activity) => !dismissedIds.has(String(activity.id))).slice(0, 12),
    [dashboard.recent_activity, dismissedIds]
  );
  const smeActivityUserBands = useMemo(() => buildActivityUserBandMap(smeActivitySlice), [smeActivitySlice]);

  const confirmDeleteActivity = () => {
    dismissActivities(smeActivitySlice.map((activity) => activity.id));
    setShowDeleteActivitiesModal(false);
    notify.success("Activities deleted from your SME dashboard.");
  };

  const chartH = useDashChartHeight({ min: 198, max: 262, ratio: 0.226 });
  const chartHWide = useDashChartHeight({ min: 210, max: 292, ratio: 0.242 });

  const submissionChart = useMemo(() => {
    const categories = submissionTrends.map((row) => row.date);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "line" },
        stroke: { curve: "smooth", width: [3, 2] },
        colors: ["#2563eb", "#16a34a"],
        markers: { size: 0, hover: { size: 6 } },
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } }, decimalsInFloat: 0 },
        legend: { ...dashboardApexLegend, position: "top", horizontalAlign: "right" },
      },
      series: [
        { name: "Submissions", data: submissionTrends.map((row) => row.submissions) },
        { name: "Completed", data: submissionTrends.map((row) => row.completed) },
      ],
    };
  }, [submissionTrends]);

  const completionDonut = useMemo(() => {
    const labels = completionMix.map((row) => row.name);
    const series = completionMix.map((row) => row.value);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "donut" },
        labels,
        colors: COLORS,
        plotOptions: {
          pie: {
            donut: {
              size: "68%",
              labels: {
                show: true,
                name: { fontSize: "12px" },
                value: { fontSize: "16px", fontWeight: 700 },
              },
            },
          },
        },
        stroke: { width: 2, colors: ["#ffffff"] },
        legend: { ...dashboardApexLegend, position: "bottom" },
      },
      series,
    };
  }, [completionMix]);

  const difficultyBarChart = useMemo(() => {
    const order = ["EASY", "MEDIUM", "HARD"];
    const rows = [...difficultyAnalytics].sort(
      (a, b) => order.indexOf(a.difficulty || "") - order.indexOf(b.difficulty || "")
    );
    const categories = rows.map((row) =>
      row.difficulty ? `${row.difficulty[0]}${row.difficulty.slice(1).toLowerCase()}` : ""
    );
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "bar" },
        plotOptions: {
          bar: { borderRadius: 8, columnWidth: "52%", dataLabels: { position: "top" } },
        },
        colors: ["#7c3aed"],
        dataLabels: {
          enabled: categories.length > 0,
          formatter: (val) => `${Math.round(Number(val) || 0)}%`,
          offsetY: -16,
          style: { fontSize: "11px", fontWeight: 700, colors: ["#475569"] },
        },
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "12px" } } },
        yaxis: { max: 100, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      },
      series: [{ name: "Pass rate", data: rows.map((row) => Number(row.successRate) || 0) }],
    };
  }, [difficultyAnalytics]);

  const technologyBarChart = useMemo(() => {
    const rows = technologyAnalytics;
    const categories = rows.map((row) => row.technology || "—");
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "bar" },
        plotOptions: {
          bar: { horizontal: true, borderRadius: 6, barHeight: "55%" },
        },
        colors: ["#0ea5e9"],
        dataLabels: {
          enabled: categories.length > 0,
          formatter: (val) => `${Math.round(Number(val) || 0)}%`,
          style: { fontSize: "11px", fontWeight: 700, colors: ["#334155"] },
        },
        xaxis: { max: 100, categories },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      },
      series: [{ name: "Avg completion", data: rows.map((row) => Number(row.completionRate) || 0) }],
    };
  }, [technologyAnalytics]);

  const ovPortfolio = dashboard.charts?.overview?.content_portfolio;
  const ovAttemptMix = dashboard.charts?.overview?.attempt_mix;

  const overviewContentBar = useMemo(() => {
    const rows = ovPortfolio || [];
    const categories = rows.map((row) => row.type);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "bar" },
        plotOptions: {
          bar: { borderRadius: 8, columnWidth: "52%", dataLabels: { position: "top" } },
        },
        colors: ["#1d4ed8"],
        dataLabels: {
          enabled: categories.length > 0,
          formatter: (val) => String(Math.round(Number(val) || 0)),
          offsetY: -18,
          style: { fontSize: "11px", fontWeight: 700, colors: ["#334155"] },
        },
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } }, decimalsInFloat: 0 },
      },
      series: [{ name: "Your challenges", data: rows.map((row) => row.count) }],
    };
  }, [ovPortfolio]);

  const overviewAttemptDonut = useMemo(() => {
    const rows = ovAttemptMix || [];
    const labels = rows.map((row) => row.name);
    const series = rows.map((row) => row.value);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "donut" },
        labels,
        colors: ["#16a34a", "#f97316"],
        plotOptions: {
          pie: {
            donut: {
              size: "64%",
              labels: {
                show: true,
                name: { fontSize: "12px" },
                value: { fontSize: "16px", fontWeight: 700 },
              },
            },
          },
        },
        stroke: { width: 2, colors: ["#ffffff"] },
        legend: { ...dashboardApexLegend, position: "bottom" },
      },
      series,
    };
  }, [ovAttemptMix]);

  const activityTrendChart = useMemo(() => {
    const rows = [...activityHeatmap].sort((a, b) => String(a.day || "").localeCompare(String(b.day || "")));
    const categories = rows.map((row) => {
      const d = row.day;
      if (!d) return "";
      const parts = String(d).split("-");
      return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d;
    });
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "area" },
        stroke: { curve: "smooth", width: 2 },
        fill: {
          type: "gradient",
          gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 92, 100] },
        },
        colors: ["#64748b"],
        markers: { size: 0, hover: { size: 5 } },
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "10px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } }, decimalsInFloat: 0 },
      },
      series: [{ name: "Learner attempts", data: rows.map((row) => Number(row.activity) || 0) }],
    };
  }, [activityHeatmap]);

  if (loading) {
    return (
      <DashboardContainer className="dashboard sme-dashboard">
        <ContentWrapper>
          <DashboardSkeleton role="sme" />
        </ContentWrapper>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer className="dashboard sme-dashboard cq-dashboard-viewport" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        <header className="dashboard-header">
          <div className="dashboard-header-top">
            <div className="header-left">
              <h1>SME Dashboard</h1>
            </div>
            
          </div>
          <p className="dashboard-subtitle cq-dashboard-welcome-block">
            {sessionEmail ? (
              <>
                <span className="cq-dashboard-welcome-accent">Welcome {displayLocalPart(sessionEmail)}.</span>
                <span className="cq-dashboard-welcome-muted">
                  {" "}
                  Challenge authoring, learner engagement, and content performance.
                </span>
              </>
            ) : (
              <span className="cq-dashboard-welcome-muted">
                Challenge authoring, learner engagement, and content performance.
              </span>
            )}
          </p>
        </header>

        <Tabs.Root defaultValue="overview" className="cq-dash-tabs-root">
          <Tabs.List className="cq-dash-tabs-list" aria-label="SME dashboard sections">
            <Tabs.Trigger className="cq-dash-tabs-trigger cq-dash-tabs-trigger--icon" value="overview">
              <LayoutDashboard size={16} strokeWidth={2.2} aria-hidden />
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger className="cq-dash-tabs-trigger cq-dash-tabs-trigger--icon" value="analytics">
              <BarChart3 size={16} strokeWidth={2.2} aria-hidden />
              Analytics
            </Tabs.Trigger>
            <Tabs.Trigger className="cq-dash-tabs-trigger cq-dash-tabs-trigger--icon" value="activity">
              <Activity size={16} strokeWidth={2.2} aria-hidden />
              Activity
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <ResponsiveGrid className="kpi-grid" min="min(100%, 200px)" gap="clamp(12px, 1.3vw, 16px)">
                {cards.map((card, index) => {
                  const CardIcon = card.icon;

                  return (
                    <div className={`kpi-card-v2 stat-card-${card.tone}`} key={card.label}>
                      <div className="kpi-content-v2">
                        <div className="kpi-header-row">
                          <p className="kpi-title-v2">{card.label}</p>
                          <div className="kpi-icon-v2" style={{ color: COLORS[index] }}>
                            <CardIcon />
                          </div>
                        </div>
                        <div className="kpi-value-row">
                          <h3 className="kpi-value-v2">{card.value}</h3>
                          <span className="kpi-change positive">{card.hint}</span>
                        </div>
                        <div className="kpi-progress-bar">
                          <div
                            className="kpi-progress-fill"
                            style={{
                              width: `${Math.min(
                                card.label === "Success Rate" ? kpis.success_rate : Number(card.value) || 0,
                                100
                              )}%`,
                              background: COLORS[index],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ResponsiveGrid>

              <p className="cq-dash-overview-section-label">Portfolio &amp; attempt health</p>
              <div className="charts-row">
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#2563eb" }}>
                      <Code2 />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Your challenges by type</h3>
                      <p className="chart-card-subtitle">How many challenges you authored in each category.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={overviewContentBar.options} series={overviewContentBar.series} type="bar" height={chartH} />
                  </div>
                </SectionBlock>
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#16a34a" }}>
                      <PieChart />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Learner attempts</h3>
                      <p className="chart-card-subtitle">First tries vs repeat attempts on your content.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={overviewAttemptDonut.options} series={overviewAttemptDonut.series} type="donut" height={chartH} />
                  </div>
                </SectionBlock>
              </div>

              <SectionBlock className="chart-card-v2 wide">
                <div className="chart-header">
                  <div className="chart-icon" style={{ color: "#0ea5e9" }}>
                    <Target />
                  </div>
                  <h3 className="chart-title-v2">Spotlight challenge</h3>
                </div>
                {topChallenge ? (
                  <div className="sme-top-challenge">
                    <strong>{topChallenge.title}</strong>
                    <span>
                      {topChallenge.technology} | {topChallenge.difficulty}
                    </span>
                    <div className="kpi-progress-bar">
                      <div
                        className="kpi-progress-fill"
                        style={{ width: `${topChallenge.completionRate}%`, background: "#16a34a" }}
                      />
                    </div>
                    <p>
                      {topChallenge.completionRate}% completion from {topChallenge.submissions} submissions
                    </p>
                  </div>
                ) : (
                  <div className="sme-top-challenge">
                    <p>No challenge performance yet.</p>
                  </div>
                )}
              </SectionBlock>
            </div>
          </Tabs.Content>

          <Tabs.Content value="analytics" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <p className="cq-dash-overview-section-label">Engagement &amp; difficulty</p>
              <div className="charts-row">
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#2563eb" }}>
                      <LineChart />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Submission pulse</h3>
                      <p className="chart-card-subtitle">Daily submissions vs completions on your challenges.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={submissionChart.options} series={submissionChart.series} type="line" height={chartH} />
                  </div>
                </SectionBlock>
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#16a34a" }}>
                      <BarChart3 />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Pass rate by difficulty</h3>
                      <p className="chart-card-subtitle">Learner success rate (%) by EASY / MEDIUM / HARD.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={difficultyBarChart.options} series={difficultyBarChart.series} type="bar" height={chartH} />
                  </div>
                </SectionBlock>
              </div>

              <div className="charts-row">
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#f97316" }}>
                      <Activity />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Completion snapshot</h3>
                      <p className="chart-card-subtitle">How learner submissions resolve (e.g. passed vs pending).</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={completionDonut.options} series={completionDonut.series} type="donut" height={chartH} />
                  </div>
                </SectionBlock>
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#0ea5e9" }}>
                      <Code2 />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Avg completion by technology</h3>
                      <p className="chart-card-subtitle">Mean completion % for your challenges in each stack.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={technologyBarChart.options} series={technologyBarChart.series} type="bar" height={chartH} />
                  </div>
                </SectionBlock>
              </div>

              <p className="cq-dash-overview-section-label">Volume trends</p>
              <div className="charts-row">
                <SectionBlock className="chart-card-v2 wide">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#64748b" }}>
                      <LineChart />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Learner attempt volume by day</h3>
                      <p className="chart-card-subtitle">Total attempts across your published challenges.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={activityTrendChart.options} series={activityTrendChart.series} type="area" height={chartHWide} />
                  </div>
                </SectionBlock>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="activity" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <SectionBlock className="activity-card">
                <div className="activity-section-header">
                  <h3 className="activity-title">Latest Activity</h3>
                  {smeActivitySlice.length ? (
                    <button
                      type="button"
                      className="activity-delete-button activity-delete-button--section"
                      aria-label="Delete all latest activities"
                      onClick={() => setShowDeleteActivitiesModal(true)}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <div className="activity-list">
                  {smeActivitySlice.length ? (
                    smeActivitySlice.map((activity, index) => {
                      const prev = smeActivitySlice[index - 1];
                      const userBreak = index > 0 && prev?.user !== activity.user;
                      const band = smeActivityUserBands.get(activity.user != null ? String(activity.user) : "") ?? 0;

                      return (
                        <div
                          key={activity.id}
                          className={`activity-item activity-item--band-${band}${userBreak ? " activity-item--user-break" : ""}${
                            activity.time ? "" : " activity-item--no-time"
                          }`}
                        >
                          <div
                            className={`activity-dot ${activity.action === "completed" ? "complete" : "start"}`}
                            aria-hidden
                          />
                          <div className="activity-content">
                            <div className="activity-line">
                              <span className="activity-user">{activity.user}</span>
                              <span className="activity-action">{activity.action}</span>
                            </div>
                            <span className="activity-target">{activity.target}</span>
                          </div>
                          {activity.time ? (
                            <span className="activity-time">{formatRelativeTime(activity.time)}</span>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="activity-item activity-item--band-0 activity-item--empty">
                      <div className="activity-content">
                        <span className="activity-action">No learner submissions yet</span>
                      </div>
                    </div>
                  )}
                </div>
              </SectionBlock>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </ContentWrapper>
      {showDeleteActivitiesModal ? (
        <ActivityDeleteConfirmModal
          activityLabel="all latest activities"
          onCancel={() => setShowDeleteActivitiesModal(false)}
          onConfirm={confirmDeleteActivity}
        />
      ) : null}
    </DashboardContainer>
  );
};

export default SMEDashboardHome;
