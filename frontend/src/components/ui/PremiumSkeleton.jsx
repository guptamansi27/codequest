import "../../styles/premium-skeleton.css";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function SkeletonBlock({ className = "", rounded = "md", ...props }) {
  return (
    <span
      className={cx("cq-skel", `cq-skel--${rounded}`, className)}
      aria-hidden="true"
      {...props}
    />
  );
}

function HeaderSkeleton({ filters = false }) {
  return (
    <header className="cq-skel-header">
      <div>
        <SkeletonBlock className="cq-skel-title" />
        <SkeletonBlock className="cq-skel-subtitle" />
      </div>
      {filters ? (
        <div className="cq-skel-filter-row">
          <SkeletonBlock className="cq-skel-control" />
          <SkeletonBlock className="cq-skel-control" />
        </div>
      ) : null}
    </header>
  );
}

function StatCards({ count = 4 }) {
  return (
    <div className="cq-skel-stat-grid">
      {Array.from({ length: count }, (_, index) => (
        <article className="cq-skel-card cq-skel-stat-card" key={index}>
          <div>
            <SkeletonBlock className="cq-skel-line cq-skel-line--sm" />
            <SkeletonBlock className="cq-skel-metric" />
          </div>
          <SkeletonBlock className="cq-skel-icon" rounded="full" />
          <SkeletonBlock className="cq-skel-progress" />
        </article>
      ))}
    </div>
  );
}

function ChartSkeleton({ type = "area", wide = false }) {
  return (
    <article className={cx("cq-skel-card cq-skel-chart-card", wide && "cq-skel-chart-card--wide")}>
      <div className="cq-skel-chart-head">
        <SkeletonBlock className="cq-skel-icon" rounded="full" />
        <div>
          <SkeletonBlock className="cq-skel-line" />
          <SkeletonBlock className="cq-skel-line cq-skel-line--xs" />
        </div>
      </div>
      <div className={cx("cq-skel-chart", `cq-skel-chart--${type}`)}>
        {type === "donut" ? <SkeletonBlock className="cq-skel-donut" rounded="full" /> : null}
        {type === "radar" ? <SkeletonBlock className="cq-skel-radar" /> : null}
        {type !== "donut" && type !== "radar" ? (
          <>
            <SkeletonBlock className="cq-skel-axis cq-skel-axis--y" />
            <div className="cq-skel-bars" aria-hidden="true">
              {Array.from({ length: 9 }, (_, index) => (
                <i key={index} style={{ "--h": `${28 + ((index * 19) % 58)}%` }} />
              ))}
            </div>
            <SkeletonBlock className="cq-skel-axis cq-skel-axis--x" />
          </>
        ) : null}
      </div>
    </article>
  );
}

function ActivitySkeleton({ rows = 6 }) {
  return (
    <article className="cq-skel-card cq-skel-activity">
      <SkeletonBlock className="cq-skel-line cq-skel-line--lg" />
      {Array.from({ length: rows }, (_, index) => (
        <div className="cq-skel-activity-row" key={index}>
          <SkeletonBlock className="cq-skel-dot" rounded="full" />
          <div>
            <SkeletonBlock className="cq-skel-line" />
            <SkeletonBlock className="cq-skel-line cq-skel-line--xs" />
          </div>
          <SkeletonBlock className="cq-skel-pill" />
        </div>
      ))}
    </article>
  );
}

export function DashboardSkeleton({ role = "user" }) {
  const isUser = role === "user";
  return (
    <div className="cq-skel-page" role="status" aria-live="polite" aria-label={`Loading ${role} dashboard`}>
      <HeaderSkeleton filters={!isUser} />
      <div className="cq-skel-tabs">
        <SkeletonBlock /><SkeletonBlock /><SkeletonBlock />
      </div>
      <StatCards count={4} />
      {isUser ? <article className="cq-skel-card cq-skel-band"><SkeletonBlock /><SkeletonBlock /></article> : null}
      <div className="cq-skel-chart-grid">
        <ChartSkeleton type={isUser ? "area" : "donut"} />
        <ChartSkeleton type={isUser ? "bar" : "donut"} />
        <ChartSkeleton type={isUser ? "radar" : "bar"} wide />
      </div>
      <ActivitySkeleton rows={4} />
    </div>
  );
}

