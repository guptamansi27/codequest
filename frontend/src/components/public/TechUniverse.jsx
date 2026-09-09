import React from "react";
import "../../styles/public/TechUniverse.css";

const TechUniverse = () => {
  const codeBlock = `const learnCoding = () => {
  const skills = [
    'HTML', 'CSS', 
    'JavaScript', 'React'
  ];
  return skills.map(skill => 
    masterTech(skill)
  );
};`;

  return (
    <div className="tech-universe">
      <div className="code-block">
        <div className="code-header">
          <span className="code-title">codeblock.js</span>
          <div className="code-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <pre className="code-content">
          <code>{codeBlock}</code>
        </pre>
      </div>
    </div>
  );
};

export default TechUniverse;
