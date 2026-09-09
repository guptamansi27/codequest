import { useEffect, useMemo, useState } from "react";
import { Medal, Trophy } from "lucide-react";
import api from "../../api/axiosInstance";
import ContentWrapper from "../../components/layout/ContentWrapper";
import PageContainer from "../../components/layout/PageContainer";
import { LeaderboardSkeleton } from "../../components/ui/PremiumSkeleton";
import { displayLocalPart, emailLocalPart } from "../../utils/emailIdentity";
import { notify } from "../../utils/notifications";

const getInitialsFromEmail = (email) =>
  emailLocalPart(email).slice(0, 2).toUpperCase() || "U";

const toneByRank = { 1: "gold", 2: "silver", 3: "bronze" };

function PodiumSlot({ user, rank }) {
  const gridArea = rank === 1 ? "first" : rank === 2 ? "second" : "third";

  if (!user) {
    return <div className={`leader-podium__empty leader-podium__empty--r${rank}`} style={{ gridArea }} aria-hidden />;
  }

  const tone = toneByRank[rank] || "silver";
  const initials = getInitialsFromEmail(user.email);
  const displayName = user.is_current_user ? "You" : displayLocalPart(user.email);
  const podiumSize = rank === 1 ? "leader-card--podium-first" : rank === 2 ? "leader-card--podium-second" : "leader-card--podium-third";

  return (
    <article className={`leader-card leader-card-${tone} ${podiumSize}`} style={{ gridArea }}>
      <div className="leader-medal">
        <Medal />
        <span>{rank}</span>
      </div>

      <div className="leader-avatar-wrap">
        <div className="leader-avatar">{initials}</div>
      </div>

      <h2>{displayName}</h2>
      <p>
        <Trophy />
        <strong>{user.xp} XP</strong>
      </p>

      {rank === 1 && <div className="leader-badge">Top Performer</div>}
    </article>
  );
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/leaderboard/")
      .then((res) => setLeaderboard(res.data))
      .catch((error) => {
        notify.apiError(error, "Leaderboard could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  const topTen = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);
  const currentUserRow = useMemo(() => leaderboard.find((u) => u.is_current_user), [leaderboard]);
  const showYourRankBand = currentUserRow && currentUserRow.rank > 10;

  return (
    <PageContainer className="leaderboard-page user-contained-page">
      <ContentWrapper>
        {loading ? (
          <LeaderboardSkeleton />
        ) : (
          <>
        <header className="leaderboard-heading">
          <h1>Leaderboard</h1>
          <p>Ranking is scoped to your cohort and breaks score ties by fastest completion time</p>
        </header>

        <div className="leader-podium leader-podium--podium">
          <PodiumSlot user={second} rank={2} />
          <PodiumSlot user={first} rank={1} />
          <PodiumSlot user={third} rank={3} />
        </div>

        <article className="leader-panel rankings-panel">
          <h2>Top 10 rankings</h2>

          <div className="ranking-list">
            {topTen.map((user) => (
              <div className={`ranking-row ${user.is_current_user ? "current-user" : ""}`} key={user.email}>
                <div>
                  <span className="ranking-number">{user.rank}</span>
                  <span>
                    <strong>{user.is_current_user ? "You" : displayLocalPart(user.email)}</strong>
                    <small>
                      Rank #{user.rank} | {user.completed_challenges || 0} completed | {user.submissions || 0}{" "}
                      submissions | {user.total_time || "00:00:00"}
                    </small>
                  </span>
                </div>
                <span className="ranking-score">
                  <strong>{user.xp}</strong>
                  <small>XP Points</small>
                </span>
              </div>
            ))}

            {showYourRankBand && currentUserRow && (
              <>
                <div className="rankings-your-rank-divider" role="separator">
                  <span>Your position</span>
                </div>
                <div className="ranking-row current-user rankings-your-rank" key={`you-${currentUserRow.email}`}>
                  <div>
                    <span className="ranking-number">{currentUserRow.rank}</span>
                    <span>
                      <strong>
                        {displayLocalPart(currentUserRow.email)} (You)
                      </strong>
                      <small>
                        Rank #{currentUserRow.rank} | {currentUserRow.completed_challenges || 0} completed |{" "}
                        {currentUserRow.submissions || 0} submissions | {currentUserRow.total_time || "00:00:00"}
                      </small>
                    </span>
                  </div>
                  <span className="ranking-score">
                    <strong>{currentUserRow.xp}</strong>
                    <small>XP Points</small>
                  </span>
                </div>
              </>
            )}
          </div>
        </article>
          </>
        )}
      </ContentWrapper>
    </PageContainer>
  );
}
