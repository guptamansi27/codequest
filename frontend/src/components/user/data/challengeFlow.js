export const galaxies = [
  {
    id: "html",
    name: "HTML Galaxy",
    progress: 90,
    locked: false,
    color: "#5ee7ff",
    x: 19,
  },
  {
    id: "css",
    name: "CSS Galaxy",
    progress: 0,
    locked: false,
    color: "#22c55e",
    x: 50,
  },
  {
    id: "react",
    name: "React Galaxy",
    progress: 0,
    locked: false,
    color: "#38bdf8",
    x: 81,
  },
];

export const galaxyContent = {
  html: {
    title: "HTML Galaxy",
    subtitle: "Master the foundations of web development",
  },
  css: {
    title: "CSS Galaxy",
    subtitle: "Build polished layouts and responsive interfaces",
  },
  javascript: {
    title: "JavaScript Galaxy",
    subtitle: "Practice logic, functions, and data transformations",
  },
  react: {
    title: "React Galaxy",
    subtitle: "Build component-driven interactive interfaces",
  },
};

export const challengeNodes = [
  { id: "html-1", galaxy: "html", label: "1", angle: 0, orbit: 1, status: "completed" },
  { id: "html-2", galaxy: "html", label: "2", angle: 90, orbit: 1, status: "completed" },
  { id: "html-3", galaxy: "html", label: "3", angle: 180, orbit: 1, status: "unlocked" },
  { id: "html-4", galaxy: "html", label: "4", angle: 270, orbit: 1, status: "unlocked" },
  { id: "html-5", galaxy: "html", label: "5", angle: 45, orbit: 2, status: "locked" },
  { id: "html-6", galaxy: "html", label: "6", angle: 135, orbit: 2, status: "locked" },
  { id: "html-7", galaxy: "html", label: "7", angle: 225, orbit: 2, status: "locked" },
  { id: "html-8", galaxy: "html", label: "8", angle: 315, orbit: 2, status: "locked" },
  { id: "css-1", galaxy: "css", label: "1", angle: 0, orbit: 1, status: "unlocked" },
  { id: "css-2", galaxy: "css", label: "2", angle: 80, orbit: 1, status: "locked" },
  { id: "css-3", galaxy: "css", label: "3", angle: 190, orbit: 2, status: "locked" },
  { id: "react-1", galaxy: "react", label: "1", angle: 0, orbit: 1, status: "unlocked" },
  { id: "react-2", galaxy: "react", label: "2", angle: 120, orbit: 1, status: "locked" },
  { id: "react-3", galaxy: "react", label: "3", angle: 250, orbit: 2, status: "locked" },
  { id: "javascript-1", galaxy: "javascript", label: "1", angle: 0, orbit: 1, status: "unlocked" },
];