export function ReportsSkeleton({ role = "admin" }) {
  return (
    <div className="cq-skel-page" role="status" aria-live="polite" aria-label={`Loading ${role} reports`}>
      <HeaderSkeleton filters />
      <StatCards count={4} />
      <div className="cq-skel-chart-grid">
        <ChartSkeleton type="area" wide />
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="donut" />
        <ChartSkeleton type="bar" />
      </div>
      <TableSkeleton rows={6} cols={role === "user" ? 3 : 6} />
    </div>
  );
}

export function TableSkeleton({ rows = 7, cols = 6 }) {
  return (
    <article className="cq-skel-card cq-skel-table" role="status" aria-live="polite" aria-label="Loading table">
      <div className="cq-skel-table-toolbar">
        <SkeletonBlock className="cq-skel-control" />
        <SkeletonBlock className="cq-skel-control cq-skel-control--wide" />
      </div>
      <div className="cq-skel-table-head">
        {Array.from({ length: cols }, (_, index) => <SkeletonBlock key={index} />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div className="cq-skel-table-row" key={row} style={{ "--cols": cols }}>
          {Array.from({ length: cols }, (_, col) => <SkeletonBlock key={col} />)}
        </div>
      ))}
    </article>
  );
}

export function ChallengeGridSkeleton({ count = 6 }) {
  return (
    <div className="cq-skel-page" role="status" aria-live="polite" aria-label="Loading challenges">
      <HeaderSkeleton filters />
      <div className="cq-skel-challenge-grid">
        {Array.from({ length: count }, (_, index) => (
          <article className="cq-skel-card cq-skel-challenge-card" key={index}>
            <div className="cq-skel-challenge-top">
              <div>
                <SkeletonBlock className="cq-skel-line cq-skel-line--lg" />
                <SkeletonBlock className="cq-skel-line cq-skel-line--sm" />
              </div>
              <SkeletonBlock className="cq-skel-pill" />
            </div>
            <div className="cq-skel-chip-row">
              <SkeletonBlock className="cq-skel-chip" />
              <SkeletonBlock className="cq-skel-chip" />
            </div>
            <SkeletonBlock className="cq-skel-line" />
            <SkeletonBlock className="cq-skel-line cq-skel-line--lg" />
            <div className="cq-skel-actions">
              <SkeletonBlock />
              <SkeletonBlock />
              <SkeletonBlock className="cq-skel-icon" rounded="full" />
              <SkeletonBlock className="cq-skel-icon" rounded="full" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="cq-skel-page" role="status" aria-live="polite" aria-label="Loading leaderboard">
      <HeaderSkeleton />
      <div className="cq-skel-podium">
        <article className="cq-skel-card"><SkeletonBlock className="cq-skel-avatar" rounded="full" /><SkeletonBlock /><SkeletonBlock className="cq-skel-metric" /></article>
        <article className="cq-skel-card is-first"><SkeletonBlock className="cq-skel-avatar" rounded="full" /><SkeletonBlock /><SkeletonBlock className="cq-skel-metric" /></article>
        <article className="cq-skel-card"><SkeletonBlock className="cq-skel-avatar" rounded="full" /><SkeletonBlock /><SkeletonBlock className="cq-skel-metric" /></article>
      </div>
      <TableSkeleton rows={10} cols={3} />
    </div>
  );
}

export function WorkspaceSkeleton({ label = "Loading workspace" }) {
  return (
    <section
      className="workspace-page workspace-page--loading cq-skel-workspace cq-skel-challenge-workspace"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <header className="workspace-header cq-skel-challenge-workspace-header">
        <div>
          <SkeletonBlock className="cq-skel-ws-page-title" />
          <SkeletonBlock className="cq-skel-ws-page-sub" />
        </div>
        <div className="workspace-actions cq-skel-ws-header-actions">
          <SkeletonBlock className="cq-skel-ws-btn cq-skel-ws-btn--run" rounded="md" />
          <SkeletonBlock className="cq-skel-ws-btn cq-skel-ws-btn--save" rounded="md" />
          <SkeletonBlock className="cq-skel-ws-btn cq-skel-ws-btn--submit" rounded="md" />
        </div>
      </header>

      <div className="workspace-layout cq-skel-ws-grid">
        <nav className="workspace-activity-bar cq-skel-ws-activity" aria-hidden="true">
          <SkeletonBlock className="cq-skel-ws-activity-toggle" rounded="md" />
        </nav>

        <aside className="workspace-question-pane cq-skel-ws-question">
          <div className="workspace-pane-title">
            <SkeletonBlock className="cq-skel-ws-q-title" />
            <SkeletonBlock className="cq-skel-ws-q-diff" rounded="full" />
          </div>
          <div className="workspace-question-content cq-skel-ws-question-scroll">
            <div className="workspace-question-meta">
              <SkeletonBlock className="cq-skel-ws-meta-pill" rounded="full" />
              <SkeletonBlock className="cq-skel-ws-meta-pill cq-skel-ws-meta-pill--short" rounded="full" />
            </div>
            <SkeletonBlock className="cq-skel-ws-desc-line cq-skel-ws-desc-line--lg" />
            <SkeletonBlock className="cq-skel-ws-desc-line" />
            <SkeletonBlock className="cq-skel-ws-desc-line cq-skel-ws-desc-line--sm" />
            <SkeletonBlock className="cq-skel-ws-desc-line cq-skel-ws-desc-line--md" />
          </div>
        </aside>

        <main className="workspace-editor-pane">
          <div className="editor-language-tabs cq-skel-ws-lang-tabs" aria-hidden="true">
            <SkeletonBlock className="cq-skel-ws-lang-tab cq-skel-ws-lang-tab--active" rounded="md" />
            <SkeletonBlock className="cq-skel-ws-lang-tab" rounded="md" />
            <SkeletonBlock className="cq-skel-ws-lang-tab" rounded="md" />
          </div>
          <div className="monaco-shell workspace-monaco-shell cq-skel-ws-monaco">
            {Array.from({ length: 18 }, (_, index) => (
              <div className="cq-skel-ws-code-row" key={index}>
                <span className="cq-skel-ws-ln">{index + 1}</span>
                <SkeletonBlock
                  className="cq-skel-ws-code-line"
                  style={{ width: `${36 + ((index * 19) % 54)}%` }}
                />
              </div>
            ))}
          </div>
        </main>

        <aside className="workspace-preview-pane">
          <div className="workspace-panel-tabs cq-skel-ws-preview-tabs" aria-hidden="true">
            <SkeletonBlock className="cq-skel-ws-panel-tab cq-skel-ws-panel-tab--active" rounded="md" />
            <SkeletonBlock className="cq-skel-ws-panel-tab" rounded="md" />
          </div>
          <div className="workspace-panel-surface is-active cq-skel-ws-preview-surface">
            <div className="workspace-preview-header cq-skel-ws-preview-toolbar">
              <div className="workspace-preview-tools">
                <SkeletonBlock className="cq-skel-ws-refresh" rounded="md" />
              </div>
            </div>
            <div className="workspace-preview-frame-shell cq-skel-ws-preview-frame-shell">
              <div className="cq-skel-ws-preview-frame" aria-hidden="true" />
            </div>
            <div className="workspace-console-toggle-row cq-skel-ws-console-row">
              <SkeletonBlock className="cq-skel-ws-console-pill" rounded="md" />
            </div>
          </div>
        </aside>
      </div>

      <div className="cq-skel-ws-exit" aria-hidden="true">
        <SkeletonBlock className="cq-skel-ws-exit-block" rounded="md" />
      </div>
    </section>
  );
}

export function AuthSkeleton() {
  return (
    <div className="cq-skel-auth" role="status" aria-live="polite" aria-label="Authenticating">
      <article className="cq-skel-auth-card">
        <SkeletonBlock className="cq-skel-title" />
        <SkeletonBlock className="cq-skel-line cq-skel-line--lg" />
        <SkeletonBlock className="cq-skel-input" />
        <SkeletonBlock className="cq-skel-input" />
        <SkeletonBlock className="cq-skel-button" />
      </article>
    </div>
  );
}

export function InlineButtonSkeleton() {
  return <SkeletonBlock className="cq-skel-button-dot" rounded="full" />;
}
