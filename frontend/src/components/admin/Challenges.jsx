import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import aiService from "../../services/aiService";
import { BookOpen, Bot, CheckCircle2, ChevronDown, ChevronUp, Code, Download, FileText, FlaskConical, Layers, Plus, Power, Search, Settings, Upload, X } from "lucide-react";
import ContentWrapper from "../layout/ContentWrapper";
import PageContainer from "../layout/PageContainer";
import { InlineButtonSkeleton } from "../ui/PremiumSkeleton";
import { defaultReactFiles } from "../user/utils/challengeMapper";
import ChallengeScheduleFields from "./ChallengeScheduleFields";
import {
  getScheduleErrors,
  nowDatetimeLocal,
  toDatetimeLocal,
  toUtcIsoString,
} from "../../utils/challengeSchedule";
import { notify } from "../../utils/notifications";
import { createSecureId } from "../../utils/secureRandom";
import {
  getDefaultValidationType,
  getValidationDefinition,
  getValidationFormFields,
  getValidationMetadata,
  getValidationMetadataForStack,
  getValidationTypesForStack,
  isValidationAllowedForStack,
} from "../../challenge_engine/validationRegistry";
import "../../styles/admin/Challenges.css";

const STACKS = [
  { key: "HTML", label: "HTML" },
  { key: "CSS", label: "HTML + CSS" },
  { key: "JS", label: "HTML + CSS + JavaScript" },
  { key: "REACT", label: "React" },
];

const difficulties = ["Easy", "Medium", "Hard"];
const challengeTypes = ["Challenge", "Assessment", "Code of the Day"];

const CHALLENGE_TYPE_MAP = {
  Challenge: "CHALLENGE",
  Assessment: "ASSESSMENT",
  "Code of the Day": "CODE_OF_DAY",
};

const API_TYPE_TO_LABEL = {
  CHALLENGE: "Challenge",
  ASSESSMENT: "Assessment",
  CODE_OF_DAY: "Code of the Day",
};

const TESTCASE_FIELD_CONFIG = {
  selector: { label: "Selector", placeholder: "h1, .card, [data-testid='title']" },
  targetSelector: { label: "Target Selector", placeholder: ".result, #status" },
  buttonSelector: { label: "Button Selector", placeholder: "button, .increment" },
  inputSelector: { label: "Input Selector", placeholder: "input, textarea, select" },
  attribute: { label: "Attribute", placeholder: "alt, aria-expanded, disabled" },
  property: { label: "CSS Property", placeholder: "color, display, background-color" },
  className: { label: "Class Name", placeholder: "active, primary-card" },
  expected: { label: "Expected Text / Value", placeholder: "Hello World, 1, Submitted" },
  expectedCount: { label: "Expected Item Count", placeholder: "3", type: "number" },
  inputValue: { label: "Input Value", placeholder: "CodeQuest" },
  event: { label: "Event", placeholder: "click, change, keydown" },
  timeout: { label: "Timeout (ms)", placeholder: "3000", type: "number" },
};

const buildFailureMessage = (testCase) => {
  const selector = testCase.selector || testCase.targetSelector || testCase.buttonSelector || testCase.inputSelector || "target";
  const expected = testCase.expected || testCase.expectedCount || "";
  const messages = {
    elementExists: `Expected ${selector} to exist`,
    textContentEquals: `Expected ${selector} text to equal ${expected}`,
    hasText: `Expected ${selector} to contain ${expected}`,
    buttonClickUpdatesText: "Expected count to update after click",
    domUpdatesAfterClick: "Expected DOM to update after click",
    inputUpdatesState: "Expected input to update visible state",
    styleMatches: `Expected ${selector} style to match ${expected}`,
    rendersList: `Expected list to render ${expected} items`,
    rendersMappedItems: "Expected mapped items to render",
    rendersDynamicListLength: `Expected dynamic list length to be ${expected}`,
    rendersPropValue: "Expected prop value not rendered",
    formSubmitsSuccessfully: "Expected form submission result not rendered",
    validationMessageAppears: "Expected validation message to appear",
    togglesElementVisibility: "Expected element visibility to toggle",
    asyncContentRenders: "Expected async content to render",
    delayedStateUpdate: "Expected delayed state update to render",
  };
  return messages[testCase.type] || `Expected ${selector} validation to pass`;
};

const makeDraftId = () => createSecureId("challenge-draft");

