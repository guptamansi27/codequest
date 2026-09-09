import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import ContentWrapper from "../../components/layout/ContentWrapper";
import PageContainer from "../../components/layout/PageContainer";
import { ChallengeGridSkeleton } from "../../components/ui/PremiumSkeleton";
import ChallengeCard from "../../components/user/challenge/ChallengeCard";
import {
  getContributionLevel,
  toDateKey,
} from "../../components/user/analytics/contributionActivity";
import { isSubmissionPassed } from "../../components/user/utils/challengeMapper";
import {
  buildCodeOfDayCompletionActivity,
} from "../../components/user/utils/codeOfDayStreak";
import { notify } from "../../utils/notifications";

const startOfLocalDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const mondayOfWeek = (date) => {
  const local = startOfLocalDay(date);
  const day = local.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + mondayOffset);
  return local;
};

const buildHeatmapData = (activityByDate, currentStreak) => {
  const today = startOfLocalDay(new Date());
  const start = mondayOfWeek(today);
  start.setDate(start.getDate() - 52 * 7);

  const weeks = Array.from({ length: 53 }, (_, weekIndex) => {
    const monday = new Date(start);
    monday.setDate(start.getDate() + weekIndex * 7);

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start);
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      const key = toDateKey(date);
      const activity = activityByDate.get(key) || { total: 0, accepted: 0, completed: 0, xp: 0 };
      const completed = activity.total > 0;
      const isFuture = date > today;
      const level = getContributionLevel(activity);

      return {
        id: key,
        date: key,
        dayIndex,
        level,
        completed,
        count: activity.total,
        accepted: activity.accepted,
        completedCount: activity.completed,
        xp: activity.xp,
        streak: currentStreak,
        isToday: key === toDateKey(today),
        isFuture,
      };
    });
  });

  return { weeks };
};

const getStatus = (challenge) => {
  const status = getScheduleStatusKey(challenge);
  if (status === "upcoming") return "Upcoming";
  if (status === "expired") return "Expired";
  return "Active";
};

const getScheduleStatusKey = (challenge) => {
  if (!challenge?.is_active) return "inactive";

  const now = new Date();
  if (now < new Date(challenge.start_time)) return "upcoming";
  if (now > new Date(challenge.end_time)) return "expired";
  return "active";
};

const getTimeLeft = (challenge) => {
  const diff = new Date(challenge.end_time).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const statusTabs = [
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "upcoming", label: "Upcoming" },
];

const formatScheduleTime = (value) =>
  value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not scheduled";

function ScheduleChallengeCard({ challenge }) {
  return (
    <article className="schedule-challenge-card">
      <div>
        <span>{challenge.xp_points} XP</span>
        <h2>{challenge.title}</h2>
      </div>
      <dl>
        <div>
          <dt>Starts</dt>
          <dd>{formatScheduleTime(challenge.start_time)}</dd>
        </div>
        <div>
          <dt>Ends</dt>
          <dd>{formatScheduleTime(challenge.end_time)}</dd>
        </div>
      </dl>
    </article>
  );
}

const getChallengeTechnology = (challenge) =>
  challenge.module_name || challenge.technology || challenge.stack || "Code";

