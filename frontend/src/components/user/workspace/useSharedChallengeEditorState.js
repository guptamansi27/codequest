import { useCallback, useMemo, useState } from "react";

const defaultBotMessages = [
  {
    role: "assistant",
    content: "Ask me for hints, debugging help, or concept explanations. I will guide you without giving away the full solution.",
  },
];

const getInitialLanguage = (galaxy) => {
  if (galaxy === "javascript" || galaxy === "react") return "javascript";
  if (galaxy === "css") return "css";
  return "html";
};

export default function useSharedChallengeEditorState({ botMessages = defaultBotMessages } = {}) {
  const [activeLanguage, setActiveLanguage] = useState("html");
  const [code, setCode] = useState(null);
  const [activeSidePanel, setActiveSidePanel] = useState("preview");
  const [questionCollapsed, setQuestionCollapsed] = useState(false);
  const [messages, setMessages] = useState(botMessages);
  const [savedCodeSnapshot, setSavedCodeSnapshot] = useState(null);

  const loadWorkspace = useCallback((challenge, initialCode) => {
    setCode(initialCode);
    setSavedCodeSnapshot(JSON.stringify(initialCode));
    setActiveLanguage(getInitialLanguage(challenge.galaxy));
    setActiveSidePanel("preview");
    setQuestionCollapsed(false);
  }, []);

  const currentCodeSnapshot = useMemo(() => (code ? JSON.stringify(code) : null), [code]);
  const hasUnsavedChanges = Boolean(code && savedCodeSnapshot !== currentCodeSnapshot);

  const markCodeSaved = useCallback((savedCode) => {
    setSavedCodeSnapshot(JSON.stringify(savedCode));
  }, []);

  const handleCodeChange = useCallback(
    (value) =>
      setCode((current) => ({
        ...current,
        [activeLanguage]: value || "",
      })),
    [activeLanguage],
  );

  const handleWorkspaceFilesChange = useCallback((updater) => {
    setCode((current) => (typeof updater === "function" ? updater(current) : updater));
  }, []);

  return {
    activeLanguage,
    activeSidePanel,
    botMessages: messages,
    code,
    handleCodeChange,
    handleWorkspaceFilesChange,
    hasUnsavedChanges,
    loadWorkspace,
    markCodeSaved,
    setActiveLanguage,
    setActiveSidePanel,
    setBotMessages: setMessages,
    setCode,
    setQuestionCollapsed,
    questionCollapsed,
  };
}
