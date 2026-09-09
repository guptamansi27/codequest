import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import "../../styles/public/TechSpotlight.css";

const TechSpotlight = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const spotlights = [
    {
      tech: "HTML",
      title: "HTML",
      description: "The backbone of every website. Structure your ideas into reality.",
      color: "blue",
    },
    {
      tech: "CSS",
      title: "CSS",
      description: "Turn boring HTML into beautiful designs. Make the web visually stunning.",
      color: "green",
    },
    {
      tech: "JavaScript",
      title: "JavaScript",
      description: "Bring interactivity to life. Make websites interactive and dynamic.",
      color: "black",
    },
    {
      tech: "React",
      title: "React",
      description: "Build modern components with power. Create scalable web applications.",
      color: "blue",
    },
    {
      tech: "Web Design",
      title: "Web Design",
      description: "Master UX/UI principles. Create experiences users love.",
      color: "orange",
    },
    {
      tech: "Best Practices",
      title: "Best Practices",
      description: "Write clean, maintainable code. Follow industry standards.",
      color: "green",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % spotlights.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [spotlights.length]);

  const current = spotlights[currentIndex];

  return (
    <section className="tech-spotlight">
      <div className="spotlight-container">
        <div className="spotlight-header">
          <Sparkles className="spotlight-icon" />
          <h2>Tech Spotlight</h2>
        </div>

        <div className="spotlight-content">
          <h3 className={`spotlight-title ${current.color}`}>{current.title}</h3>
          <p className="spotlight-description">{current.description}</p>
        </div>

        <div className="spotlight-dots">
          {spotlights.map((spotlight, index) => (
            <button
              key={spotlight.tech}
              className={`dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to spotlight ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechSpotlight;