export default function CodeOfTheDay() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusTab, setActiveStatusTab] = useState("active");
  const [backendStreak, setBackendStreak] = useState(null);

  useEffect(() => {
    const challengeRequests = ["active", "upcoming", "expired"].map((status) =>
      api.get("/challenges/", { params: { type: "code_of_the_day", status } })
    );

    Promise.all([
      ...challengeRequests,
      api.get("/submissions/"),
      api.get("/dashboard/user/").catch(() => null),
    ])
      .then(([activeRes, upcomingRes, expiredRes, submissionRes, dashboardRes]) => {
        setChallenges([...activeRes.data, ...upcomingRes.data, ...expiredRes.data]);
        setSubmissions(submissionRes.data);
        const streak = dashboardRes?.data?.stats?.code_of_day_streak;
        setBackendStreak(Number.isFinite(Number(streak)) ? Number(streak) : null);
      })
      .catch((error) => {
        notify.apiError(error, "Code of the Day challenges could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  const dailyChallenges = useMemo(
    () =>
      challenges
        .filter((challenge) => challenge.challenge_type === "CODE_OF_DAY")
        .sort((a, b) => new Date(a.end_time) - new Date(b.end_time)),
    [challenges],
  );

  const groupedDailyChallenges = useMemo(() => {
    const groups = { active: [], expired: [], upcoming: [] };
    dailyChallenges.forEach((challenge) => {
      const status = getScheduleStatusKey(challenge);
      if (groups[status]) groups[status].push(challenge);
    });
    return groups;
  }, [dailyChallenges]);

  const codeOfDayActivity = useMemo(
    () => buildCodeOfDayCompletionActivity(dailyChallenges, submissions),
    [dailyChallenges, submissions],
  );

  const currentStreak = backendStreak ?? 0;
  const { weeks } = useMemo(
    () => buildHeatmapData(codeOfDayActivity, currentStreak),
    [codeOfDayActivity, currentStreak],
  );

  return (
    <PageContainer className="code-day-page user-contained-page">
      <ContentWrapper>
        {loading ? (
          <ChallengeGridSkeleton count={3} />
        ) : (
          <>
        <header className="code-day-heading">
          <h1>Code of the Day</h1>
          <p>Complete daily challenges created by your admin team.</p>
        </header>

        <article className="code-streak-band">
          <div>
            <span>Current Streak</span>
            <strong>{currentStreak} Days</strong>
          </div>
          <div>
            <span>Daily Challenges</span>
            <strong>{dailyChallenges.length}</strong>
          </div>
        </article>

        <article className="code-panel activity-panel">
          <h2>Activity Overview</h2>
          <div className="activity-heatmap-wrap">
            <div className="activity-heatmap">
              <div className="heatmap-days" aria-hidden="true">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              <div className="heatmap-grid" aria-label="Daily coding activity graph">
                {weeks.map((week, weekIndex) => (
                  <div className="heatmap-week" key={`week-${weekIndex}`}>
                    {week.map((day) => (
                      <button
                        className={`heatmap-cell level-${day.level} ${day.isToday ? "is-today" : ""} ${day.isFuture ? "is-future" : ""}`}
                        key={day.id}
                        type="button"
                        title={`${day.date}: ${day.count} submissions, ${day.accepted} accepted, ${day.completedCount} completed, ${day.xp} XP`}
                        aria-label={`${day.date}: ${
                          day.count ? `${day.count} submissions, ${day.accepted} accepted, ${day.xp} XP` : "no activity"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="heatmap-legend">
              <span>Less</span>
              <i className="level-0" />
              <i className="level-1" />
              <i className="level-2" />
              <i className="level-3" />
              <i className="level-4" />
              <span>More</span>
            </div>
          </div>
        </article>

        {dailyChallenges.length === 0 && (
          <article className="daily-challenge-card">
            <header>
              <div>
                <h2>No code of the day yet</h2>
                <span>Waiting</span>
              </div>
              <p>When an admin creates a Code of the Day challenge, it will appear here.</p>
            </header>
          </article>
        )}

        {dailyChallenges.length > 0 && (
          <nav className="challenge-status-tabs" aria-label="Code of the day status">
            {statusTabs.map((tab) => (
              <button
                className={activeStatusTab === tab.key ? "is-active" : ""}
                key={tab.key}
                type="button"
                onClick={() => setActiveStatusTab(tab.key)}
              >
                <span>{tab.label}</span>
                <strong>{groupedDailyChallenges[tab.key].length}</strong>
              </button>
            ))}
          </nav>
        )}

        {activeStatusTab === "active" && groupedDailyChallenges.active.map((challenge) => {
          const completed = isSubmissionPassed(submissions, challenge.id);
          const statusLabel = completed ? "Completed" : getStatus(challenge);
          return (
            <ChallengeCard
              key={challenge.id}
              title={challenge.title}
              technology={getChallengeTechnology(challenge)}
              difficulty={challenge.difficulty}
              points={challenge.xp_points}
              timeLeft={getTimeLeft(challenge)}
              status={statusLabel}
              buttonLabel={completed ? "Completed" : "Start Challenge"}
              challengeType="code-of-day"
              completionState={statusLabel}
              onClick={() => navigate(`/user/code-of-the-day/challenge/${challenge.id}`)}
              disabled={getStatus(challenge) !== "Active"}
            />
          );
        })}

        {activeStatusTab === "active" && groupedDailyChallenges.active.length === 0 && (
          <p className="user-challenge-empty">No active code of the day challenges.</p>
        )}

        {activeStatusTab !== "active" && (
          groupedDailyChallenges[activeStatusTab].length ? (
            <div className="schedule-card-grid">
              {groupedDailyChallenges[activeStatusTab].map((challenge) => (
                <ScheduleChallengeCard challenge={challenge} key={challenge.id} />
              ))}
            </div>
          ) : (
            <p className="user-challenge-empty">No {activeStatusTab} code of the day challenges.</p>
          )
        )}
          </>
        )}
      </ContentWrapper>
    </PageContainer>
  );
}