export const challenges = {
  "html-1": {
    id: "html-1",
    galaxy: "html",
    title: "Create a Semantic HTML Structure",
    type: "HTML Challenge",
    difficulty: "Easy",
    description:
      "Create a semantic HTML5 document structure with proper header, navigation, main content, and footer sections.",
    examples: [
      {
        input: "Basic page structure",
        output: "Should include <!DOCTYPE html>, <html>, <head>, and <body> tags",
      },
    ],
    constraints: [
      "Must use semantic HTML5 elements",
      "Include proper meta tags",
      "Use heading hierarchy correctly",
    ],
    starterCode: {
      html: "<!-- Write your HTML here -->\n<div class=\"profile-card\">\n\n</div>",
      css: ".profile-card {\n  padding: 24px;\n  border-radius: 12px;\n}",
      javascript: "// JavaScript is optional for this challenge\n",
    },
    testCases: [
      { id: 1, input: "Basic page structure", expected: "Uses semantic tags", status: "passed" },
      { id: 2, input: "Header content", expected: "Includes header and nav", status: "passed" },
      { id: 3, input: "Footer content", expected: "Includes footer", status: "failed" },
    ],
  },
  "html-2": {
    id: "html-2",
    galaxy: "html",
    title: "Build a Profile Card",
    type: "HTML Challenge",
    difficulty: "Easy",
    description:
      "Build a profile card with a circular avatar, name, role, body copy, and a primary action button.",
    examples: [
      { input: "Profile card", output: "Avatar, title, subtitle, description, and button" },
    ],
    constraints: ["Use accessible button text", "Keep content grouped semantically", "Use clean nesting"],
    starterCode: {
      html: "<article class=\"profile-card\">\n  <div class=\"avatar\"></div>\n  <h2>User</h2>\n  <p>Frontend Developer</p>\n</article>",
      css: ".profile-card {\n  max-width: 320px;\n  margin: auto;\n}",
      javascript: "",
    },
    testCases: [
      { id: 1, input: "Card title", expected: "Contains heading", status: "passed" },
      { id: 2, input: "Action", expected: "Contains button", status: "failed" },
    ],
  },
  "html-3": {
    id: "html-3",
    galaxy: "html",
    title: "HTML Forms and Inputs",
    type: "HTML Challenge",
    difficulty: "Medium",
    description:
      "Create a form with labels, text inputs, email validation, and a submit button.",
    examples: [
      { input: "Contact form", output: "Name, email, message, and submit controls" },
    ],
    constraints: ["Every input needs a label", "Use correct input types", "Include required fields"],
    starterCode: {
      html: "<form>\n  <!-- Add fields here -->\n</form>",
      css: "form {\n  display: grid;\n  gap: 12px;\n}",
      javascript: "",
    },
    testCases: [
      { id: 1, input: "Email field", expected: "type=\"email\"", status: "passed" },
      { id: 2, input: "Labels", expected: "Every input has label", status: "passed" },
      { id: 3, input: "Submit", expected: "Submit button exists", status: "failed" },
    ],
  },
  "html-4": {
    id: "html-4",
    galaxy: "html",
    title: "Accessible Landmark Layout",
    type: "HTML Challenge",
    difficulty: "Medium",
    description:
      "Create a page layout using accessible landmarks and a logical heading order.",
    examples: [
      { input: "Landing page", output: "Header, main, sections, aside, and footer" },
    ],
    constraints: ["One h1 only", "Use main landmark", "Use descriptive link text"],
    starterCode: {
      html: "<main>\n  <h1>Accessible Page</h1>\n</main>",
      css: "main {\n  line-height: 1.5;\n}",
      javascript: "",
    },
    testCases: [
      { id: 1, input: "Main landmark", expected: "Exists", status: "passed" },
      { id: 2, input: "Heading order", expected: "Logical", status: "passed" },
    ],
  },
  "javascript-1": {
    id: "javascript-1",
    galaxy: "javascript",
    title: "Reverse a String",
    type: "JavaScript Challenge",
    difficulty: "Easy",
    description:
      "Write a function that takes a string as input and returns the string reversed.",
    examples: [{ input: "hello", output: "olleh" }],
    constraints: ["Handle empty strings", "Handle single characters", "Return a new string"],
    starterCode: {
      html: "",
      css: "",
      javascript: "function reverseString(value) {\n  // Write your code here\n}\n",
    },
    testCases: [
      { id: 1, input: "\"hello\"", expected: "\"olleh\"", status: "passed" },
      { id: 2, input: "\"a\"", expected: "\"a\"", status: "passed" },
      { id: 3, input: "\"\"", expected: "\"\"", status: "failed" },
    ],
  },
  "html-final": {
    id: "html-final",
    galaxy: "html",
    title: "HTML Final Project",
    type: "Final Project",
    difficulty: "Hard",
    description: "Build a complete semantic landing page using all HTML concepts from this galaxy.",
    examples: [{ input: "Landing page brief", output: "Semantic, accessible page structure" }],
    constraints: ["Use semantic landmarks", "Create logical heading order", "Include accessible navigation"],
    starterCode: {
      html: "<main>\n  <h1>Final Project</h1>\n</main>",
      css: "main {\n  max-width: 960px;\n  margin: auto;\n}",
      javascript: "",
    },
    testCases: [
      { id: 1, input: "Landmarks", expected: "Header, main, footer", status: "passed" },
      { id: 2, input: "Accessibility", expected: "Readable structure", status: "failed" },
    ],
  },
  "css-1": {
    id: "css-1",
    galaxy: "css",
    title: "Responsive Card Styling",
    type: "CSS Challenge",
    difficulty: "Easy",
    description: "Style a responsive card with spacing, hover states, and a polished button.",
    examples: [{ input: "Profile card", output: "Responsive styled component" }],
    constraints: ["Use responsive units", "Add hover effect", "Keep readable contrast"],
    starterCode: {
      html: "<article class=\"card\">\n  <h2>CSS Galaxy</h2>\n</article>",
      css: ".card {\n  padding: 24px;\n}",
      javascript: "",
    },
    testCases: [
      { id: 1, input: "Card", expected: "Has padding", status: "passed" },
      { id: 2, input: "Hover", expected: "Has hover style", status: "failed" },
    ],
  },
  "css-final": {
    id: "css-final",
    galaxy: "css",
    title: "CSS Final Project",
    type: "Final Project",
    difficulty: "Hard",
    description: "Create a full responsive layout using CSS grid, flexbox, and polished states.",
    examples: [{ input: "Dashboard mockup", output: "Responsive styled dashboard" }],
    constraints: ["Use grid or flexbox", "Support small screens", "Add visible focus states"],
    starterCode: {
      html: "<section class=\"dashboard\"></section>",
      css: ".dashboard {\n  display: grid;\n}",
      javascript: "",
    },
    testCases: [
      { id: 1, input: "Layout", expected: "Responsive", status: "passed" },
      { id: 2, input: "States", expected: "Hover/focus", status: "failed" },
    ],
  },
  "react-1": {
    id: "react-1",
    galaxy: "react",
    title: "Reusable Button Component",
    type: "React Challenge",
    difficulty: "Medium",
    description: "Create a reusable button component with variants and click behavior.",
    examples: [{ input: "Button props", output: "Reusable component output" }],
    constraints: ["Use component props", "Handle click events", "Keep accessible text"],
    starterCode: {
      html: "<div id=\"root\"></div>",
      css: ".button {\n  border-radius: 8px;\n}",
      javascript: "function Button({ children }) {\n  return <button>{children}</button>;\n}\n",
    },
    testCases: [
      { id: 1, input: "Props", expected: "Renders children", status: "passed" },
      { id: 2, input: "Click", expected: "Calls handler", status: "failed" },
    ],
  },
  "react-final": {
    id: "react-final",
    galaxy: "react",
    title: "React Final Project",
    type: "Final Project",
    difficulty: "Hard",
    description: "Build an interactive mini dashboard using reusable React components.",
    examples: [{ input: "Component brief", output: "Interactive dashboard" }],
    constraints: ["Use reusable components", "Manage state", "Render lists from data"],
    starterCode: {
      html: "<div id=\"root\"></div>",
      css: ".app {\n  font-family: sans-serif;\n}",
      javascript: "function App() {\n  return <main>React Final</main>;\n}\n",
    },
    testCases: [
      { id: 1, input: "Components", expected: "Reusable", status: "passed" },
      { id: 2, input: "State", expected: "Interactive", status: "failed" },
    ],
  },
};
