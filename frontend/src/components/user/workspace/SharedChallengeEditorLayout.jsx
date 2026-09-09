import { Play, Save, Send } from "lucide-react";
import ReactWorkspace from "./ReactWorkspace";
import UnifiedCodeWorkspace from "./UnifiedCodeWorkspace";

function ActionButtonContent({ icon, isLoading, label, loadingLabel }) {
  return (
    <>
      {icon}
      <span>{isLoading ? loadingLabel : label}</span>
      {isLoading && <span className="workspace-button-spinner" aria-hidden="true" />}
    </>
  );
}

export default function SharedChallengeEditorLayout({
  activeLanguage,
  activeSidePanel,
  botMessages,
  challenge,
  code,
  hasUnsavedChanges,
  isSaving,
  isSubmitting,
  onCodeChange,
  onExit,
  onFilesChange,
  onRun,
  onSave,
  onSubmit,
  pageClassName = "",
  previewRef,
  questionCollapsed,
  runState,
  setActiveLanguage,
  setActiveSidePanel,
  setBotMessages,
  setQuestionCollapsed,
  timerLabel = "00:00:00",
}) {
  const showBot = Boolean(challenge.chatbotEnabled);

  return (
    <section className={`workspace-page ${pageClassName}`.trim()}>
      <header className="workspace-header">
        <div>
          <h1>{challenge.title}</h1>
          <p>{challenge.type} | {challenge.difficulty} | {challenge.xpPoints} XP</p>
        </div>
        <div className="workspace-actions">
          <span className="workspace-timer" title="Tracked challenge time">{timerLabel}</span>
          <button
            type="button"
            className="run-tests-button"
            disabled={runState === "running" || isSubmitting}
            onClick={onRun}
          >
            <ActionButtonContent
              icon={<Play />}
              isLoading={runState === "running" && !isSubmitting}
              label="Run"
              loadingLabel="Running"
            />
          </button>
          <button type="button" className="save-code-button" disabled={isSaving} onClick={onSave}>
            <ActionButtonContent
              icon={<Save />}
              isLoading={isSaving}
              label={hasUnsavedChanges ? "Save" : "Saved"}
              loadingLabel="Saving"
            />
          </button>
          <button type="button" className="submit-challenge-button" disabled={isSubmitting} onClick={onSubmit}>
            <ActionButtonContent
              icon={<Send />}
              isLoading={isSubmitting}
              label="Submit"
              loadingLabel="Submitting"
            />
          </button>
        </div>
      </header>

      {challenge.workspaceType === "react" ? (
        <ReactWorkspace
          botMessages={botMessages}
          challenge={challenge}
          files={code}
          onFilesChange={onFilesChange}
          previewRef={previewRef}
          setBotMessages={setBotMessages}
        />
      ) : (
        <UnifiedCodeWorkspace
          activeLanguage={activeLanguage}
          activeSidePanel={activeSidePanel}
          botMessages={botMessages}
          challenge={challenge}
          code={code}
          onCodeChange={onCodeChange}
          previewRef={previewRef}
          questionCollapsed={questionCollapsed}
          setActiveLanguage={setActiveLanguage}
          setActiveSidePanel={setActiveSidePanel}
          setBotMessages={setBotMessages}
          setQuestionCollapsed={setQuestionCollapsed}
          showBot={showBot}
        />
      )}

      <button type="button" className="screen-exit-button" onClick={onExit}>
        Exit
      </button>
    </section>
  );
}
