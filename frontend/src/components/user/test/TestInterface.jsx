import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/axiosInstance";
import SharedChallengeEditorLayout from "../workspace/SharedChallengeEditorLayout";
import useSharedChallengeEditorState from "../workspace/useSharedChallengeEditorState";
import useChallengeWorkspaceActions from "../workspace/useChallengeWorkspaceActions";
import useChallengeTimer from "../workspace/useChallengeTimer";
import { mapBackendChallenge } from "../utils/challengeMapper";
import { WorkspaceSkeleton } from "../../ui/PremiumSkeleton";
import { notify } from "../../../utils/notifications";
import { trackChallengeActivity } from "../../../services/activityService";

export function TestInterface({ assessment, onExit }) {
  const [assessmentDetail, setAssessmentDetail] = useState(null);
  const challenge = useMemo(
    () => mapBackendChallenge(assessmentDetail || assessment),
    [assessment, assessmentDetail],
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const previewRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const {
    activeLanguage,
    activeSidePanel,
    botMessages,
    code,
    handleCodeChange,
    handleWorkspaceFilesChange,
    hasUnsavedChanges,
    loadWorkspace,
    markCodeSaved,
    questionCollapsed,
    setActiveLanguage,
    setActiveSidePanel,
    setBotMessages,
    setQuestionCollapsed,
  } = useSharedChallengeEditorState({
    botMessages: [
      {
        role: "assistant",
        content: "Read the assessment goal carefully, then validate one requirement at a time.",
      },
    ],
  });
  const timerChallengeId = assessmentDetail?.id || assessment?.id;
  const { formattedTime, syncTimer } = useChallengeTimer(timerChallengeId);
  const {
    handleRunTests,
    handleSaveCode,
    handleSubmit,
    isSaving,
    isSubmitting,
    runState,
  } = useChallengeWorkspaceActions({
    challenge,
    code,
    markCodeSaved,
    previewRef,
    syncTimer,
    saveErrorMessage: "Failed to save assessment code",
    submitErrorMessage: "Failed to submit assessment",
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get(`/challenges/${assessment.id}/`),
      api.get(`/drafts/${assessment.id}/`).catch(() => ({ data: { code: null } })),
    ])
      .then(([detailRes, draftRes]) => {
        if (!isMounted) return;
        const mapped = mapBackendChallenge(detailRes.data);
        let initialCode = mapped.starterCode;

        if (draftRes.data?.code) {
          try {
            initialCode = { ...mapped.starterCode, ...JSON.parse(draftRes.data.code) };
          } catch {
            initialCode = mapped.starterCode;
          }
        }

        setAssessmentDetail(detailRes.data);
        loadWorkspace(mapped, initialCode);
        sessionStartedAtRef.current = Date.now();
        trackChallengeActivity(mapped.backendId, draftRes.data?.code ? "RESUME" : "START");
      })
      .catch((error) => {
        notify.apiError(error, "Assessment workspace could not be loaded.");
      });

    return () => {
      isMounted = false;
    };
  }, [assessment.id, loadWorkspace]);

  const trackExit = () => {
    if (!challenge?.backendId || !sessionStartedAtRef.current) return;
    trackChallengeActivity(challenge.backendId, "EXIT", {
      durationSeconds: (Date.now() - sessionStartedAtRef.current) / 1000,
    });
  };

  const saveAndExit = async () => {
    const saved = await handleSaveCode();
    if (saved) {
      trackExit();
      onExit();
    }
  };

  useEffect(() => {
    if (!showExitConfirm) return undefined;

    document.body.classList.add("challenge-modal-open");
    return () => document.body.classList.remove("challenge-modal-open");
  }, [showExitConfirm]);

  if (!assessmentDetail) {
    return <WorkspaceSkeleton label="Loading assessment workspace" />;
  }

  return (
    <>
      <SharedChallengeEditorLayout
        activeLanguage={activeLanguage}
        activeSidePanel={activeSidePanel}
        botMessages={botMessages}
        challenge={challenge}
        code={code}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        onCodeChange={handleCodeChange}
        onExit={() => setShowExitConfirm(true)}
        onFilesChange={handleWorkspaceFilesChange}
        onRun={handleRunTests}
        onSave={handleSaveCode}
        onSubmit={handleSubmit}
        pageClassName="test-workspace-page"
        previewRef={previewRef}
        questionCollapsed={questionCollapsed}
        runState={runState}
        timerLabel={formattedTime}
        setActiveLanguage={setActiveLanguage}
        setActiveSidePanel={setActiveSidePanel}
        setBotMessages={setBotMessages}
        setQuestionCollapsed={setQuestionCollapsed}
      />

      {showExitConfirm && (
        <div className="workspace-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="workspace-confirm-modal">
            <h2>Are you sure you want to exit?</h2>
            <p>You can leave now or save your current code before exiting.</p>
            <div>
              <button type="button" onClick={() => setShowExitConfirm(false)}>Cancel</button>
              <button type="button" onClick={() => { trackExit(); onExit(); }}>Exit</button>
              <button type="button" disabled={isSaving} onClick={saveAndExit}>
                {isSaving ? "Saving..." : "Save & Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
