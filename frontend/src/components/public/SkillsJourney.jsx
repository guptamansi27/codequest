import React, { useState } from "react";
import { Code2, FileCode2, Palette, Rocket, Star, Trophy } from "lucide-react";
import "../../styles/public/SkillsJourney.css";

const SkillsJourney = () => {
  const [activeLevel, setActiveLevel] = useState(0);

  const levels = [
    {
      id: 1,
      title: "HTML Foundations",
      description: "Learn semantic markup and web structure",
      challenges: 15,
      difficulty: "Beginner",
      color: "#003366",
      icon: FileCode2,
      skills: ["Semantic HTML", "Forms", "Accessibility"],
    },
    {
      id: 2,
      title: "CSS Mastery",
      description: "Create beautiful and responsive designs",
      challenges: 20,
      difficulty: "Intermediate",
      color: "#003366",
      icon: Palette,
      skills: ["Flexbox", "Grid", "Animations"],
    },
    {
      id: 3,
      title: "JavaScript Power",
      description: "Build interactive and dynamic applications",
      challenges: 25,
      difficulty: "Intermediate",
      color: "#003366",
      icon: Code2,
      skills: ["DOM Manipulation", "Events", "ES6+"],
    },
    {
      id: 4,
      title: "React Expert",
      description: "Master modern component-based development",
      challenges: 30,
      difficulty: "Advanced",
      color: "#003366",
      icon: Rocket,
      skills: ["Components", "Hooks", "State Management"],
    },
  ];

  const activeData = levels[activeLevel];
  const ActiveIcon = activeData.icon;

  return (
    <section className="skills-journey">
      <div className="section-container">
        <h2 className="journey-title">Your Learning Journey</h2>
        <p className="journey-subtitle">Progress through exciting challenges and master frontend development</p>

        <div className="journey-wrapper">
          <div className="journey-path">
            {levels.map((level, index) => {
              const Icon = level.icon;

              return (
                <div key={level.id} className="journey-item">
                  <button
                    className={`journey-node ${activeLevel === index ? "active" : ""} ${index < activeLevel ? "completed" : ""}`}
                    onClick={() => setActiveLevel(index)}
                    style={{ "--node-color": level.color }}
                  >
                    <span className="node-icon"><Icon /></span>
                  </button>
                  {index < levels.length - 1 && (
                    <div className={`journey-connector ${index < activeLevel ? "completed" : ""}`}></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="level-card">
            <div className="card-header">
              <span className="level-icon"><ActiveIcon /></span>
              <div>
                <h3 className="level-title">{activeData.title}</h3>
                <span className={`difficulty-badge ${activeData.difficulty.toLowerCase()}`}>
                  {activeData.difficulty}
                </span>
              </div>
            </div>

            <p className="level-description">{activeData.description}</p>

            <div className="level-stats">
              <div className="stat">
                <span className="stat-value">{activeData.challenges}</span>
                <span className="stat-label">Challenges</span>
              </div>
              <div className="stat">
                <span className="stat-value">2-4h</span>
                <span className="stat-label">Avg Time</span>
              </div>
              <div className="stat">
                <span className="stat-value">~50</span>
                <span className="stat-label">XP Points</span>
              </div>
            </div>

            <div className="skills-covered">
              <p className="skills-title">What You Will Learn:</p>
              <div className="skills-list">
                {activeData.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <button className="start-btn">Start This Level</button>
          </div>
        </div>

        <div className="journey-stats">
          <div className="quick-stat">
            <div className="stat-circle">
              <span>4</span>
            </div>
            <p>Tech Levels</p>
          </div>
          <div className="quick-stat">
            <div className="stat-circle">
              <span>90+</span>
            </div>
            <p>Total Challenges</p>
          </div>
          <div className="quick-stat">
            <div className="stat-circle">
              <Trophy />
            </div>
            <p>Earn Badges</p>
          </div>
          <div className="quick-stat">
            <div className="stat-circle">
              <Star />
            </div>
            <p>Track Progress</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsJourney;