const getSessionRole = () => (localStorage.getItem("role") || "").toUpperCase();
const formatFileSize = (size = 0) => {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const emptyChallenge = () => ({
  draftId: makeDraftId(),
  title: "",
  description: "",
  stack: "",
  difficulty: "",
  xpPoints: "",
  challengeType: "",
  startAt: "",
  endAt: "",
  chatbotEnabled: false,
  isActive: true,
  testCases: [],
});

const parseTestCase = (tc) => {
  let parsed = {};
  try {
    parsed = tc.input_data ? JSON.parse(tc.input_data) : {};
  } catch {
    parsed = {};
  }
  return {
    type: parsed.type || "elementExists",
    selector: parsed.selector || "",
    targetSelector: parsed.targetSelector || parsed.target_selector || "",
    buttonSelector: parsed.buttonSelector || parsed.button_selector || "",
    inputSelector: parsed.inputSelector || parsed.input_selector || "",
    attribute: parsed.attribute || "",
    property: parsed.property || "",
    className: parsed.className || parsed.class || "",
    expectedCount: parsed.expectedCount || parsed.expected_count || parsed.count || "",
    inputValue: parsed.inputValue || parsed.input_value || parsed.value || "",
    event: parsed.event || "click",
    timeout: parsed.timeout || "",
    expected: parsed.expected || "",
    message: parsed.message || tc.expected_output || "",
  };
};

const sanitizeTestCaseForStack = (testCase, stack) => {
  const fallbackType = getDefaultValidationType(stack);
  const type = isValidationAllowedForStack(testCase.type, stack) ? testCase.type : fallbackType;
  return { ...testCase, type };
};

const fromClone = (clone) => ({
  ...emptyChallenge(),
  title: clone.title?.replace(/\s+\(Copy\)$/i, "") || "",
  description: clone.description || "",
  stack: clone.module_name || "",
  difficulty: clone.difficulty ? clone.difficulty[0] + clone.difficulty.slice(1).toLowerCase() : "",
  xpPoints: clone.xp_points || "",
  challengeType: API_TYPE_TO_LABEL[clone.challenge_type] || "",
  startAt: toDatetimeLocal(clone.start_time),
  endAt: toDatetimeLocal(clone.end_time),
  chatbotEnabled: Boolean(clone.chatbot_enabled || clone.is_chatbot_enabled),
  isActive: Boolean(clone.is_active),
  testCases: (clone.test_cases || []).map(parseTestCase),
});

const Challenges = ({ embedded = false, initialClone = null, onSuccess, bulkOnly = false } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const cloneSource = initialClone || location.state?.clone;
  const isSME = getSessionRole() === "SME";
  const [challenges, setChallenges] = useState(() => {
    const draft = cloneSource ? fromClone(cloneSource) : emptyChallenge();
    return [draft];
  });
  const [modules, setModules] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [aiErrors, setAiErrors] = useState({});
  const [accuracyLoading, setAccuracyLoading] = useState({});
  const [accuracyResult, setAccuracyResult] = useState(null);
  const [bulkUpload, setBulkUpload] = useState({ loading: false, preview: [], importToken: "", errorReportToken: "", errors: [] });
  const [guideState, setGuideState] = useState({ open: false, search: "", stack: "HTML" });
  useEffect(() => {
    api.get("/modules/")
      .then((moduleRes) => {
        setModules(moduleRes.data);
      })
      .catch((error) => {
        notify.apiError(error, "Unable to load setup data.");
      });
  }, []);

  const [currentDateTime, setCurrentDateTime] = useState(nowDatetimeLocal);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentDateTime(nowDatetimeLocal()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const getModuleId = (stack) => modules.find((module) => module.name === stack)?.id;
  const scheduleErrorsByDraft = useMemo(
    () => Object.fromEntries(challenges.map((challenge) => [
      challenge.draftId,
      getScheduleErrors({
        start: challenge.startAt,
        end: challenge.endAt,
        mode: "create",
        now: currentDateTime,
      }),
    ])),
    [challenges, currentDateTime],
  );
  const updateChallenge = (draftId, updater) => {
    setChallenges((prev) => prev.map((item) => {
      if (item.draftId !== draftId) return item;
      return typeof updater === "function" ? updater(item) : { ...item, ...updater };
    }));
  };

  const updateChallengeStack = (draftId, stack) => {
    updateChallenge(draftId, (challenge) => ({
      ...challenge,
      stack,
      testCases: challenge.testCases.map((testCase) => sanitizeTestCaseForStack(testCase, stack)),
    }));
  };

  const downloadBulkTemplate = async () => {
    try {
      const response = await api.get("/challenges/bulk-upload/template/", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "challenge-bulk-upload-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notify.apiError(error, "Bulk challenge template could not be downloaded.");
    }
  };

  const validateBulkUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      notify.validation("Only .xlsx files are supported.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setBulkUpload({ loading: true, preview: [], importToken: "", errorReportToken: "", errors: [] });
    try {
      const response = await api.post("/challenges/bulk-upload/validate/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBulkUpload({
        loading: false,
        preview: response.data.preview || [],
        importToken: response.data.import_token || "",
        errorReportToken: "",
        errors: [],
      });
      notify.success(`${response.data.challenge_count} challenges validated. Review preview before import.`);
    } catch (error) {
      const data = error.response?.data || {};
      setBulkUpload({
        loading: false,
        preview: [],
        importToken: "",
        errorReportToken: data.error_report_token || "",
        errors: data.errors || [],
      });
      notify.apiError(error, "Bulk upload validation failed.");
    }
  };

  const downloadBulkErrorReport = async () => {
    if (!bulkUpload.errorReportToken) return;
    try {
      const response = await api.get(`/challenges/bulk-upload/errors/${bulkUpload.errorReportToken}/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "challenge-bulk-upload-errors.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notify.apiError(error, "Error report could not be downloaded.");
    }
  };

  const importBulkUpload = async () => {
    if (!bulkUpload.importToken) return;
    setBulkUpload((current) => ({ ...current, loading: true }));
    try {
      const response = await api.post("/challenges/bulk-upload/import/", { import_token: bulkUpload.importToken });
      notify.success(`${Array.isArray(response.data) ? response.data.length : bulkUpload.preview.length} challenges imported as inactive drafts.`);
      setBulkUpload({ loading: false, preview: [], importToken: "", errorReportToken: "", errors: [] });
      onSuccess?.();
    } catch (error) {
      setBulkUpload((current) => ({ ...current, loading: false }));
      notify.apiError(error, "Bulk challenges could not be imported.");
    }
  };

  const updateTC = (draftId, index, field, value) => {
    updateChallenge(draftId, (challenge) => ({
      ...challenge,
      testCases: challenge.testCases.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, [field]: value } : testCase
      ),
    }));
  };

  const renderTestCaseField = (challenge, testCase, index, field) => {
    const config = TESTCASE_FIELD_CONFIG[field];
    if (!config) return null;
    return (
      <label className="challenge-field" key={field}>
        <span>{config.label}</span>
        <input
          type={config.type || "text"}
          placeholder={config.placeholder}
          value={testCase[field] || ""}
          onChange={(event) => updateTC(challenge.draftId, index, field, event.target.value)}
        />
      </label>
    );
  };

  const addTC = (draftId) => {
    updateChallenge(draftId, (challenge) => ({
      ...challenge,
      testCases: [...challenge.testCases, {
        type: getDefaultValidationType(challenge.stack),
        selector: "",
        targetSelector: "",
        buttonSelector: "",
        inputSelector: "",
        attribute: "",
        property: "",
        className: "",
        expectedCount: "",
        inputValue: "",
        event: "click",
        timeout: "",
        expected: "",
        message: "",
      }],
    }));
  };

  const toEditableTestCase = (testCase) => ({
    type: testCase.type || "elementExists",
    selector: testCase.selector || "body",
    targetSelector: testCase.targetSelector || testCase.target_selector || "",
    buttonSelector: testCase.buttonSelector || testCase.button_selector || "",
    inputSelector: testCase.inputSelector || testCase.input_selector || "",
    attribute: testCase.attribute || "",
    property: testCase.property || "",
    className: testCase.className || testCase.class || "",
    expectedCount: testCase.expectedCount || testCase.expected_count || testCase.count || "",
    inputValue: testCase.inputValue || testCase.input_value || testCase.value || "",
    event: testCase.event || "click",
    timeout: testCase.timeout || "",
    expected: testCase.expected || "",
    message: testCase.message || testCase.expected || "",
  });

  const generateAITestCases = async (draftId) => {
    if (!isSME) {
      notify.error("Only SME users can generate AI test cases.");
      return;
    }

    const challenge = challenges.find((item) => item.draftId === draftId);
    if (!challenge) return;

    if (!challenge.title.trim() || !challenge.description.trim() || !challenge.stack) {
      setAiErrors((prev) => ({
        ...prev,
        [draftId]: "Enter a title, description, and technology stack before generating testcases.",
      }));
      return;
    }

    setAiLoading((prev) => ({ ...prev, [draftId]: true }));
    setAiErrors((prev) => ({ ...prev, [draftId]: "" }));

    try {
      const result = await aiService.generateTestCases({
        title: challenge.title,
        description: challenge.description,
        technology: challenge.stack,
        difficulty: challenge.difficulty,
      });

      const generatedTestCases = (result.testcases || [])
        .map(toEditableTestCase)
        .map((testCase) => sanitizeTestCaseForStack(testCase, challenge.stack));
      if (!result.success || !generatedTestCases.length) {
        throw new Error("AI did not return usable testcases.");
      }

      updateChallenge(draftId, (currentChallenge) => ({
        ...currentChallenge,
        testCases: generatedTestCases,
      }));
      notify.success("AI test cases added. Review them before saving.");
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.detail || err.message || "Unable to generate AI testcases right now.";
      setAiErrors((prev) => ({ ...prev, [draftId]: message }));
      notify.error(message);
    } finally {
      setAiLoading((prev) => ({ ...prev, [draftId]: false }));
    }
  };

  const checkTestCaseAccuracy = async (draftId) => {
    const challenge = challenges.find((item) => item.draftId === draftId);
    if (!challenge) return;
    if (!challenge.title.trim() || !challenge.description.trim() || !challenge.stack) {
      notify.validation("Enter a title, description, and technology stack before checking accuracy.");
      return;
    }
    if (!challenge.testCases.length) {
      notify.validation("Add at least one testcase before checking accuracy.");
      return;
    }
    setAccuracyLoading((prev) => ({ ...prev, [draftId]: true }));
    try {
      const result = await aiService.validateTestCaseAccuracy({
        title: challenge.title,
        description: challenge.description,
        technology: challenge.stack,
        difficulty: challenge.difficulty,
        testcases: challenge.testCases.map((testCase) => sanitizeTestCaseForStack(testCase, challenge.stack)),
      });
      setAccuracyResult(result);
    } catch (error) {
      notify.apiError(error, "Testcase accuracy could not be checked.");
    } finally {
      setAccuracyLoading((prev) => ({ ...prev, [draftId]: false }));
    }
  };

  const removeTC = (draftId, index) => {
    updateChallenge(draftId, (challenge) => ({
      ...challenge,
      testCases: challenge.testCases.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const addChallenge = () => {
    const draft = emptyChallenge();
    setChallenges((prev) => [...prev, draft]);
    setCollapsed(Object.fromEntries([...challenges.map((item) => [item.draftId, true]), [draft.draftId, false]]));
  };

  const removeChallenge = (draftId) => {
    if (challenges.length === 1) {
      notify.info("At least one challenge is required.");
      return;
    }
    setChallenges((prev) => prev.filter((challenge) => challenge.draftId !== draftId));
  };

  const validateOne = (challenge, index) => {
    const requiredFields = ["title", "description", "difficulty", "challengeType", "stack", "xpPoints", "startAt", "endAt"];
    const missingField = requiredFields.find((field) => !challenge[field]);
    if (missingField) return `Challenge ${index + 1}: please fill all challenge details before publishing`;
    const scheduleErrors = getScheduleErrors({
      start: challenge.startAt,
      end: challenge.endAt,
      mode: "create",
      now: nowDatetimeLocal(),
    });
    if (scheduleErrors.start || scheduleErrors.end) {
      return `Challenge ${index + 1}: ${scheduleErrors.start || scheduleErrors.end}`;
    }
    if (!getModuleId(challenge.stack)) return `Challenge ${index + 1}: selected technology module was not found`;
    return "";
  };

  const toPayload = (challenge) => ({
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty.toUpperCase(),
    challenge_type: CHALLENGE_TYPE_MAP[challenge.challengeType],
    module: getModuleId(challenge.stack),
    starter_code: challenge.stack === "REACT" ? defaultReactFiles : {},
    xp_points: Number(challenge.xpPoints),
    chatbot_enabled: challenge.chatbotEnabled,
    is_chatbot_enabled: challenge.chatbotEnabled,
    is_active: challenge.isActive,
    start_time: toUtcIsoString(challenge.startAt),
    end_time: toUtcIsoString(challenge.endAt),
    test_cases: challenge.testCases.map((tc, index) => {
      const sanitized = sanitizeTestCaseForStack(tc, challenge.stack);
      return {
        name: `TC-${index + 1}`,
        input_data: JSON.stringify({
          type: sanitized.type,
          selector: tc.selector || "",
          targetSelector: tc.targetSelector || "",
          buttonSelector: tc.buttonSelector || "",
          inputSelector: tc.inputSelector || "",
          attribute: tc.attribute || "",
          property: tc.property || "",
          className: tc.className || "",
          expectedCount: tc.expectedCount || "",
          inputValue: tc.inputValue || "",
          event: tc.event || "click",
          timeout: tc.timeout || "",
          expected: tc.expected || "",
          message: tc.message || buildFailureMessage(sanitized),
        }),
        expected_output: tc.message || buildFailureMessage(sanitized),
        is_case_sensitive: true,
      };
    }),
  });

  const publish = async () => {
    const freshNow = nowDatetimeLocal();
    const latestScheduleErrors = challenges.map((challenge) => getScheduleErrors({
      start: challenge.startAt,
      end: challenge.endAt,
      mode: "create",
      now: freshNow,
    }));
    setCurrentDateTime(freshNow);
    if (latestScheduleErrors.some((errors) => errors.start || errors.end)) return;

    const validationError = challenges.map(validateOne).find(Boolean);
    if (validationError) {
      notify.validation(validationError);
      return;
    }

    try {
      setSaving(true);
      const response = await api.post("/challenges/", { challenges: challenges.map(toPayload) });
      const created = Array.isArray(response.data) ? response.data : [response.data];
      void created;
      notify.success(`${challenges.length} challenge${challenges.length > 1 ? "s" : ""} published successfully.`);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/sme/challenges");
      }
    } catch (err) {
      notify.apiError(err, "Challenge could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const hasScheduleErrors = Object.values(scheduleErrorsByDraft).some((errors) => errors.start || errors.end);
  const guideStack = guideState.stack || challenges.find((challenge) => challenge.stack)?.stack || "HTML";
  const guideItems = getValidationMetadataForStack(guideStack).filter((item) => {
    const query = guideState.search.trim().toLowerCase();
    if (!query) return true;
    return [item.label, item.id, item.description, item.exampleChallenge].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  const content = (
        <div className="challenges">
          <header className="challenge-create-header">
            <div>
              <h1>{bulkOnly ? "Bulk Upload" : cloneSource ? "Clone Challenge" : "Create Challenges"}</h1>
              <p>
                {bulkOnly
                  ? "Download the workbook template, fill it with challenges and test cases, then validate it before importing."
                  : "Author one or many public challenges with test cases, state controls, and schedules."}
              </p>
            </div>
            {!bulkOnly && (
              <div className="challenge-create-header-actions">
                <button type="button" className="add-test-button bulk-add-button" onClick={addChallenge}><Plus /> Add Another Challenge</button>
              </div>
            )}
          </header>

          {bulkOnly ? (
            <section className="bulk-upload-panel">
              <div className="bulk-upload-panel-copy">
                <span>Excel import</span>
                <h2>Prepare and validate your bulk challenge workbook</h2>
                <p>Use the template columns exactly as provided. Validated rows are imported as inactive drafts so they can be reviewed before publishing.</p>
              </div>
              <div className="bulk-upload-actions">
                <button type="button" className="bulk-upload-action-button" onClick={downloadBulkTemplate}>
                  <Download size={18} /> Bulk Template
                </button>
                <label className="bulk-upload-action-button bulk-upload-trigger">
                  <Upload size={18} /> Validate Excel
                  <input type="file" accept=".xlsx" onChange={(event) => validateBulkUpload(event.target.files?.[0])} />
                </label>
              </div>
            </section>
          ) : (
          <>
          <div className="bulk-challenge-stack">
            {challenges.map((challenge, challengeIndex) => {
              const isCollapsed = Boolean(collapsed[challenge.draftId]);
              return (
                <section className={`bulk-challenge-card ${isCollapsed ? "is-collapsed" : ""}`} key={challenge.draftId}>
                  <button
                    type="button"
                    className="bulk-challenge-card-header"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [challenge.draftId]: !prev[challenge.draftId] }))}
                  >
                    <span>
                      <strong>Challenge {challengeIndex + 1}</strong>
                      <small>{challenge.title || "Untitled challenge"}{challenge.challengeType ? ` | ${challenge.challengeType}` : ""}</small>
                    </span>
                    {isCollapsed ? <ChevronDown /> : <ChevronUp />}
                  </button>

                  {!isCollapsed && (
                    <div className="bulk-challenge-card-body">
                      <div className="form-section">
                        <h3><FileText /> Challenge Details</h3>
                        <div className="challenge-field-grid challenge-field-grid-wide">
                          <label className="challenge-field challenge-field-full">
                            <span>Title</span>
                            <input name="title" placeholder="Build a responsive navbar" value={challenge.title} onChange={(e) => updateChallenge(challenge.draftId, { title: e.target.value })} />
                          </label>
                          <label className="challenge-field challenge-field-full">
                            <span>Description</span>
                            <textarea rows={4} placeholder="Describe what the learner needs to build and the expected behavior." value={challenge.description} onChange={(e) => updateChallenge(challenge.draftId, { description: e.target.value })} />
                          </label>
                          <label className="challenge-field">
                            <span>Type</span>
                            <select value={challenge.challengeType} onChange={(e) => updateChallenge(challenge.draftId, { challengeType: e.target.value })}>
                              <option value="">Select Type</option>
                              {challengeTypes.map((type) => <option key={type}>{type}</option>)}
                            </select>
                          </label>
                          <label className="challenge-field">
                            <span>Technology Stack</span>
                            <select value={challenge.stack} onChange={(e) => updateChallengeStack(challenge.draftId, e.target.value)}>
                              <option value="">Select Technology Stack</option>
                              {STACKS.map((stack) => <option key={stack.key} value={stack.key}>{stack.label}</option>)}
                            </select>
                          </label>
                          <label className="challenge-field">
                            <span>Difficulty</span>
                            <select value={challenge.difficulty} onChange={(e) => updateChallenge(challenge.draftId, { difficulty: e.target.value })}>
                              <option value="">Difficulty</option>
                              {difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
                            </select>
                          </label>
                          <label className="challenge-field">
                            <span>XP Points</span>
                            <input type="number" min="1" placeholder="20" value={challenge.xpPoints} onChange={(e) => updateChallenge(challenge.draftId, { xpPoints: e.target.value })} />
                          </label>
                        </div>
                        <div className="challenge-state-controls">
                          <label className={challenge.isActive ? "state-toggle is-on" : "state-toggle"}>
                            <input type="checkbox" checked={challenge.isActive} onChange={(e) => updateChallenge(challenge.draftId, { isActive: e.target.checked })} />
                            <Power size={16} /> {challenge.isActive ? "Active" : "Inactive"}
                          </label>
                          <label className={challenge.chatbotEnabled ? "state-toggle is-on" : "state-toggle"}>
                            <input type="checkbox" checked={challenge.chatbotEnabled} onChange={(e) => updateChallenge(challenge.draftId, { chatbotEnabled: e.target.checked })} />
                            <Bot size={16} /> {challenge.chatbotEnabled ? "Chatbot On" : "Chatbot Off"}
                          </label>
                        </div>
                      </div>

                      <div className="form-section">
                        <h3><Settings /> Schedule</h3>
                        <ChallengeScheduleFields
                          start={challenge.startAt}
                          end={challenge.endAt}
                          onStartChange={(value) => updateChallenge(challenge.draftId, { startAt: value })}
                          onEndChange={(value) => updateChallenge(challenge.draftId, { endAt: value })}
                          errors={scheduleErrorsByDraft[challenge.draftId]}
                          startHelper="Choose a future start time."
                          endHelper="End time must stay in the future and after start."
                        />
                      </div>

                      <div className="form-section">
                        <div className="test-case-section-header">
                          <h3><FlaskConical /> Test Cases</h3>
                          {isSME && (
                            <button
                              type="button"
                              className="generate-ai-button"
                              onClick={() => generateAITestCases(challenge.draftId)}
                              disabled={Boolean(aiLoading[challenge.draftId])}
                            >
                              {aiLoading[challenge.draftId] ? (
                                <InlineButtonSkeleton />
                              ) : (
                                <Layers />
                              )}
                              {aiLoading[challenge.draftId] ? "Generating..." : "Generate AI Testcases"}
                            </button>
                          )}
                          {isSME && (
                            <button
                              type="button"
                              className="generate-ai-button"
                              onClick={() => checkTestCaseAccuracy(challenge.draftId)}
                              disabled={Boolean(accuracyLoading[challenge.draftId])}
                            >
                              <CheckCircle2 />
                              {accuracyLoading[challenge.draftId] ? "Checking..." : "Check Accuracy"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="generate-ai-button"
                            onClick={() => setGuideState((current) => ({ ...current, open: true, stack: challenge.stack || current.stack || "HTML" }))}
                          >
                            <BookOpen />
                            Validation Guide
                          </button>
                        </div>
                        {aiErrors[challenge.draftId] && (
                          <div className="ai-testcase-error" role="status">
                            {aiErrors[challenge.draftId]}
                          </div>
                        )}

                        {challenge.testCases.map((testCase, index) => (
                          <div key={index} className="test-case-card">
                            <div className="test-case-card-header">
                              <strong>Test Case {index + 1}</strong>
                              <button type="button" className="remove-test-button" onClick={() => removeTC(challenge.draftId, index)}><X /> Remove</button>
                            </div>
                            {(() => {
                              const selectedType = sanitizeTestCaseForStack(testCase, challenge.stack).type;
                              const metadata = getValidationMetadata(selectedType);
                              return (
                            <div className="challenge-field-grid">
                              <label className="challenge-field">
                                <span>Validation Type</span>
                                <select value={selectedType} onChange={(event) => updateTC(challenge.draftId, index, "type", event.target.value)}>
                                  {getValidationTypesForStack(challenge.stack).map((type) => {
                                    const definition = getValidationDefinition(type);
                                    return <option key={type} value={type}>{definition.label}</option>;
                                  })}
                                </select>
                                <small className="validation-helper-text">
                                  {metadata.description}
                                </small>
                              </label>
                              {getValidationFormFields(selectedType)
                                .map((field) => renderTestCaseField(challenge, testCase, index, field))}
                              <div className="validation-smart-help challenge-field-full">
                                <strong>{metadata.exampleChallenge}</strong>
                                <span>{metadata.exampleTestcase}</span>
                                <small>Pass: {metadata.passExample}</small>
                                <small>Fail: {metadata.failExample}</small>
                              </div>
                            </div>
                              );
                            })()}
                          </div>
                        ))}

                        <button type="button" className="add-test-button" onClick={() => addTC(challenge.draftId)}><Code /> Add Test Case</button>
                      </div>

                      <div className="bulk-card-actions">
                        <button type="button" className="secondary-button" onClick={() => removeChallenge(challenge.draftId)}><X /> Remove Challenge</button>
                        <button type="button" className="secondary-button" onClick={() => setCollapsed((prev) => ({ ...prev, [challenge.draftId]: true }))}><CheckCircle2 /> Collapse</button>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="publish-bar">
            <div>
              <strong>Ready to submit?</strong>
              <span>{challenges.length} challenge{challenges.length > 1 ? "s" : ""} will be saved with independent test cases and schedules.</span>
            </div>
            <button type="button" className="publish-bar-submit" onClick={publish} disabled={saving || hasScheduleErrors}>
              {saving ? "Creating…" : "Create Challenges"}
            </button>
          </div>
          </>
          )}

          {accuracyResult && (
            <div className="accuracy-modal-backdrop" role="dialog" aria-modal="true">
              <div className="accuracy-modal">
                <button type="button" className="accuracy-modal-close" onClick={() => setAccuracyResult(null)}><X size={18} /></button>
                <div className="accuracy-ring" style={{ "--accuracy": `${accuracyResult.accuracy || 0}%` }}>
                  <strong>{accuracyResult.accuracy || 0}%</strong>
                  <span>Accuracy</span>
                </div>
                <h2>Testcase Accuracy</h2>
                <p>{accuracyResult.summary}</p>
                {accuracyResult.improvement_note && (
                  <section className="accuracy-note">
                    <p>{accuracyResult.improvement_note}</p>
                  </section>
                )}
              </div>
            </div>
          )}

          {(bulkUpload.preview.length > 0 || bulkUpload.errors.length > 0 || bulkUpload.loading) && (
            <div className="accuracy-modal-backdrop" role="dialog" aria-modal="true">
              <div className="bulk-upload-modal">
                <button type="button" className="accuracy-modal-close" onClick={() => setBulkUpload({ loading: false, preview: [], importToken: "", errorReportToken: "", errors: [] })}><X size={18} /></button>
                <h2>Bulk Challenge Upload</h2>
                {bulkUpload.loading && <p>Validating workbook...</p>}
                {bulkUpload.errors.length > 0 && (
                  <>
                    <p>{bulkUpload.errors.length} validation issue{bulkUpload.errors.length > 1 ? "s" : ""} found. Fix the workbook before importing.</p>
                    <div className="bulk-error-list">
                      {bulkUpload.errors.map((error) => (
                        <div key={`${error.sheet}-${error.row}-${error.error}`}>
                          <strong>{error.sheet} row {error.row}</strong>
                          <span>{error.error}</span>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="generate-ai-button" onClick={downloadBulkErrorReport}><Download /> Download Error Report</button>
                  </>
                )}
                {bulkUpload.preview.length > 0 && (
                  <>
                    <p>Review these inactive challenge drafts before importing.</p>
                    <div className="bulk-preview-table">
                      <table>
                        <thead>
                          <tr><th>Code</th><th>Title</th><th>Type</th><th>Difficulty</th><th>Tests</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {bulkUpload.preview.map((row) => (
                            <tr key={row.challenge_code}>
                              <td>{row.challenge_code}</td>
                              <td>{row.title}</td>
                              <td>{row.type}</td>
                              <td>{row.difficulty}</td>
                              <td>{row.testcase_count}</td>
                              <td>{row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" className="publish-bar-submit" disabled={bulkUpload.loading} onClick={importBulkUpload}>
                      Import Validated Challenges
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {guideState.open && (
            <div className="validation-guide-backdrop" role="dialog" aria-modal="true">
              <aside className="validation-guide-drawer">
                <header>
                  <div>
                    <span>Validation Guide</span>
                    <h2>{guideStack === "CSS" ? "HTML + CSS" : guideStack === "JS" ? "JavaScript" : guideStack} validations</h2>
                  </div>
                  <button type="button" onClick={() => setGuideState((current) => ({ ...current, open: false }))}><X /></button>
                </header>
                <div className="validation-guide-search">
                  <Search />
                  <input
                    value={guideState.search}
                    placeholder="Search validations, examples, fields..."
                    onChange={(event) => setGuideState((current) => ({ ...current, search: event.target.value }))}
                  />
                </div>
                <div className="validation-guide-tabs">
                  <button type="button" className="is-active">
                    {STACKS.find((stack) => stack.key === guideStack)?.label || guideStack}
                  </button>
                </div>
                <div className="validation-guide-list">
                  {guideItems.map((item) => (
                    <article key={item.id} className="validation-guide-card">
                      <div className="validation-guide-card-head">
                        <div>
                          <span className="validation-guide-type">{item.id}</span>
                          <h3>{item.label}</h3>
                        </div>
                        <span className="validation-guide-level">Test rule</span>
                      </div>
                      <section className="validation-guide-purpose">
                        <strong>What it checks</strong>
                        <p>{item.description}</p>
                      </section>
                      <div className="validation-guide-fields">
                        <strong>Fill these fields</strong>
                        <div>
                          {item.requiredFields.length > 0
                            ? item.requiredFields.map((field) => <span key={field}>{field}</span>)
                            : <span>None</span>}
                        </div>
                      </div>
                      <section className="validation-guide-example">
                        <strong>Simple example</strong>
                        <p>{item.exampleChallenge}</p>
                        <code>{item.exampleTestcase}</code>
                      </section>
                      <div className="validation-guide-result-grid">
                        <section className="validation-guide-result is-pass">
                          <strong>Passes when</strong>
                          <p>{item.passExample}</p>
                        </section>
                        <section className="validation-guide-result is-fail">
                          <strong>Fails when</strong>
                          <p>{item.failExample}</p>
                        </section>
                      </div>
                      <p className="validation-guide-tip">{item.difficultyRecommendations}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </div>
  );

  if (embedded) return content;

  return (
    <PageContainer className="challenge-create-page" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        {content}
      </ContentWrapper>
    </PageContainer>
  );
};

export default Challenges;
