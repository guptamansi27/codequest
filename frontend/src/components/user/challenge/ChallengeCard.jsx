import { CalendarDays, Clock3, Play, Timer } from "lucide-react";
import "./challenge-card.css";

const statusToneMap = {
  active: "active",
  completed: "completed",
  expired: "expired",
  ended: "expired",
  upcoming: "upcoming",
  inactive: "expired",
};

function normalizeTone(value) {
  return statusToneMap[String(value || "").toLowerCase()] || "active";
}

export default function ChallengeCard({
  title,
  description,
  technology,
  difficulty,
  points,
  timeLeft,
  status,
  buttonLabel,
  onClick,
  disabled = false,
  challengeType = "challenge",
  completionState = "active",
}) {
  const statusTone = normalizeTone(completionState || status);
  const cardClasses = [
    "challenge-card",
    `challenge-card--${challengeType}`,
    `challenge-card--${statusTone}`,
    description ? "" : "challenge-card--compact",
  ].filter(Boolean).join(" ");

  return (
    <article className={cardClasses}>
      <section className="challenge-card__main">
        {(technology || difficulty) ? (
          <div className="challenge-card__badge-row">
            {technology ? <span className="challenge-card__technology">{technology}</span> : null}
            {difficulty ? <span className="challenge-card__difficulty">{difficulty}</span> : null}
          </div>
        ) : null}
        <div className="challenge-card__title-row">
          <h2>{title}</h2>
        </div>
        {description ? <p>{description}</p> : null}
      </section>

      <aside className="challenge-card__side" aria-label={`${title} details`}>
        <div className="challenge-card__meta">
          <div className="challenge-card__meta-item challenge-card__meta-item--time">
            <span><Clock3 /> Time Left</span>
            <strong>{timeLeft || "Not scheduled"}</strong>
          </div>
          <div className="challenge-card__meta-item challenge-card__meta-item--points">
            <span><CalendarDays /> Points</span>
            <strong>{Number.isFinite(Number(points)) ? `+${points} XP` : points}</strong>
          </div>
          <div className={`challenge-card__meta-item challenge-card__meta-item--status challenge-card__status--${statusTone}`}>
            <span><Timer /> Status</span>
            <strong>{status || "Active"}</strong>
          </div>
        </div>

        <button
          className="challenge-card__action"
          type="button"
          onClick={onClick}
          disabled={disabled}
        >
          <Play />
          {buttonLabel || "Start"}
        </button>
      </aside>
    </article>
  );
}
