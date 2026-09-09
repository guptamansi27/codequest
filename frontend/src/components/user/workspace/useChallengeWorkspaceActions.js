import { useState } from "react";
import api from "../../../api/axiosInstance";
import { clearGalaxyDataCache } from "../galaxy/galaxyData";
import { formatSubmissionSummary, formatTestRunSummary } from "./evaluationSummary";
import { notify } from "../../../utils/notifications";
import { trackChallengeActivity } from "../../../services/activityService";

export default function useChallengeWorkspaceActions({
  challenge,
  code,
  markCodeSaved,
  previewRef,
  syncTimer,
  saveErrorMessage = "Failed to save challenge code",
  submitErrorMessage = "Failed to submit challenge",
}) {
  const [runState, setRunState] = useState("idle");
  const [, setSubmitState] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCode = async () => {
    if (!challenge || !code || isSaving) return false;
    setIsSaving(true);
    try {
      await api.put(`/drafts/${challenge.backendId}/`, {
        code: JSON.stringify(code),
      });
      markCodeSaved(code);
      notify.success("Code draft saved successfully.");
      return true;
    } catch (error) {
      notify.apiError(error, saveErrorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunTests = async () => {
    if (runState === "running" || isSubmitting) return;
    setRunState("running");
    setSubmitState("");
    try {
      await trackChallengeActivity(challenge?.backendId, "EXECUTE_TESTS");
      await syncTimer?.("sync");
      const result = await previewRef.current.runVisibleTests();
      await syncTimer?.("sync");
      notify.info(formatTestRunSummary(result));
    } catch (error) {
      await trackChallengeActivity(challenge?.backendId, "RUNTIME_FAILURE");
      setSubmitState(error.message);
      notify.error(error.message?.includes("timed out")
        ? "Execution timed out. Possible infinite loop or excessive re-render detected."
        : error.message || "Preview validation failed.");
    } finally {
      setRunState("complete");
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || runState === "running") return;
    try {
      setIsSubmitting(true);
      setRunState("running");
      setSubmitState("");
      const evaluation = await previewRef.current.runAllTests();
      await syncTimer?.("sync");
      const { data } = await api.post("/submissions/", {
        challenge: challenge.backendId,
        submitted_code: JSON.stringify(code),
        is_passed: evaluation.status === "Accepted",
        client_evaluation: evaluation,
      });
      clearGalaxyDataCache();
      if (data.challengeCompleted) {
        await syncTimer?.("complete", data);
      }
      setRunState("complete");
      setSubmitState(formatSubmissionSummary(data, evaluation));
      notify[data.submissionSuccess ? "success" : "error"](
        data.challengeCompleted
          ? "Challenge completed successfully."
          : data.submissionSuccess
            ? "Code submitted successfully."
            : formatSubmissionSummary(data, evaluation)
      );
    } catch (error) {
      if (error?.response) notify.apiError(error, submitErrorMessage);
      else notify.error(error.message || submitErrorMessage);
    } finally {
      setIsSubmitting(false);
      setRunState((current) => (current === "running" ? "complete" : current));
    }
  };

  return {
    handleRunTests,
    handleSaveCode,
    handleSubmit,
    isSaving,
    isSubmitting,
    runState,
  };
}
