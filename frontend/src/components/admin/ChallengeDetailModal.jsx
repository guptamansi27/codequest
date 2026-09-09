import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, CalendarClock, Download, Power, TrendingUp, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../api/axiosInstance";
import { ReportsSkeleton } from "../ui/PremiumSkeleton";
import { notify } from "../../utils/notifications";
import { downloadBlobResponse } from "../../utils/downloadableReport";
import "../../styles/admin/ChallengeModal.css";

const normalizeSuperBatch = (batch) =>
  String(batch || "").replace(/^Super\s+Batch\s+/i, "").trim();

const previousDateLabel = (label) => {
  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return "Previous";
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const buildTimelineData = (rows = [], valueKeys = []) => {
  if (rows.length !== 1) return rows;
  return [
    {
      date: previousDateLabel(rows[0].date),
      ...Object.fromEntries(valueKeys.map((key) => [key, 0])),
    },
    rows[0],
  ];
};

const ChallengeDetailModal = ({ id, onClose, triggerStyle }) => {
  const [challenge, setChallenge] = useState(null);
  const [superBatchFilter, setSuperBatchFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("challenge-modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("challenge-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const params = {};
    if (challenge?.challenge?.assignment_mode === "IGNITE") {
      if (superBatchFilter !== "All") params.super_batch = superBatchFilter;
      if (batchFilter !== "All") params.batch = batchFilter;
    }

    api.get(`/challenges/${id}/insights/`, { params })
      .then((res) => setChallenge(res.data))
      .catch((error) => {
        notify.apiError(error, "Challenge analytics could not be loaded.");
        onClose();
      });
  }, [id, onClose, superBatchFilter, batchFilter]);

  const detail = challenge?.challenge;
  const isIgnite = detail?.assignment_mode === "IGNITE";
  const summary = challenge?.summary || {};
  const filters = challenge?.filters || {};
  const superBatchOptions = filters.super_batches || [];
  const batchOptions = filters.batches || [];
  const submissionTrendData = buildTimelineData(
    challenge?.charts?.submission_trends || [],
    ["submissions", "passed"],
  );
  const engagementTrendData = buildTimelineData(
    challenge?.charts?.engagement_trend || [],
    ["activeLearners"],
  );
  const buildFilterParams = () => {
    const params = {};
    if (isIgnite) {
      if (superBatchFilter !== "All") params.super_batch = superBatchFilter;
      if (batchFilter !== "All") params.batch = batchFilter;
    }
    return params;
  };

  const downloadReport = async () => {
    setDownloading(true);
    notify.info("Generating report...");
    try {
      const response = await api.get(`/challenges/${id}/insights/export/`, {
        params: buildFilterParams(),
        responseType: "blob",
      });
      downloadBlobResponse(response, `Challenge_Report_${id}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      notify.success("Challenge analytics report downloaded successfully.");
    } catch (error) {
      notify.apiError(error, "Challenge analytics report could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSuperBatchFilterChange = (event) => {
    setSuperBatchFilter(event.target.value);
    setBatchFilter("All");
  };

  const modal = (
    <div
      className="modal-overlay challenge-modal-overlay"
      style={triggerStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal challenge-detail-modal">
        {!challenge ? (
          <ReportsSkeleton role="challenge" />
        ) : (
          <>
        <header className="modal-header">
          <div>
            <span className="modal-kicker">{detail.module_name}</span>
            <h2>{detail.title}</h2>
          </div>
          <div className="modal-header-actions">
            <button type="button" className="modal-report-button" onClick={downloadReport} disabled={downloading}>
              <Download size={16} />
              {downloading ? "Generating..." : "Download Report"}
            </button>
            <button type="button" className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="modal-badges">
          <span>{detail.difficulty}</span>
          <span>{detail.challenge_type?.replaceAll("_", " ")}</span>
          <span>{detail.xp_points} XP</span>
          <span>{detail.is_active ? "Active" : "Inactive"}</span>
          <span>{detail.assignment_mode?.replace("_", "-")}</span>
          {isIgnite && (detail.target_super_batches || []).map((superBatch) => (
            <span key={`super-${superBatch}`}>{normalizeSuperBatch(superBatch)}</span>
          ))}
          {isIgnite && (detail.target_batches || []).map((batch) => (
            <span key={`batch-${batch}`}>Batch {batch}</span>
          ))}
          {isIgnite && (detail.target_sub_batches || []).map((subBatch) => (
            <span key={`sub-${subBatch}`}>{subBatch}</span>
          ))}
        </div>

        {isIgnite && <section className="modal-section insight-filter-section">
          <div className="reports-filter-row">
            <select
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
            </select>
            <select
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="batch-filter"
            >
              <option value="All">All Batches</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>
        </section>}

        <section className="modal-section">
          <p className="challenge-description">{detail.description}</p>
        </section>

        <section className="modal-section insights-grid">
          {[
            ["Assigned", summary.total_assigned_users],
            ["Completed", summary.completed_users],
            ["Incomplete", summary.incomplete_users],
            ["Submitted Once", summary.submitted_once_users],
            ["Not Submitted", summary.not_submitted_users],
            ["Avg Score", `${summary.average_score}%`],
            ["Avg XP", summary.average_xp_earned],
            ["Completion", `${summary.completion_percentage}%`],
            ["Submissions", summary.submission_counts],
            ["Pass Rate", `${summary.pass_percentage || 0}%`],
            ["Participation", `${summary.active_participation_rate || 0}%`],
            ["Pass/Fail", `${summary.pass_count}/${summary.fail_count}`],
          ].map(([label, value]) => (
            <div className="insight-tile" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="modal-section schedule-panel">
          <h4><CalendarClock size={18} /> Schedule</h4>
          <div className="modal-grid two">
            <div>
              <span>Start</span>
              <strong>{new Date(detail.start_time).toLocaleString()}</strong>
            </div>
            <div>
              <span>End</span>
              <strong>{new Date(detail.end_time).toLocaleString()}</strong>
            </div>
          </div>
        </section>

        <section className="modal-section">
          <h4><TrendingUp size={18} /> Challenge Analytics</h4>
          <div className="modal-grid two analytics-modal-grid analytics-dashboard-grid">
            <div className="analytics-chart-card">
              <span>Submission Timeline</span>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={submissionTrendData}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="submissions" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="passed" stroke="#16a34a" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <span>Pass / Fail Ratio</span>
              <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={challenge.charts.pass_fail_ratio} dataKey="value" nameKey="name" outerRadius={78} label>
                  {challenge.charts.pass_fail_ratio.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? "#16a34a" : "#ef4444"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <span>Active Engagement</span>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={engagementTrendData}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="activeLearners" stroke="#7c3aed" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <span>Completion Progress</span>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart innerRadius="62%" outerRadius="92%" data={[{ name: "Completion", value: summary.completion_percentage || 0, fill: "#2563eb" }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={8} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <span>XP Distribution</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={challenge.charts.xp_distribution || []}>
                  <XAxis dataKey="range" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="users" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-chart-card">
              <span>Difficulty Impact</span>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={challenge.charts.difficulty_impact || []}>
                  <XAxis dataKey="difficulty" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="completion" fill="#16a34a" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="modal-section">
          <h4>Top Performers</h4>
          <div className="performer-table">
            {(challenge.top_performers || []).slice(0, 6).map((user) => (
              <div key={`${user.email}-${user.employee_id}`} className="performer-row">
                <strong>{user.user}</strong>
                <span>{user.batch}</span>
                <span>{user.best_score}%</span>
                <span>{user.earned_xp} XP</span>
              </div>
            ))}
            {!(challenge.top_performers || []).length && <div className="empty-state">No performer data yet.</div>}
          </div>
        </section>

        {isIgnite && <section className="modal-section">
          <h4>Batch-wise Performance</h4>
          <div className="batch-insight-list">
            {(challenge.batch_analytics || []).length ? challenge.batch_analytics.map((batch) => (
              <details key={batch.batch} className="batch-insight-card">
                <summary>
                  <span>Batch {batch.batch}</span>
                  <strong>{batch.completion_percentage}% complete</strong>
                </summary>
                <div className="insights-grid batch-insights-grid">
                  <div className="insight-tile"><span>Assigned</span><strong>{batch.assigned_users}</strong></div>
                  <div className="insight-tile"><span>Completed</span><strong>{batch.completed_users}</strong></div>
                  <div className="insight-tile"><span>Avg Score</span><strong>{batch.average_score}%</strong></div>
                  <div className="insight-tile"><span>Participation</span><strong>{batch.participation_percentage || 0}%</strong></div>
                  <div className="insight-tile"><span>Active</span><strong>{batch.active_learners || batch.active_participation}</strong></div>
                  <div className="insight-tile"><span>Submissions</span><strong>{batch.submission_count}</strong></div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={batch.submission_trends || []}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="submissions" fill="#2563eb" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="passed" fill="#16a34a" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </details>
            )) : (
              <div className="empty-state">No batch-wise activity yet.</div>
            )}
          </div>
        </section>}

        <section className="modal-section">
          <h4>Recent Activity</h4>
          <ul className="test-case-list">
            {challenge.recent_activity.map((activity) => (
              <li key={activity.id}>
                <strong>{activity.user}</strong>
                <span>{activity.status} with {activity.score}% score</span>
                <small>{new Date(activity.submitted_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </section>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
};

export default ChallengeDetailModal;
