import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import ContentWrapper from "../../components/layout/ContentWrapper";
import PageContainer from "../../components/layout/PageContainer";
import { ChallengeGridSkeleton } from "../../components/ui/PremiumSkeleton";
import ChallengeCard from "../../components/user/challenge/ChallengeCard";
import { TestConfirmationModal } from "../../components/user/test/TestConfirmationModal";
import { TestInterface } from "../../components/user/test/TestInterface";
import { isChallengeLive, isSubmissionPassed } from "../../components/user/utils/challengeMapper";
import { notify } from "../../utils/notifications";

const statusTabs = [
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "upcoming", label: "Upcoming" },
];

const formatScheduleTime = (value) =>
  value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not scheduled";

const getScheduleStatusKey = (challenge) => {
  if (!challenge?.is_active) return "inactive";

  const now = new Date();
  if (now < new Date(challenge.start_time)) return "upcoming";
  if (now > new Date(challenge.end_time)) return "expired";
  return "active";
};

const getStatusLabel = (assessment, completed) => {
  if (completed) return "Completed";
  const status = getScheduleStatusKey(assessment);
  if (status === "upcoming") return "Upcoming";
  if (status === "expired") return "Expired";
  return "Active";
};

const getTimeLeft = (assessment) => {
  const status = getScheduleStatusKey(assessment);
  const target = status === "upcoming" ? assessment.start_time : assessment.end_time;
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return status === "expired" ? "Ended" : "Now";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const prefix = status === "upcoming" ? "Opens in " : "";
  return `${prefix}${hours}h ${minutes}m`;
};

function AssessmentScheduleCard({ assessment }) {
  return (
    <article className="schedule-challenge-card">
      <div>
        <span>{assessment.xp_points} XP</span>
        <h2>{assessment.title}</h2>
      </div>
      <dl>
        <div>
          <dt>Starts</dt>
          <dd>{formatScheduleTime(assessment.start_time)}</dd>
        </div>
        <div>
          <dt>Ends</dt>
          <dd>{formatScheduleTime(assessment.end_time)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function Test() {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState("active");

  useEffect(() => {
    const challengeRequests = ["active", "upcoming", "expired"].map((status) =>
      api.get("/challenges/", { params: { type: "assessment", status } })
    );

    Promise.all([...challengeRequests, api.get("/submissions/")])
      .then(([activeRes, upcomingRes, expiredRes, submissionRes]) => {
        setAssessments([...activeRes.data, ...upcomingRes.data, ...expiredRes.data]);
        setSubmissions(submissionRes.data);
      })
      .catch((error) => {
        notify.apiError(error, "Assessments could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  const assessmentChallenges = useMemo(
    () =>
      assessments
        .filter((challenge) => challenge.challenge_type === "ASSESSMENT")
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [assessments],
  );

  const groupedAssessments = useMemo(() => {
    const groups = { active: [], expired: [], upcoming: [] };
    assessmentChallenges.forEach((assessment) => {
      const status = getScheduleStatusKey(assessment);
      if (groups[status]) groups[status].push(assessment);
    });
    return groups;
  }, [assessmentChallenges]);

  const openAssessmentWorkspace = (assessment) => {
    const workspaceUrl = `/user/test/${assessment.id}`;
    const opened = window.open(workspaceUrl, "_blank", "popup=yes,width=1440,height=900");

    if (!opened) {
      notify.info("Popup blocked. Opening assessment in this tab.");
      navigate(workspaceUrl);
      return;
    }

    setSelectedAssessment(null);
    setShowConfirmation(false);
  };

  const handleStartTest = (assessment, completed = false) => {
    if (!completed && !isChallengeLive(assessment)) {
      notify.info("This assessment is not live right now.");
      return;
    }

    if (completed) {
      openAssessmentWorkspace(assessment);
      return;
    }

    setSelectedAssessment(assessment);
    setShowConfirmation(true);
  };

  const handleConfirmStart = () => {
    if (!selectedAssessment) return;

    openAssessmentWorkspace(selectedAssessment);
  };

  const handleCancelStart = () => {
    setSelectedAssessment(null);
    setShowConfirmation(false);
  };

  const handleExitTest = () => {
    if (assessmentId) {
      window.close();
      navigate("/user/test");
      return;
    }

    setSelectedAssessment(null);
  };

  if (assessmentId) {
    return <TestInterface assessment={{ id: assessmentId }} onExit={handleExitTest} />;
  }

  if (selectedAssessment && !showConfirmation) {
    return <TestInterface assessment={selectedAssessment} onExit={handleExitTest} />;
  }

  return (
    <PageContainer className="test-intro-page user-contained-page">
      <ContentWrapper className="test-intro-inner">
        {loading ? (
          <ChallengeGridSkeleton count={4} />
        ) : (
          <>
        <header className="test-hero">
          <h1>Assessments</h1>
          <p>Assessment challenges created by admins appear here.</p>
        </header>

        {assessmentChallenges.length === 0 && (
          <article className="test-panel">
            <h2>No assessments available</h2>
            <p>When an admin creates an Assessment challenge, it will show up in this section.</p>
          </article>
        )}

        {assessmentChallenges.length > 0 && (
          <nav className="challenge-status-tabs" aria-label="Assessment status">
            {statusTabs.map((tab) => (
              <button
                className={activeStatusTab === tab.key ? "is-active" : ""}
                key={tab.key}
                type="button"
                onClick={() => setActiveStatusTab(tab.key)}
              >
                <span>{tab.label}</span>
                <strong>{groupedAssessments[tab.key].length}</strong>
              </button>
            ))}
          </nav>
        )}

        {activeStatusTab === "active" && (
          <div className="assessment-grid">
          {groupedAssessments.active.map((assessment) => {
            const completed = isSubmissionPassed(submissions, assessment.id);
            const statusLabel = getStatusLabel(assessment, completed);
            return (
              <ChallengeCard
                key={assessment.id}
                title={assessment.title}
                technology={assessment.module_name}
                difficulty={assessment.difficulty}
                points={assessment.xp_points}
                timeLeft={getTimeLeft(assessment)}
                status={statusLabel}
                buttonLabel={completed ? "Completed" : isChallengeLive(assessment) ? "Start Assessment" : statusLabel}
                challengeType="assessment"
                completionState={statusLabel}
                onClick={() => handleStartTest(assessment, completed)}
                disabled={!completed && !isChallengeLive(assessment)}
              />
            );
          })}
          </div>
        )}

        {activeStatusTab === "active" && groupedAssessments.active.length === 0 && (
          <p className="user-challenge-empty">No active assessments.</p>
        )}

        {activeStatusTab !== "active" && (
          groupedAssessments[activeStatusTab].length ? (
            <div className="schedule-card-grid">
              {groupedAssessments[activeStatusTab].map((assessment) => (
                <AssessmentScheduleCard assessment={assessment} key={assessment.id} />
              ))}
            </div>
          ) : (
            <p className="user-challenge-empty">No {activeStatusTab} assessments.</p>
          )
        )}
          </>
        )}
      </ContentWrapper>

      <TestConfirmationModal
        open={showConfirmation}
        onConfirm={handleConfirmStart}
        onCancel={handleCancelStart}
      />
    </PageContainer>
  );
}
