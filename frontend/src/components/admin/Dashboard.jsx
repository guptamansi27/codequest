import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  Activity,
  BarChart3,
  CheckCircle,
  LayoutDashboard,
  LineChart as LineChartIcon,
  PieChart,
  Shield,
  Star,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";

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
  admin: { name: "Admin", email: "", role: "ADMIN" },
  selected_batch: "",
  selected_super_batch: "",
  batches: [],
  super_batches: [],
  batch_options: [],
  kpis: {
    total_users: 0,
    active_users: 0,
    completion_rate: 0,
    average_xp: 0,
    ai_usage: 0,
    completed_submissions: 0,
    in_progress: 0,
    total_submissions: 0,
  },
  charts: {
    user_growth: [],
    task_completion: [],
    ai_usage: [],
    overview: {
      role_mix: [],
      submission_outcomes: [],
      challenge_type_submissions: [],
    },
  },
  recent_activity: [],
};

const previousMonthLabel = (label) => {
  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(label);
  if (monthIndex < 0) return "Previous";
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(monthIndex + 11) % 12];
};

const buildLineTrendData = (rows, labelKey, valueKey) => {
  if (!rows?.length) return [];
  if (rows.length > 1) return rows;
  return [
    { [labelKey]: previousMonthLabel(rows[0][labelKey]), [valueKey]: 0 },
    rows[0],
  ];
};

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

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [showDeleteActivitiesModal, setShowDeleteActivitiesModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/dashboard/admin/")
      .then((response) => {
        if (!isMounted) return;
        setDashboard(response.data);
      })
      .catch((error) => {
        notify.apiError(error, "Admin dashboard data could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const user = dashboard.admin;
  const sessionEmail = getSessionEmail();
  const { dismissedIds, dismissActivities } = useDismissedActivities("admin-dashboard", sessionEmail);
  const welcomeEmail = sessionEmail || user?.email || "";
  const welcomeId = displayLocalPart(welcomeEmail);
  const kpis = dashboard.kpis;
  const activeUsersRate = kpis.total_users ? Math.round((kpis.active_users / kpis.total_users) * 100) : 0;

  const kpiCards = [
    {
      id: "totalUsers",
      title: "Total Users",
      value: String(kpis.total_users),
      badge: "Users",
      icon: Users,
      color: "#2563eb",
      tone: "blue",
      progress: kpis.total_users,
    },
    {
      id: "activeUsers",
      title: "Active Users",
      value: String(kpis.active_users),
      badge: `${activeUsersRate}%`,
      icon: Activity,
      color: "#16a34a",
      tone: "green",
      progress: activeUsersRate,
    },
    {
      id: "completionRate",
      title: "Task Completion Rate",
      value: `${kpis.completion_rate}%`,
      badge: "Complete",
      icon: CheckCircle,
      color: "#2563eb",
      tone: "blue",
      progress: kpis.completion_rate,
    },
    {
      id: "avgScore",
      title: "Average XP",
      value: String(kpis.average_xp),
      badge: "XP",
      icon: Star,
      color: "#f97316",
      tone: "orange",
      progress: kpis.average_xp,
    },
  ];

  const userGrowthData = useMemo(
    () => buildLineTrendData(dashboard.charts.user_growth, "month", "users"),
    [dashboard.charts.user_growth]
  );
  const taskCompletionData = useMemo(
    () => dashboard.charts.task_completion || [],
    [dashboard.charts.task_completion]
  );
  const aiUsageData = useMemo(() => dashboard.charts.ai_usage || [], [dashboard.charts.ai_usage]);
  const recentActivity = useMemo(
    () => (dashboard.recent_activity || []).filter((activity) => !dismissedIds.has(String(activity.id))),
    [dashboard.recent_activity, dismissedIds]
  );
  const activityUserBands = useMemo(() => buildActivityUserBandMap(recentActivity), [recentActivity]);

  const confirmDeleteActivity = () => {
    dismissActivities(recentActivity.map((activity) => activity.id));
    setShowDeleteActivitiesModal(false);
    notify.success("Activities deleted from your admin dashboard.");
  };

  const chartH = useDashChartHeight({ min: 198, max: 262, ratio: 0.226 });
  const chartHWide = useDashChartHeight({ min: 210, max: 292, ratio: 0.242 });

  const userGrowthChart = useMemo(() => {
    const categories = userGrowthData.map((row) => row.month);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "area" },
        stroke: { curve: "smooth", width: 3 },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.04,
            stops: [0, 92, 100],
          },
        },
        colors: ["#2563eb"],
        markers: { size: 0, strokeWidth: 0, hover: { size: 6 } },
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } }, decimalsInFloat: 0 },
      },
      series: [{ name: "Users", data: userGrowthData.map((row) => row.users) }],
    };
  }, [userGrowthData]);

  const taskChart = useMemo(() => {
    const categories = taskCompletionData.map((row) => row.tech);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "bar" },
        plotOptions: {
          bar: {
            borderRadius: 8,
            columnWidth: "52%",
            dataLabels: { position: "top" },
          },
        },
        colors: ["#2563eb"],
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      },
      series: [{ name: "Completed", data: taskCompletionData.map((row) => row.completed) }],
    };
  }, [taskCompletionData]);

  const aiUsageChart = useMemo(() => {
    const categories = aiUsageData.map((row) => row.week);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "area" },
        stroke: { curve: "smooth", width: 3 },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.42,
            opacityTo: 0.03,
            stops: [0, 90, 100],
          },
        },
        colors: ["#9333ea"],
        markers: { size: 0, hover: { size: 6 } },
        xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      },
      series: [{ name: "Usage", data: aiUsageData.map((row) => row.usage) }],
    };
  }, [aiUsageData]);

  const ovRoleMix = dashboard.charts?.overview?.role_mix;
  const ovOutcomes = dashboard.charts?.overview?.submission_outcomes;
  const ovChallengeTypes = dashboard.charts?.overview?.challenge_type_submissions;

  const overviewRoleDonut = useMemo(() => {
    const rows = ovRoleMix || [];
    const labels = rows.map((row) => row.label);
    const series = rows.map((row) => row.count);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "donut" },
        labels,
        colors: ["#2563eb", "#7c3aed", "#0d9488", "#ea580c"],
        plotOptions: {
          pie: {
            donut: {
              size: "62%",
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
  }, [ovRoleMix]);

  const overviewSubmissionOutcomesDonut = useMemo(() => {
    const rows = ovOutcomes || [];
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
              size: "62%",
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
  }, [ovOutcomes]);

  const overviewChallengeTypePie = useMemo(() => {
    const rows = ovChallengeTypes || [];
    const labels = rows.map((row) => row.type);
    const series = rows.map((row) => Number(row.submissions) || 0);
    return {
      options: {
        ...baseChart,
        chart: { ...baseChart.chart, type: "pie" },
        labels,
        colors: ["#14b8a6", "#f97316", "#8b5cf6", "#ef4444", "#22c55e"],
        plotOptions: {
          pie: {
            expandOnClick: true,
            dataLabels: {
              offset: -4,
            },
          },
        },
        dataLabels: {
          enabled: labels.length > 0,
          formatter: (val, opts) => {
            const count = opts.w.config.series[opts.seriesIndex] || 0;
            return `${count}`;
          },
          style: { fontSize: "12px", fontWeight: 800, colors: ["#ffffff"] },
          dropShadow: { enabled: false },
        },
        stroke: { width: 2, colors: ["#ffffff"] },
        legend: { ...dashboardApexLegend, position: "bottom" },
        tooltip: {
          ...dashboardApexTooltip,
          y: { formatter: (val) => `${Math.round(Number(val) || 0)} submissions` },
        },
      },
      series,
    };
  }, [ovChallengeTypes]);

  if (loading) {
    return (
      <DashboardContainer className="dashboard admin-dashboard">
        <ContentWrapper>
          <DashboardSkeleton role="admin" />
        </ContentWrapper>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer className="dashboard admin-dashboard cq-dashboard-viewport" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        <header className="dashboard-header">
          <div className="dashboard-header-top">
            <div className="header-left">
              <h1>ADMIN Dashboard</h1>
            </div>
            <div className="header-right">
            </div>
          </div>
          <p className="dashboard-subtitle cq-dashboard-welcome-block">
            {welcomeId ? (
              <>
                <span className="cq-dashboard-welcome-accent">Welcome {welcomeId}!</span>
                <span className="cq-dashboard-welcome-muted"> Control the CodeQuest universe with real-time learning intelligence.</span>
              </>
            ) : (
              <span className="cq-dashboard-welcome-muted">Here&apos;s what&apos;s happening today.</span>
            )}
          </p>
        </header>

        <Tabs.Root defaultValue="overview" className="cq-dash-tabs-root">
          <Tabs.List className="cq-dash-tabs-list" aria-label="Dashboard sections">
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
                {kpiCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.id} className={`kpi-card-v2 stat-card-${card.tone}`}>
                      <div className="kpi-content-v2">
                        <div className="kpi-header-row">
                          <p className="kpi-title-v2">{card.title}</p>
                          <div className="kpi-icon-v2" style={{ color: card.color }}>
                            <Icon />
                          </div>
                        </div>
                        <div className="kpi-value-row">
                          <h3 className="kpi-value-v2">{card.value}</h3>
                          <span className="kpi-change positive">{card.badge}</span>
                        </div>
                        <div className="kpi-progress-bar">
                          <div
                            className="kpi-progress-fill"
                            style={{
                              width: `${Math.min(Number.parseFloat(card.progress) || 0, 100)}%`,
                              background: card.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ResponsiveGrid>

              <p className="cq-dash-overview-section-label">Platform participation snapshot</p>
              <div className="charts-row">
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#2563eb" }}>
                      <Users />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Users by role</h3>
                      <p className="chart-card-subtitle">Seat mix across the public coding platform.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={overviewRoleDonut.options} series={overviewRoleDonut.series} type="donut" height={chartH} />
                  </div>
                </SectionBlock>

                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#16a34a" }}>
                      <PieChart />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Submission outcomes</h3>
                      <p className="chart-card-subtitle">Passed vs in-progress submissions in this cohort.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart
                      options={overviewSubmissionOutcomesDonut.options}
                      series={overviewSubmissionOutcomesDonut.series}
                      type="donut"
                      height={chartH}
                    />
                  </div>
                </SectionBlock>
              </div>

              <div className="charts-row">
                <SectionBlock className="chart-card-v2 wide">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#1d4ed8" }}>
                      <Shield />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Submissions by challenge type</h3>
                      <p className="chart-card-subtitle">Volume by challenge category (counts, not rates).</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart
                      options={overviewChallengeTypePie.options}
                      series={overviewChallengeTypePie.series}
                      type="pie"
                      height={chartH}
                    />
                  </div>
                </SectionBlock>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="analytics" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <p className="cq-dash-overview-section-label">Trend &amp; engagement analytics</p>
              <div className="charts-row">
                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#2563eb" }}>
                      <LineChartIcon />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">User growth</h3>
                      <p className="chart-card-subtitle">New or active user trend by month for the current filters.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={userGrowthChart.options} series={userGrowthChart.series} type="area" height={chartH} />
                  </div>
                </SectionBlock>

                <SectionBlock className="chart-card-v2">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#16a34a" }}>
                      <BarChart3 />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">Task completion</h3>
                      <p className="chart-card-subtitle">Completed tasks by technology stack.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={taskChart.options} series={taskChart.series} type="bar" height={chartH} />
                  </div>
                </SectionBlock>
              </div>

              <div className="charts-row">
                <SectionBlock className="chart-card-v2 wide">
                  <div className="chart-header">
                    <div className="chart-icon" style={{ color: "#9333ea" }}>
                      <TrendingUp />
                    </div>
                    <div className="chart-header-text">
                      <h3 className="chart-title-v2">AI usage trends</h3>
                      <p className="chart-card-subtitle">Assistant usage by week for the same cohort filters.</p>
                    </div>
                  </div>
                  <div className="apex-chart-shell dashboard-chart-canvas">
                    <Chart options={aiUsageChart.options} series={aiUsageChart.series} type="area" height={chartHWide} />
                  </div>
                </SectionBlock>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="activity" className="cq-dash-tabs-content">
            <div className="cq-dash-panel-stack">
              <SectionBlock className="activity-card">
                <div className="activity-section-header">
                  <h3 className="activity-title">Recent Activity</h3>
                  {recentActivity.length ? (
                    <button
                      type="button"
                      className="activity-delete-button activity-delete-button--section"
                      aria-label="Delete all recent activities"
                      onClick={() => setShowDeleteActivitiesModal(true)}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <div className="activity-list">
                  {recentActivity.length ? (
                    recentActivity.map((activity, index) => {
                      const prev = recentActivity[index - 1];
                      const userBreak = index > 0 && prev?.user !== activity.user;
                      const band = activityUserBands.get(activity.user != null ? String(activity.user) : "") ?? 0;

                      return (
                        <div
                          key={activity.id}
                          className={`activity-item activity-item--band-${band}${userBreak ? " activity-item--user-break" : ""}${
                            activity.time ? "" : " activity-item--no-time"
                          }`}
                        >
                          <div className={`activity-dot ${activity.type}`} aria-hidden />
                          <div className="activity-content">
                            <div className="activity-line">
                              <span className="activity-user">{activity.user}</span>
                              <span className="activity-action">{activity.action}</span>
                            </div>
                            <span className="activity-target">{activity.target}</span>
                          </div>
                          <span className="activity-time">{formatRelativeTime(activity.time)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="activity-item activity-item--band-0 activity-item--empty">
                      <div className="activity-content">
                        <span className="activity-action">No recent activity yet</span>
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
          activityLabel="all recent activities"
          onCancel={() => setShowDeleteActivitiesModal(false)}
          onConfirm={confirmDeleteActivity}
        />
      ) : null}
    </DashboardContainer>
  );
};

export default Dashboard;
