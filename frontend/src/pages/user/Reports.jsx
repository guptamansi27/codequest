import {
  Award,
  Calendar,
  CheckCircle,
  Target,
  TrendingUp,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axiosInstance";
import ActivityDeleteConfirmModal from "../../components/common/ActivityDeleteConfirmModal";
import ContentWrapper from "../../components/layout/ContentWrapper";
import DashboardContainer from "../../components/layout/DashboardContainer";
import ResponsiveGrid from "../../components/layout/ResponsiveGrid";
import SectionBlock from "../../components/layout/SectionBlock";
import { ReportsSkeleton } from "../../components/ui/PremiumSkeleton";
import { useDismissedActivities } from "../../hooks/useDismissedActivities";
import { getSessionEmail } from "../../utils/emailIdentity";
import { notify } from "../../utils/notifications";

const emptyReports = {
  summary: {
    current_rank: 0,
    total_learners: 0,
    total_xp: 0,
    weekly_xp: 0,
    challenges_completed: 0,
    success_rate: 0,
    assessment_completion: 0,
    code_of_day_completed: 0,
  },
  module_progress: [],
  strengths: [],
  improvements: [],
  recent_activity: [],
};

const formatActivityDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Reports() {
  const [reports, setReports] = useState(emptyReports);
  const [loading, setLoading] = useState(true);
  const [showDeleteActivitiesModal, setShowDeleteActivitiesModal] = useState(false);
  const { dismissedIds, dismissActivities } = useDismissedActivities("user-reports", getSessionEmail());

  useEffect(() => {
    let isMounted = true;

    api.get("/reports/user/")
      .then((response) => {
        if (isMounted) setReports(response.data);
      })
      .catch((error) => {
        notify.apiError(error, "Your reports could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = [
    {
      icon: Award,
      label: "Current Rank",
      value: reports.summary.current_rank ? `#${reports.summary.current_rank}` : "-",
      note: `Out of ${reports.summary.total_learners} learners`,
      tone: "blue",
    },
    {
      icon: TrendingUp,
      label: "Total Points",
      value: `${reports.summary.total_xp} XP`,
      note: `+${reports.summary.weekly_xp} this week`,
      tone: "green",
    },
    {
      icon: Trophy,
      label: "Challenges Completed",
      value: String(reports.summary.challenges_completed),
      note: `${reports.summary.assessment_completion}% assessment completion`,
      tone: "yellow",
    },
    {
      icon: Target,
      label: "Success Rate",
      value: `${reports.summary.success_rate}%`,
      note: `${reports.summary.code_of_day_completed} Code of the Day completed`,
      tone: "orange",
    },
  ];
  const visibleRecentActivity = useMemo(
    () => (reports.recent_activity || []).filter((activity) => !dismissedIds.has(String(activity.id))),
    [dismissedIds, reports.recent_activity]
  );

  const confirmDeleteActivity = () => {
    dismissActivities(visibleRecentActivity.map((activity) => activity.id));
    setShowDeleteActivitiesModal(false);
    notify.success("Activities deleted from your reports.");
  };

  if (loading) {
    return (
      <DashboardContainer className="reports-page user-contained-page user-reports-page">
        <ContentWrapper>
          <ReportsSkeleton role="user" />
        </ContentWrapper>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer className="reports-page user-contained-page user-reports-page">
      <ContentWrapper>
        <header className="reports-heading">
          <div>
            <h1>Reports</h1>
            <p>Comprehensive overview of your learning progress</p>
          </div>
        </header>

        <ResponsiveGrid className="reports-summary-grid" min="min(100%, 220px)" gap="18px">
          {summary.map((item) => {
            const Icon = item.icon;

            return (
              <article className={`report-summary-card report-summary-${item.tone}`} key={item.label}>
                <Icon />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </article>
            );
          })}
        </ResponsiveGrid>

        <SectionBlock as="article" className="report-panel">
          <h2>Module Progress</h2>
          <div className="module-progress-grid">
            {reports.module_progress.length ? reports.module_progress.map((module) => (
              <div className="module-progress-card" key={module.name}>
                <div className="progress-label-row">
                  <strong>{module.name}</strong>
                  <span>{module.completed}/{module.total}</span>
                </div>
                <div className="report-progress-track">
                  <span style={{ width: `${module.percentage}%` }} />
                </div>
                <p>{module.percentage}% Complete</p>
              </div>
            )) : (
              <div className="module-progress-card">
                <div className="progress-label-row">
                  <strong>No module activity yet</strong>
                  <span>0/0</span>
                </div>
                <div className="report-progress-track">
                  <span style={{ width: "0%" }} />
                </div>
                <p>Submit challenges to build your progress report.</p>
              </div>
            )}
          </div>
        </SectionBlock>

        <div className="report-skill-grid">
          <SectionBlock as="article" className="report-panel skill-panel">
            <h2>Your Strengths</h2>
            {reports.strengths.length ? reports.strengths.map((strength) => (
              <div className="skill-row strength-row" key={strength.skill}>
                <div className="progress-label-row">
                  <span>
                    <strong>{strength.skill}</strong>
                    <small>{strength.level}</small>
                  </span>
                  <span>{strength.percentage}%</span>
                </div>
                <div className="report-progress-track">
                  <span style={{ width: `${strength.percentage}%` }} />
                </div>
              </div>
            )) : (
              <p className="report-empty-text">Strengths will appear after successful submissions.</p>
            )}
          </SectionBlock>

          <SectionBlock as="article" className="report-panel skill-panel improve-panel">
            <h2>Areas to Improve</h2>
            {reports.improvements.length ? reports.improvements.map((area) => (
              <div className="skill-row" key={area.skill}>
                <div className="progress-label-row">
                  <strong>{area.skill}</strong>
                  <span>{area.percentage}%</span>
                </div>
                <div className="report-progress-track">
                  <span style={{ width: `${area.percentage}%` }} />
                </div>
              </div>
            )) : (
              <p className="report-empty-text">No weak areas yet. Keep submitting work to refine this view.</p>
            )}
          </SectionBlock>
        </div>

        <SectionBlock as="article" className="report-panel recent-report-panel">
          <header>
            <Calendar />
            <h2>Recent Activity</h2>
            {visibleRecentActivity.length ? (
              <button
                type="button"
                className="activity-delete-button activity-delete-button--section"
                aria-label="Delete all recent activities"
                onClick={() => setShowDeleteActivitiesModal(true)}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            ) : null}
          </header>
          {visibleRecentActivity.length ? visibleRecentActivity.map((activity) => (
            <div className="report-activity-row" key={activity.id}>
              <div>
                <span className="activity-check">
                  <CheckCircle />
                </span>
                <span>
                  <strong>{activity.title}</strong>
                  <small>{formatActivityDate(activity.date)}</small>
                </span>
              </div>
              <strong>{activity.points}</strong>
            </div>
          )) : (
            <div className="report-activity-row">
              <div>
                <span className="activity-check">
                  <CheckCircle />
                </span>
                <span>
                  <strong>No recent activity yet</strong>
                  <small>Your submissions will appear here.</small>
                </span>
              </div>
              <strong>+0 XP</strong>
            </div>
          )}
        </SectionBlock>
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
}
