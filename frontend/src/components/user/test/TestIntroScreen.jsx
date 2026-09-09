import { BarChart3, CheckCircle2, FileText, Info, PlayCircle } from "lucide-react";

const testDetails = [
  {
    icon: FileText,
    label: "Questions",
    value: "10",
    tone: "blue",
  },
  {
    icon: CheckCircle2,
    label: "Mode",
    value: "Project",
    tone: "orange",
  },
  {
    icon: BarChart3,
    label: "Difficulty",
    value: "Medium",
    tone: "purple",
  },
];

const tags = [
  ["HTML", "blue"],
  ["CSS", "green"],
  ["JavaScript", "yellow"],
];

const instructions = [
  "Build and preview the assigned frontend task",
  "Save your work before exiting if you want to continue later",
  "Write clean and working code",
  "Use proper syntax and follow best practices",
];

export function TestIntroScreen({ onStartTest }) {
  return (
    <section className="test-intro-page">
      <div className="test-intro-inner">
        <header className="test-hero">
          <h1>HTML &amp; CSS Test</h1>
          <p>This test will evaluate your frontend development skills.</p>
        </header>

        <div className="test-tags" aria-label="Test technologies">
          {tags.map(([label, tone]) => (
            <span className={`test-tag test-tag-${tone}`} key={label}>
              {label}
            </span>
          ))}
        </div>

        <article className="test-panel test-details-panel">
          <h2>Test Details</h2>
          <div className="test-details-grid">
            {testDetails.map((detail) => {
              const Icon = detail.icon;

              return (
                <div className="test-detail-item" key={detail.label}>
                  <span className={`test-detail-icon test-detail-${detail.tone}`}>
                    <Icon />
                  </span>
                  <span>
                    <small>{detail.label}</small>
                    <strong>{detail.value}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="test-panel">
          <h2>Instructions</h2>
          <ul className="test-instruction-list">
            {instructions.map((instruction) => (
              <li key={instruction}>
                <Info />
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="test-panel sample-panel">
          <h2>Sample Preview</h2>
          <p>You will be asked to build UI like this:</p>

          <div className="sample-stage">
            <div className="sample-card">
              <div className="sample-card-header">
                <span className="sample-avatar" />
                <span>
                  <strong>User</strong>
                  <small>Frontend Developer</small>
                </span>
              </div>
              <p>Example card layout with proper spacing and styling.</p>
              <button type="button">Learn More</button>
            </div>
          </div>
        </article>

        <div className="test-start-row">
          <button className="test-start-button" type="button" onClick={onStartTest}>
            <PlayCircle />
            Start Test
          </button>
        </div>
      </div>
    </section>
  );
}
