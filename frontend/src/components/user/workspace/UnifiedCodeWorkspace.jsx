import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import { MessageCircle, PanelLeft, Play } from "lucide-react";
import LivePreview from "../preview/LivePreview";
import ChallengeChat from "./ChallengeChat";
import { handleApplicationError } from "../../../utils/safeLogger";

const languageLabels = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
};

const LanguageTabs = memo(function LanguageTabs({ activeLanguage, onChange }) {
  const tabs = useMemo(() => Object.entries(languageLabels), []);

  return (
    <div className="editor-language-tabs" role="tablist" aria-label="Editor languages">
      {tabs.map(([language, label]) => (
        <button
          aria-selected={activeLanguage === language}
          className={activeLanguage === language ? "is-active" : ""}
          key={language}
          role="tab"
          type="button"
          onClick={() => onChange(language)}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

function UnifiedCodeWorkspace({
  activeLanguage,
  activeSidePanel,
  botMessages,
  challenge,
  code,
  onCodeChange,
  previewRef,
  questionCollapsed,
  setActiveLanguage,
  setActiveSidePanel,
  setBotMessages,
  setQuestionCollapsed,
  showBot = true,
  titleLabel,
}) {
  const editorRef = useRef(null);
  const monacoHostRef = useRef(null);
  const layoutFrameRef = useRef(null);
  const layoutTimeoutRef = useRef(null);
  const handlePreviewError = useCallback(() => handleApplicationError("Preview runtime error"), []);

  const syncEditorLayout = useCallback(() => {
    if (layoutFrameRef.current) cancelAnimationFrame(layoutFrameRef.current);
    layoutFrameRef.current = requestAnimationFrame(() => {
      editorRef.current?.layout();
    });
  }, []);

  const debouncedLayout = useCallback(() => {
    if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
    layoutTimeoutRef.current = setTimeout(syncEditorLayout, 70);
  }, [syncEditorLayout]);

  useEffect(() => {
    const host = monacoHostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(debouncedLayout);
    observer.observe(host);
    return () => observer.disconnect();
  }, [debouncedLayout]);

  useEffect(() => {
    debouncedLayout();
    const transitionLayout = setTimeout(syncEditorLayout, 220);
    return () => clearTimeout(transitionLayout);
  }, [activeLanguage, questionCollapsed, debouncedLayout, syncEditorLayout]);

  useEffect(() => () => {
    if (layoutFrameRef.current) cancelAnimationFrame(layoutFrameRef.current);
    if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
  }, []);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    syncEditorLayout();
  };

  return (
    <div className={`workspace-layout ${questionCollapsed ? "question-collapsed" : ""}`}>
      <nav className="workspace-activity-bar" aria-label="Workspace panels">
        <button
          type="button"
          className={!questionCollapsed ? "is-active" : ""}
          title={questionCollapsed ? "Show question" : "Hide question"}
          onClick={() => setQuestionCollapsed((current) => !current)}
        >
          <PanelLeft />
        </button>
      </nav>

      <aside className="workspace-question-pane">
        <div className="workspace-pane-title">
          <span>{titleLabel || challenge.title}</span>
          <small>{challenge.difficulty}</small>
        </div>
        <div className="workspace-question-content">
          <div className="workspace-question-meta">
            <span>{challenge.difficulty}</span>
            <span>{challenge.xpPoints} XP</span>
          </div>
          <div className="workspace-question-description">
            <p>{challenge.description}</p>
          </div>
        </div>
      </aside>

      <main className="workspace-editor-pane">
        <LanguageTabs activeLanguage={activeLanguage} onChange={setActiveLanguage} />
        <div className="monaco-shell workspace-monaco-shell" ref={monacoHostRef}>
          <Editor
            height="100%"
            language={activeLanguage}
            theme="vs-dark"
            value={code[activeLanguage]}
            onChange={onCodeChange}
            onMount={handleEditorMount}
            loading={<div className="cq-skel-monaco-boot" aria-hidden />}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              wordWrap: "on",
              smoothScrolling: true,
              tabSize: 2,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: false,
            }}
          />
        </div>
      </main>

      <aside className="workspace-preview-pane">
        <div className={`workspace-panel-tabs ${showBot ? "" : "single-tab"}`}>
          <button
            type="button"
            className={activeSidePanel === "preview" ? "is-active" : ""}
            onClick={() => setActiveSidePanel("preview")}
          >
            <Play />
            Live Preview
          </button>
          {showBot && (
            <button
              type="button"
              className={activeSidePanel === "bot" ? "is-active" : ""}
              onClick={() => setActiveSidePanel("bot")}
            >
              <MessageCircle />
              Ask Bot
            </button>
          )}
        </div>
        <div className={`workspace-panel-surface ${activeSidePanel === "preview" ? "is-active" : ""}`} aria-hidden={activeSidePanel !== "preview"}>
          <LivePreview
            challenge={challenge}
            code={code}
            key={challenge.id}
            onError={handlePreviewError}
            ref={previewRef}
            testCases={challenge.validationRules}
          />
        </div>
        {showBot && (
          <div className={`workspace-panel-surface ${activeSidePanel === "bot" ? "is-active" : ""}`} aria-hidden={activeSidePanel !== "bot"}>
            <ChallengeChat
              challenge={challenge}
              code={code}
              messages={botMessages}
              setMessages={setBotMessages}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

export default memo(UnifiedCodeWorkspace);
