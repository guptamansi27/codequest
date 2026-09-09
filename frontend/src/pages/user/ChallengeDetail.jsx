import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import SharedChallengeEditorLayout from "../../components/user/workspace/SharedChallengeEditorLayout";
import useSharedChallengeEditorState from "../../components/user/workspace/useSharedChallengeEditorState";
import useChallengeWorkspaceActions from "../../components/user/workspace/useChallengeWorkspaceActions";
import useChallengeTimer from "../../components/user/workspace/useChallengeTimer";
import {
  getChallengeStatus,
  isChallengeLive,
  isTechnologyUnlocked,
  mapBackendChallenge,
} from "../../components/user/utils/challengeMapper";
import { WorkspaceSkeleton } from "../../components/ui/PremiumSkeleton";
import { notify } from "../../utils/notifications";
import { trackChallengeActivity } from "../../services/activityService";

export default function ChallengeDetail() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const openedFromCodeOfDay = location.pathname.startsWith("/user/code-of-the-day/");
  const routeId = params.id || params.challengeId;
  const [challenge, setChallenge] = useState(null);
  const [accessBlock, setAccessBlock] = useState(null);
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
  } = useSharedChallengeEditorState();
  const { formattedTime, syncTimer } = useChallengeTimer(challenge?.backendId);
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
    saveErrorMessage: "Failed to save challenge code",
    submitErrorMessage: "Failed to submit challenge",
  });

  useEffect(() => {
    Promise.all([
      api.get(`/challenges/${routeId}/`),
      api.get("/challenges/?type=challenge"),
      api.get("/submissions/"),
      api.get(`/drafts/${routeId}/`).catch(() => ({ data: { code: null } })),
    ])
      .then(([detailRes, challengeRes, submissionRes, draftRes]) => {
        const rawChallenge = detailRes.data;
        const mapped = mapBackendChallenge(rawChallenge);

        if (!isChallengeLive(rawChallenge)) {
          const status = getChallengeStatus(rawChallenge);
          setAccessBlock(
            status === "upcoming"
              ? "This challenge is not live yet. Please come back after the start time."
              : "This challenge has expired and can no longer be opened."
          );
          setChallenge(mapped);
          return;
        }

        if (!isTechnologyUnlocked(rawChallenge, challengeRes.data, submissionRes.data)) {
          setAccessBlock("Complete previous level to unlock this technology.");
          setChallenge(mapped);
          return;
        }

        let initialCode = mapped.starterCode;
        if (draftRes.data?.code) {
          try {
            initialCode = { ...mapped.starterCode, ...JSON.parse(draftRes.data.code) };
          } catch {
            initialCode = mapped.starterCode;
          }
        }

        setChallenge(mapped);
        loadWorkspace(mapped, initialCode);
        sessionStartedAtRef.current = Date.now();
        trackChallengeActivity(mapped.backendId, draftRes.data?.code ? "RESUME" : "START");
      })
      .catch((error) => {
        notify.apiError(error, "Challenge workspace could not be loaded.");
      });
  }, [loadWorkspace, routeId]);

  const backTo = challenge
    ? openedFromCodeOfDay
      ? "/user/code-of-the-day"
      : `/user/galaxy/${challenge.galaxy}`
    : "/user/galaxy";

  const requestExit = () => {
    setShowExitConfirm(true);
  };

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
      navigate(backTo);
    }
  };

  useEffect(() => {
    if (!showExitConfirm) return undefined;

    document.body.classList.add("challenge-modal-open");
    return () => document.body.classList.remove("challenge-modal-open");
  }, [showExitConfirm]);

  if (!challenge || !code) {
    if (accessBlock && challenge) {
      return (
        <section className="workspace-page workspace-blocked">
          <div className="workspace-blocked-card">
            <h1>{challenge.title}</h1>
            <p>{accessBlock}</p>
            <button type="button" onClick={() => navigate(backTo)}>
              Back to Galaxy
            </button>
          </div>
        </section>
      );
    }

    return (
      <WorkspaceSkeleton label="Loading challenge workspace" />
    );
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
        onExit={requestExit}
        onFilesChange={handleWorkspaceFilesChange}
        onRun={handleRunTests}
        onSave={handleSaveCode}
        onSubmit={handleSubmit}
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
              <button type="button" onClick={() => { trackExit(); navigate(backTo); }}>Exit</button>
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
