import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Download } from "lucide-react"
import api from "../../api/axiosInstance"
import ContentWrapper from "../layout/ContentWrapper"
import DashboardContainer from "../layout/DashboardContainer"
import SectionBlock from "../layout/SectionBlock"
import { ReportsSkeleton } from "../ui/PremiumSkeleton"
import { notify } from "../../utils/notifications"
import { downloadBlobResponse } from "../../utils/downloadableReport"
import "../../styles/admin/Reports.css"

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#0ea5e9", "#8b5cf6"]

const emptyReports = {
  kpis: {},
  charts: {
    submission_trends: [],
    difficulty_analytics: [],
    challenge_analytics: [],
    technology_analytics: [],
    activity_heatmap: [],
    completion_mix: [],
  },
}

const SMEReports = () => {
  const [reports, setReports] = useState(emptyReports)
  const [loading, setLoading] = useState(true)
  const [superBatchFilter, setSuperBatchFilter] = useState("All")
  const [batchFilter, setBatchFilter] = useState("All")
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [downloadingChallengeId, setDownloadingChallengeId] = useState(null)
  const smeProgram = reports.sme?.program_type || localStorage.getItem("program_type") || "IGNITE"
  const isIgnite = smeProgram === "IGNITE"

  useEffect(() => {
    const params = {}
    if ((localStorage.getItem("program_type") || "IGNITE") === "IGNITE" && superBatchFilter !== "All") params.super_batch = superBatchFilter
    if ((localStorage.getItem("program_type") || "IGNITE") === "IGNITE" && batchFilter !== "All") params.batch = batchFilter

    api.get("/dashboard/sme/", { params })
      .then((response) => setReports(response.data))
      .catch((error) => {
        notify.apiError(error, "SME reports could not be loaded.")
      })
      .finally(() => setLoading(false))
  }, [superBatchFilter, batchFilter])

  if (loading) {
    return (
      <DashboardContainer className="reports" maxWidth="var(--cq-content-max-width-wide)">
        <ContentWrapper>
          <ReportsSkeleton role="sme" />
        </ContentWrapper>
      </DashboardContainer>
    )
  }

  const charts = reports.charts || emptyReports.charts
  const superBatchOptions = reports.super_batches || []
  const batchOptions = reports.batch_options || []

  const handleSuperBatchFilterChange = (event) => {
    setLoading(true)
    setSuperBatchFilter(event.target.value)
    setBatchFilter("All")
  }

  const handleBatchFilterChange = (event) => {
    setLoading(true)
    setBatchFilter(event.target.value)
  }

  const buildFilterParams = () => {
    const params = {}
    if (isIgnite && superBatchFilter !== "All") params.super_batch = superBatchFilter
    if (isIgnite && batchFilter !== "All") params.batch = batchFilter
    return params
  }

  const handleDownloadReports = async () => {
    setDownloadingReport(true)
    notify.info("Generating report...")
    try {
      const response = await api.get("/reports/sme/export/", {
        params: buildFilterParams(),
        responseType: "blob",
      })
      downloadBlobResponse(response, `SME_${smeProgram}_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`)
      notify.success("SME report downloaded successfully.")
    } catch (error) {
      notify.apiError(error, "SME report could not be downloaded.")
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleDownloadChallengeReport = async (challenge) => {
    setDownloadingChallengeId(challenge.id)
    notify.info("Generating report...")
    try {
      const response = await api.get(`/challenges/${challenge.id}/insights/export/`, {
        params: buildFilterParams(),
        responseType: "blob",
      })
      downloadBlobResponse(response, `Challenge_Report_${challenge.id}_${new Date().toISOString().slice(0, 10)}.xlsx`)
      notify.success("Challenge report downloaded successfully.")
    } catch (error) {
      notify.apiError(error, "Challenge report could not be downloaded.")
    } finally {
      setDownloadingChallengeId(null)
    }
  }

  return (
    <DashboardContainer className="reports" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        <header className="reports-header">
          <div>
            <h1>SME Reports</h1>
            <p className="reports-subtitle">Detailed challenge performance, engagement, and technology analytics.</p>
          </div>
          <div className="reports-filter-row">
            {isIgnite && <select
              value={superBatchFilter}
              onChange={handleSuperBatchFilterChange}
              className="batch-filter"
            >
              <option value="All">All Super Batches</option>
              {superBatchOptions.map((superBatch) => (
                <option key={superBatch} value={superBatch}>
                  Super Batch {superBatch}
                </option>
              ))}
            </select>}
            {isIgnite && <select
              value={batchFilter}
              onChange={handleBatchFilterChange}
              className="batch-filter"
            >
              <option value="All">All Batches</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>}
            <button type="button" className="btn-download" onClick={handleDownloadReports} disabled={downloadingReport}>
              <Download size={18} />
              {downloadingReport ? "Generating..." : "Download Reports"}
            </button>
          </div>
        </header>

        <SectionBlock className="chart-container analytics-grid-charts">
          <div>
          <h3>Submission and Completion Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.submission_trends}>
              <defs>
                <linearGradient id="smeReportSubmissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.72} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="submissions" stroke="#2563eb" strokeWidth={3} fill="url(#smeReportSubmissions)" />
              <Area type="monotone" dataKey="completed" stroke="#16a34a" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Challenge-wise Completion</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.challenge_analytics}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="title" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Difficulty Insights</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.difficulty_analytics}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="difficulty" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="successRate" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Technology-wise Analytics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.technology_analytics}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="technology" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="submissions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </SectionBlock>

        <SectionBlock className="chart-container analytics-grid-charts">
          <div>
          <h3>Pass / Fail Ratio</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.completion_mix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4} label>
                {charts.completion_mix.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Completion Funnel</h3>
          <div className="completion-funnel">
            {[
              ["Assigned", reports.kpis.assigned_learners || 0],
              ["Submitted", reports.kpis.submissions_count || 0],
              ["Completed", charts.completion_mix?.[0]?.value || 0],
            ].map(([label, value], index) => (
              <div key={label} style={{ width: `${100 - index * 16}%` }}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          </div>
        </SectionBlock>

        

        <SectionBlock className="leaderboard-section">
          <h3>Challenge Analytics Table</h3>
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Technology</th>
                  <th>Difficulty</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>Avg Score</th>
                  <th>Pass / Fail</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {charts.challenge_analytics.map((challenge) => (
                  <tr key={challenge.id}>
                    <td>{challenge.title}</td>
                    <td>{challenge.technology}</td>
                    <td>{challenge.difficulty}</td>
                    <td>{challenge.assigned}</td>
                    <td>{challenge.completed} ({challenge.completionRate}%)</td>
                    <td>{challenge.averageScore}%</td>
                    <td>{challenge.passCount} / {challenge.failCount}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action-button"
                        onClick={() => handleDownloadChallengeReport(challenge)}
                        disabled={downloadingChallengeId === challenge.id}
                      >
                        <Download size={16} />
                        {downloadingChallengeId === challenge.id ? "Generating..." : "Download"}
                      </button>
                    </td>
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

export default SMEReports
