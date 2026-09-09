import { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { ClipboardCheck, Download, FileCheck2, Send, Users } from "lucide-react"
import api from "../../api/axiosInstance"
import ContentWrapper from "../layout/ContentWrapper"
import DashboardContainer from "../layout/DashboardContainer"
import ResponsiveGrid from "../layout/ResponsiveGrid"
import SectionBlock from "../layout/SectionBlock"
import { ReportsSkeleton } from "../ui/PremiumSkeleton"
import { notify } from "../../utils/notifications"
import { downloadBlobResponse } from "../../utils/downloadableReport"
import "../../styles/admin/Dashboard.css"
import "../../styles/admin/Reports.css"

const emptyReports = {
  batches: [],
  kpis: {
    total_users: 0,
    active_users: 0,
    completed_challenges: 0,
    submissions_count: 0,
    challenge_completion_rate: 0,
    average_scores: 0,
    assessment_average_score: 0,
    assessment_completion_rate: 0,
  },
  charts: {
    batch_performance: [],
    xp_distribution: [],
  },
  leaderboard: [],
  recent_activity: [],
}

const Reports = () => {
  const [reports, setReports] = useState(emptyReports)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let isMounted = true
    api
      .get("/reports/admin/")
      .then((response) => {
        if (!isMounted) return
        setReports(response.data)
      })
      .catch((error) => {
        notify.apiError(error, "Admin reports could not be loaded.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const chartData = reports.charts?.challenge_completion_trends || reports.charts?.submissions_over_time || []
  const submissionsOverTime = reports.charts?.submissions_over_time || []
  const activeUsers = reports.charts?.active_users || []
  const difficultyAnalytics = reports.charts?.difficulty_analytics || []
  const modulePerformance = reports.charts?.module_performance || []
  const leaderboardData = reports.leaderboard || []
  const kpis = reports.kpis || emptyReports.kpis

  const analyticsCards = [
    { label: "Total Users", value: kpis.total_users, badge: "Users", icon: Users, color: "#2563eb", tone: "blue", progress: kpis.total_users },
    { label: "Completed Challenges", value: kpis.completed_challenges, badge: `${kpis.challenge_completion_rate}%`, icon: ClipboardCheck, color: "#16a34a", tone: "green", progress: kpis.challenge_completion_rate },
    { label: "Submissions", value: kpis.submissions_count, badge: "Submits", icon: Send, color: "#f97316", tone: "orange", progress: kpis.submissions_count },
    { label: "Assessments", value: `${kpis.assessment_average_score}%`, badge: "Complete", icon: FileCheck2, color: "#2563eb", tone: "blue", progress: kpis.assessment_completion_rate },
  ]

  const handleDownloadExcel = async () => {
    setDownloading(true)
    notify.info("Generating report...")
    try {
      const response = await api.get("/reports/admin/", {
        params: { export: "xlsx" },
        responseType: "blob",
      })
      downloadBlobResponse(response, `Admin_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`)
      notify.success("Report downloaded successfully.")
    } catch (error) {
      notify.apiError(error, "Unable to generate report.")
    } finally {
      setDownloading(false)
    }
  }

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1: return "#ffd700"
      case 2: return "#c0c0c0"
      case 3: return "#cd7f32"
      default: return "#e0e7ff"
    }
  }

  const getRankTextColor = (rank) => {
    return rank <= 3 ? "#333" : "#1e40af"
  }

  if (loading) {
    return (
      <DashboardContainer className="reports" maxWidth="var(--cq-content-max-width-wide)">
        <ContentWrapper>
          <ReportsSkeleton role="admin" />
        </ContentWrapper>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer className="reports" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        <header className="reports-header">
          <div>
            <h1>Reports</h1>
            <p className="reports-subtitle">
              View comprehensive reports and analytics
            </p>
          </div>
          <button className="btn-download" onClick={handleDownloadExcel} disabled={downloading}>
            <Download />
            {downloading ? "Generating..." : "Download Reports"}
          </button>
        </header>

        <SectionBlock className="batch-performance-section">
          <div className="section-header">
            <h3>Platform Performance Overview</h3>
          </div>

          <ResponsiveGrid className="reports-analytics-grid" min="min(100%, 200px)" gap="1rem">
            {analyticsCards.map((card) => {
              const Icon = card.icon
              return (
              <div className={`reports-analytics-card kpi-card-v2 stat-card-${card.tone}`} key={card.label}>
                <div className="kpi-content-v2">
                  <div className="kpi-header-row">
                    <p className="kpi-title-v2">{card.label}</p>
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
            )})}
          </ResponsiveGrid>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-batch">{label}</p>
                          <p className="tooltip-completion">
                            Avg Score: {payload[0]?.value}
                          </p>
                          <p className="tooltip-score">
                            Completion Rate: {payload[1]?.value}%
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Avg Score"
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompletion)"
                  name="Completion Rate %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        <div className="chart-container analytics-grid-charts">
          <div>
            <h3>Submissions Over Time</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={submissionsOverTime}>
                <defs>
                  <linearGradient id="submissionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.75} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="submissions" stroke="#2563eb" fill="url(#submissionsGradient)" />
                <Area type="monotone" dataKey="completed" stroke="#16a34a" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3>Active Users</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={activeUsers}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="activeUsers" stroke="#0ea5e9" fill="#e0f2fe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3>Difficulty Analytics</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={difficultyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successRate" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3>Module-wise Performance</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={modulePerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      

        </SectionBlock>

        <SectionBlock className="leaderboard-section">
          <h3>Leaderboard Preview - Top 5</h3>
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>XP Points</th>
                  <th>Challenges Completed</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((user) => (
                  <tr key={user.rank}>
                    <td>
                      <span
                        className="rank-badge"
                        style={{
                          backgroundColor: getRankBadgeColor(user.rank),
                          color: getRankTextColor(user.rank)
                        }}
                      >
                        {user.rank}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.user_id}</td>
                    <td className="xp-points">{user.xpPoints}</td>
                    <td>{user.challengesCompleted}</td>
                    <td>{user.totalTime || "00:00:00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionBlock>
      </ContentWrapper>
    </DashboardContainer>
  )
}

export default Reports
