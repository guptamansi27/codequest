import React from "react";
import { BarChart3, Bot, Code2, Lightbulb, Target, Trophy } from "lucide-react";
import "../../styles/public/LandingPage.css";
import TechUniverse from "../../components/public/TechUniverse";
import TechSpotlight from "../../components/public/TechSpotlight";
import Navbar from "../../components/public/Navbar";

const LandingPage = ({ onLoginClick }) => {
  const features = [
    {
      title: "Structured Learning Path",
      description: "Progress through HTML, CSS, JavaScript, and React in a logical sequence",
      icon: Target,
      tone: "blue",
    },
    {
      title: "AI-Powered Assistance",
      description: "Get instant hints, code reviews, and personalized feedback from AI",
      icon: Bot,
      tone: "green",
    },
    {
      title: "Competitive Leaderboards",
      description: "Compete with peers, track achievements, and unlock badges",
      icon: Trophy,
      tone: "orange",
    },
    {
      title: "Real-Time Analytics",
      description: "Monitor your progress with detailed reports and performance insights",
      icon: BarChart3,
      tone: "blue",
    },
    {
      title: "Code of the Day",
      description: "Daily curated coding challenges to keep your skills sharp",
      icon: Lightbulb,
      tone: "green",
    },
    {
      title: "Interactive Challenges",
      description: "Solve real-world problems with instant test case validation",
      icon: Code2,
      tone: "orange",
    },
  ];

  return (
    <div className="landing-page">
      <Navbar onLoginClick={onLoginClick} />
      <section id="hero" className="hero">
        <div className="hero-content">
          <h1 className="hero-title">CodeQuest</h1>
          <p className="hero-subtitle">
            Master Frontend Development with AI-Powered Learning
          </p>
          <p className="hero-description">
            Learn through progressive challenges in HTML, CSS, JavaScript, and React.
            Get instant AI feedback, compete on leaderboards, and track your progress.
          </p>
          <button className="cta-button primary" onClick={onLoginClick}>Start Your Quest</button>
        </div>
        <div className="hero-visual">
          <TechUniverse />
        </div>
      </section>

      <TechSpotlight />

      <section id="features" className="features">
        <h2 className="section-title">Why Choose CodeQuest?</h2>
        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div className="feature-card" key={feature.title}>
                <div className={`feature-icon ${feature.tone}`}>
                  <Icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how" className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create an Account or Login</h3>
            <p>Use your email and password to access your personalized learning dashboard</p>
          </div>
          <div className="step-arrow" aria-hidden="true">/</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choose Your Challenge</h3>
            <p>Select from curated challenges or daily code quests</p>
          </div>
          <div className="step-arrow" aria-hidden="true">/</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Code and Get Feedback</h3>
            <p>Write code with AI assistance and instant validation</p>
          </div>
          <div className="step-arrow" aria-hidden="true">/</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Level Up</h3>
            <p>Unlock new challenges and climb the leaderboard</p>
          </div>
        </div>
      </section>

      <section id="tech" className="tech-stack">
        <h2 className="section-title">Learn Modern Technologies</h2>
        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-name">HTML</div>
            <p>Master semantic markup and web structure</p>
          </div>
          <div className="tech-card">
            <div className="tech-name">CSS</div>
            <p>Create beautiful designs with responsive layouts</p>
          </div>
          <div className="tech-card">
            <div className="tech-name">JavaScript</div>
            <p>Build interactive and dynamic applications</p>
          </div>
          <div className="tech-card">
            <div className="tech-name">React</div>
            <p>Master modern component-based development</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Begin Your Coding Quest?</h2>
        <p>Join thousands of learners mastering frontend development</p>
        <button className="cta-button primary large" onClick={onLoginClick}>Start Learning Now</button>
      </section>
    </div>
  );
};

export default LandingPage;
