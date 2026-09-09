import React from "react";
import { CheckCircle } from "lucide-react";
import "../../styles/public/PlatformOverview.css";

const PlatformOverview = () => {
  return (
    <div className="platform-overview">
      <div className="overview-left">
        <div className="overview-header">
          <div className="logo-circle">
            <span>&lt;/&gt;</span>
          </div>
          <h2>CodeQuest</h2>
        </div>

        <div className="overview-content">
          <p className="overview-subtitle">
            Master Frontend Development with AI-Powered Learning and Assessment
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">4+</div>
            <div className="stat-label">Tech Stacks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100+</div>
            <div className="stat-label">Challenges</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Learning Access</div>
          </div>
        </div>

        <div className="overview-footer">
          <p>AI-Powered Learning Platform</p>
          <p className="footer-small">Designed for Learners and Educators</p>
        </div>
      </div>

      <div className="overview-right">
        <div className="badge">PLATFORM OVERVIEW</div>

        <h1 className="overview-title">
          Master <span className="highlight">Frontend Skills</span>
        </h1>

        <p className="overview-description">
          CodeQuest is an AI-powered coding learning and assessment platform designed to help learners master frontend development through progressive challenges and intelligent feedback.
        </p>

        <div className="tech-section">
          <p className="tech-label">Technologies You Can Master</p>
          <div className="tech-pills">
            <span className="tech-pill">HTML</span>
            <span className="tech-pill">CSS</span>
            <span className="tech-pill">JavaScript</span>
            <span className="tech-pill">React</span>
            <span className="tech-pill">AI Assistance</span>
            <span className="tech-pill">Real-time Feedback</span>
            <span className="tech-pill">Leaderboards</span>
            <span className="tech-pill">Assessments</span>
          </div>
        </div>

        <div className="features-list">
          <div className="feature">
            <CheckCircle className="feature-icon" />
            <span>Progressive Learning Path</span>
          </div>
          <div className="feature">
            <CheckCircle className="feature-icon" />
            <span>AI-Powered Chatbot Support</span>
          </div>
        </div>

        <button className="get-started-btn">Get Started</button>
      </div>
    </div>
  );
};

export default PlatformOverview;
