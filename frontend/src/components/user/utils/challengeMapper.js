export const moduleOrder = ["HTML", "CSS", "JS", "REACT"];

export const moduleToGalaxy = {
  HTML: "html",
  CSS: "css",
  JS: "javascript",
  REACT: "react",
};

const technologyToModule = {
  html: "HTML",
  css: "CSS",
  js: "JS",
  javascript: "JS",
  react: "REACT",
};

export const getChallengeModule = (challenge) => {
  const moduleName = challenge?.module_name || challenge?.moduleName;
  if (moduleName) return String(moduleName).toUpperCase() === "JAVASCRIPT" ? "JS" : String(moduleName).toUpperCase();
  const technology = String(challenge?.technology || "").toLowerCase();
  return technologyToModule[technology] || "HTML";
};

export const getChallengeGalaxy = (challenge) =>
  moduleToGalaxy[getChallengeModule(challenge)] || "html";

export const galaxyToModule = {
  html: "HTML",
  css: "CSS",
  javascript: "JS",
  react: "REACT",
};

export const galaxyMeta = {
  html: {
    id: "html",
    name: "HTML Galaxy",
    title: "HTML Galaxy",
    subtitle: "Master semantic structure, forms, and accessible markup.",
    color: "#5ee7ff",
  },
  css: {
    id: "css",
    name: "CSS Galaxy",
    title: "CSS Galaxy",
    subtitle: "Shape responsive layouts, states, spacing, and visual systems.",
    color: "#22c55e",
  },
  javascript: {
    id: "javascript",
    name: "JavaScript Galaxy",
    title: "JavaScript Galaxy",
    subtitle: "Practice logic, DOM behavior, events, and data transformations.",
    color: "#facc15",
  },
  react: {
    id: "react",
    name: "React Galaxy",
    title: "React Galaxy",
    subtitle: "Build component-driven interfaces with state and reusable patterns.",
    color: "#38bdf8",
  },
};

export const emptyStarterCode = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeQuest</title>
</head>
<body>
    
</body>
</html>
`,
  css: "/* Write your CSS here */\n",
  javascript: "// Write your JavaScript here\n",
};

export const defaultReactFiles = {
  "package.json": `{
  "name": "codequest-react-challenge",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {}
}
`,
  "index.html": `<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
`,
  "vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
  "src/main.jsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);
`,
  "src/App.jsx": `import ChallengeCard from "./components/ChallengeCard.jsx";

export default function App() {
  return (
    <main className="app-shell">
      <h1>CodeQuest React Challenge</h1>
      <ChallengeCard title="Starter component">
        Build your component-driven solution here.
      </ChallengeCard>
    </main>
  );
}
`,
  "src/components/ChallengeCard.jsx": `export default function ChallengeCard({ title, children }) {
  return (
    <section className="challenge-card">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
`,
  "src/styles.css": `.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 32px;
  color: #0f172a;
}

.challenge-card {
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 20px;
  background: #eff6ff;
}
`,
};

const parseStarterCode = (challenge) => {
  const starter = challenge.starter_code || challenge.starterCode;
  if (!starter) return emptyStarterCode;
  if (typeof starter === "object") return { ...emptyStarterCode, ...starter };
  try {
    return { ...emptyStarterCode, ...JSON.parse(starter) };
  } catch {
    return { ...emptyStarterCode, javascript: starter };
  }
};

const parseReactWorkspace = (challenge) => {
  const starter = challenge.starter_code || challenge.starterCode || challenge.workspace_files;
  if (!starter) return defaultReactFiles;
  if (typeof starter === "object") return { ...defaultReactFiles, ...starter };
  try {
    const parsed = JSON.parse(starter);
    return { ...defaultReactFiles, ...(parsed.files || parsed) };
  } catch {
    return defaultReactFiles;
  }
};

const parseRule = (testCase) => {
  try {
    const parsed = JSON.parse(testCase.input_data || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const publicMessageForRule = (testCase, index) => {
  const rule = parseRule(testCase);
  return (
    rule.message ||
    testCase.public_description ||
    testCase.name ||
    `Requirement ${index + 1}`
  );
};

export const mapBackendChallenge = (challenge) => {
  const galaxy = getChallengeGalaxy(challenge);
  const validationRules = (challenge.test_cases || []).map((testCase, index) => ({
    id: index + 1,
    name: testCase.name || `TC-${index + 1}`,
    input: publicMessageForRule(testCase, index),
    expected: publicMessageForRule(testCase, index),
    status: "pending",
    input_data: testCase.input_data,
    expected_output: testCase.expected_output,
    is_case_sensitive: testCase.is_case_sensitive,
  }));
  return {
    id: String(challenge.id),
    backendId: challenge.id,
    galaxy,
    title: challenge.title,
    type: challenge.type?.replaceAll("_", " ") || challenge.challenge_type?.replaceAll("_", " ") || "CHALLENGE",
    difficulty: challenge.difficulty,
    description: challenge.description,
    xpPoints: challenge.xp_points,
    chatbotEnabled: challenge.is_chatbot_enabled ?? challenge.chatbot_enabled,
    examples: [],
    constraints: [],
    technology: challenge.technology,
    moduleName: getChallengeModule(challenge),
    starterCode: galaxy === "react" ? parseReactWorkspace(challenge) : parseStarterCode(challenge),
    workspaceType: galaxy === "react" ? "react" : "web",
    testCases: [],
    validationRules,
    totalTestCount: validationRules.length,
  };
};

export const isSubmissionPassed = (submissions, challengeId) =>
  submissions.some(
    (submission) =>
      Number(submission.challenge) === Number(challengeId) && submission.is_passed
  );

export const getModuleProgress = (challenges, submissions, moduleName) => {
  const moduleChallenges = challenges.filter(
    (challenge) =>
      challenge.challenge_type === "CHALLENGE" &&
      getChallengeModule(challenge) === moduleName &&
      challenge.is_active
  );
  const completed = moduleChallenges.filter((challenge) =>
    isSubmissionPassed(submissions, challenge.id)
  ).length;

  return {
    total: moduleChallenges.length,
    completed,
    progress: moduleChallenges.length
      ? Math.round((completed / moduleChallenges.length) * 100)
      : 0,
    isComplete: moduleChallenges.length > 0 && completed === moduleChallenges.length,
  };
};

export const getChallengeStatus = (challenge) => {
  if (!challenge?.is_active) return "expired";

  const now = new Date();
  const start = new Date(challenge.start_time);
  const end = new Date(challenge.end_time);

  if (now < start) return "upcoming";
  if (now > end) return "expired";
  return "active";
};

export const isChallengeLive = (challenge) =>
  getChallengeStatus(challenge) === "active";

export const isTechnologyUnlocked = (challenge, challenges, submissions) => {
  if (challenge.challenge_type !== "CHALLENGE") return true;

  const currentIndex = moduleOrder.indexOf(getChallengeModule(challenge));
  if (currentIndex <= 0) return true;

  return moduleOrder
    .slice(0, currentIndex)
    .every((moduleName) => getModuleProgress(challenges, submissions, moduleName).isComplete);
};
