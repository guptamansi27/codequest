import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Download, Eye, FileText, Plus, Power, Save, Upload, X } from "lucide-react";
import api from "../../api/axiosInstance";
import { SkeletonBlock } from "../ui/PremiumSkeleton";
import ChallengeScheduleFields from "./ChallengeScheduleFields";
import {
  getScheduleErrors,
  isEnded,
  isStarted,
  nowDatetimeLocal,
  toDatetimeLocal,
  toUtcIsoString,
} from "../../utils/challengeSchedule";
import { notify } from "../../utils/notifications";
import { fetchBatchHierarchy, flattenBatchHierarchy } from "../../services/batchService";
import {
  getDefaultValidationType,
  getValidationBadge,
  getValidationDefinition,
  getValidationTypesForStack,
  isValidationAllowedForStack,
} from "../../challenge_engine/validationRegistry";
import "../../styles/admin/ChallengeModal.css";

const difficulties = ["EASY", "MEDIUM", "HARD"];
const challengeTypes = ["CHALLENGE", "ASSESSMENT", "CODE_OF_DAY"];
const stacks = [
  { key: "HTML", label: "HTML" },
  { key: "CSS", label: "HTML + CSS" },
  { key: "JS", label: "HTML + CSS + JavaScript" },
  { key: "REACT", label: "React" },
];
const normalizeSuperBatch = (batch) => String(batch || "").replace(/^Super\s+Batch\s+/i, "").trim();

const formatFileSize = (size = 0) => {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const openLocalFile = (file) => {
  if (!file) return;
  const url = window.URL.createObjectURL(file);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
};

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
    expected: parsed.expected || "",
    message: parsed.message || tc.expected_output || "",
  };
};

const sanitizeTestCaseForStack = (testCase, stack) => {
  const fallbackType = getDefaultValidationType(stack);
  const type = isValidationAllowedForStack(testCase.type, stack) ? testCase.type : fallbackType;
  return { ...testCase, type };
};

const ChallengeEditModal = ({ id, onClose, refresh, triggerStyle }) => {
  const [challenge, setChallenge] = useState(null);
  const [originalStartTime, setOriginalStartTime] = useState("");
  const [originalEndTime, setOriginalEndTime] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(nowDatetimeLocal);
  const [modules, setModules] = useState([]);
  const [batchHierarchy, setBatchHierarchy] = useState([]);
  const [saving, setSaving] = useState(false);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [employeeInput, setEmployeeInput] = useState("");
  const isSME = (localStorage.getItem("role") || "").toUpperCase() === "SME";
  const smeProgram = localStorage.getItem("program_type") || "IGNITE";

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.classList.add("challenge-modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("challenge-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentDateTime(nowDatetimeLocal()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([api.get(`/challenges/${id}/`), api.get("/modules/"), fetchBatchHierarchy()])
      .then(([res, moduleRes, hierarchy]) => {
        const startTime = toDatetimeLocal(res.data.start_time);
        const endTime = toDatetimeLocal(res.data.end_time);
        setModules(moduleRes.data);
        setBatchHierarchy(hierarchy);
        setOriginalStartTime(startTime);
        setOriginalEndTime(endTime);
        setChallenge({
          ...res.data,
          assignment_mode: isSME ? smeProgram : res.data.assignment_mode,
          target_super_batches: (res.data.target_super_batches || []).map(normalizeSuperBatch),
          employee_ids: (res.data.employee_assignments || []).map((item) => item.employee_id),
          test_cases: (res.data.test_cases || []).map(parseTestCase),
          start_time: startTime,
          end_time: endTime,
        });
      })
      .catch((error) => {
        notify.apiError(error, "Challenge editor could not be loaded.");
        onClose();
      });
  }, [id, onClose, isSME, smeProgram]);

  const update = (field, value) => {
    setChallenge((prev) => ({ ...prev, [field]: value }));
  };

  const getStackKeyForModule = (moduleId = challenge?.module) =>
    modules.find((item) => Number(item.id) === Number(moduleId))?.name || "HTML";

  const updateTechnologyModule = (moduleId) => {
    const nextModule = Number(moduleId);
    const nextStack = getStackKeyForModule(nextModule);
    setChallenge((prev) => ({
      ...prev,
      module: nextModule,
      test_cases: (prev.test_cases || []).map((testCase) => sanitizeTestCaseForStack(testCase, nextStack)),
    }));
  };

  const startLocked = isStarted(originalStartTime, currentDateTime);
  const endLocked = isEnded(originalEndTime, currentDateTime);
  const scheduleErrors = challenge
    ? getScheduleErrors({
        start: challenge.start_time,
        end: challenge.end_time,
        mode: "edit",
        originalStart: originalStartTime,
        originalEnd: originalEndTime,
        now: currentDateTime,
      })
    : {};

  const updateTestCase = (index, field, value) => {
    setChallenge((prev) => ({
      ...prev,
      test_cases: prev.test_cases.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, [field]: value } : testCase
      ),
    }));
  };

  const addTestCase = () => {
    setChallenge((prev) => ({
      ...prev,
      test_cases: [...prev.test_cases, {
        type: getDefaultValidationType(getStackKeyForModule(prev.module)),
        selector: "",
        targetSelector: "",
        buttonSelector: "",
        inputSelector: "",
        attribute: "",
        property: "",
        expected: "",
        message: "",
      }],
    }));
  };

  const removeTestCase = (index) => {
    setChallenge((prev) => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/challenges/assignments/template/", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "non-ignite-assignment-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notify.apiError(error, "Assignment template could not be downloaded.");
    }
  };

  const uploadAssignmentFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      notify.validation("Only .xlsx files are supported.");
      return;
    }
    setAssignmentFile(file);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post(`/challenges/${id}/assignments/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSummary(response.data);
      notify.success("Excel assignments uploaded successfully.");
      refresh();
    } catch (err) {
      notify.apiError(err, "Excel assignments could not be uploaded.");
    }
  };

  const removeAssignmentFile = () => {
    setAssignmentFile(null);
    setUploadSummary(null);
  };

  const addEmployeeIds = (rawValue = employeeInput) => {
    const ids = rawValue.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
    if (!ids.length) return;
    setChallenge((prev) => ({
      ...prev,
      employee_ids: Array.from(new Set([...(prev.employee_ids || []), ...ids])),
    }));
    setEmployeeInput("");
  };

  const removeEmployeeId = (employeeId) => {
    setChallenge((prev) => ({
      ...prev,
      employee_ids: (prev.employee_ids || []).filter((item) => item !== employeeId),
    }));
  };

  const currentEmployeeIds = () => {
    const typedIds = employeeInput.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
    return Array.from(new Set([...(challenge.employee_ids || []), ...typedIds]));
  };

  const toggleTarget = (field, value) => {
    setChallenge((prev) => {
      const current = prev[field] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      const patch = { [field]: next };

      if (field === "target_super_batches") {
        const allowedBatches = new Set(flattenBatchHierarchy(batchHierarchy, next, []).batches);
        const nextBatches = (prev.target_batches || []).filter((batch) => allowedBatches.has(batch));
        const allowedSubBatches = new Set(flattenBatchHierarchy(batchHierarchy, next, nextBatches).subBatches);
        patch.target_batches = nextBatches;
        patch.target_sub_batches = (prev.target_sub_batches || []).filter((subBatch) =>
          allowedSubBatches.has(subBatch)
        );
      }

      if (field === "target_batches") {
        const allowedSubBatches = new Set(flattenBatchHierarchy(batchHierarchy, prev.target_super_batches || [], next).subBatches);
        patch.target_sub_batches = (prev.target_sub_batches || []).filter((subBatch) =>
          allowedSubBatches.has(subBatch)
        );
      }

      return { ...prev, ...patch };
    });
  };

  const batchOptions = challenge
    ? flattenBatchHierarchy(batchHierarchy, challenge.target_super_batches || [], challenge.target_batches || [])
    : { superBatches: [], batches: [], subBatches: [] };

  const save = async () => {
    const freshNow = nowDatetimeLocal();
    const latestScheduleErrors = getScheduleErrors({
      start: challenge.start_time,
      end: challenge.end_time,
      mode: "edit",
      originalStart: originalStartTime,
      originalEnd: originalEndTime,
      now: freshNow,
    });
    setCurrentDateTime(freshNow);
    if (latestScheduleErrors.start || latestScheduleErrors.end) return;

    try {
      setSaving(true);
      await api.patch(`/challenges/${id}/`, {
        title: challenge.title,
        description: challenge.description,
        difficulty: challenge.difficulty,
        challenge_type: challenge.challenge_type,
        module: challenge.module,
        xp_points: Number(challenge.xp_points),
        is_active: Boolean(challenge.is_active),
        chatbot_enabled: Boolean(challenge.chatbot_enabled || challenge.is_chatbot_enabled),
        is_chatbot_enabled: Boolean(challenge.chatbot_enabled || challenge.is_chatbot_enabled),
        assignment_mode: challenge.assignment_mode,
        target_super_batches: challenge.target_super_batches || [],
        target_batches: challenge.target_batches || [],
        target_sub_batches: challenge.target_sub_batches || [],
        employee_ids: challenge.assignment_mode === "NON_IGNITE" ? currentEmployeeIds() : [],
        start_time: toUtcIsoString(challenge.start_time),
        end_time: toUtcIsoString(challenge.end_time),
        test_cases: (challenge.test_cases || []).map((tc, index) => {
          const sanitized = sanitizeTestCaseForStack(tc, getStackKeyForModule());
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
              expected: tc.expected || "",
              message: tc.message || tc.expected || tc.selector || `Test Case ${index + 1}`,
            }),
            expected_output: tc.message || tc.expected || `${sanitized.type} ${tc.selector || ""}`,
            is_case_sensitive: true,
          };
        }),
      });

      notify.success("Challenge updated successfully.");
      refresh();
      onClose();
    } catch (err) {
      notify.apiError(err, "Challenge could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  if (!challenge) {
    const loadingModal = (
      <div className="modal-overlay challenge-modal-overlay" style={triggerStyle}>
        <div className="modal challenge-edit-modal">
          <header className="modal-header">
            <div>
              <SkeletonBlock className="cq-skel-line cq-skel-line--sm" />
              <SkeletonBlock className="cq-skel-title" />
            </div>
            <SkeletonBlock className="cq-skel-icon" rounded="full" />
          </header>
          <div className="edit-form">
            <SkeletonBlock className="cq-skel-input" />
            <SkeletonBlock className="cq-skel-input" />
            <div className="modal-grid three">
              <SkeletonBlock className="cq-skel-input" />
              <SkeletonBlock className="cq-skel-input" />
              <SkeletonBlock className="cq-skel-input" />
            </div>
            <SkeletonBlock className="cq-skel-card" style={{ height: 180 }} />
            <SkeletonBlock className="cq-skel-card" style={{ height: 220 }} />
          </div>
        </div>
      </div>
    );

    return typeof document !== "undefined" ? createPortal(loadingModal, document.body) : loadingModal;
  }

  const modal = (
    <div
      className="modal-overlay challenge-modal-overlay"
      style={triggerStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal challenge-edit-modal">
        <header className="modal-header">
          <div>
            <span className="modal-kicker">Edit Challenge</span>
            <h2>{challenge.title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="edit-form">
          <label>
            <span>Title</span>
            <input
              value={challenge.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              rows={5}
              value={challenge.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>

          <div className="modal-grid three">
            <label>
              <span>Difficulty</span>
              <select
                value={challenge.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select
                value={challenge.challenge_type}
                onChange={(e) => update("challenge_type", e.target.value)}
              >
                {challengeTypes.map((type) => (
                  <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>

            <label>
              <span>XP Points</span>
              <input
                type="number"
                min="1"
                value={challenge.xp_points}
                onChange={(e) => update("xp_points", e.target.value)}
              />
            </label>

            <label>
              <span>Technology</span>
              <select
                value={challenge.module}
                onChange={(e) => updateTechnologyModule(e.target.value)}
              >
                {stacks.map((stack) => {
                  const module = modules.find((item) => item.name === stack.key);
                  return module ? <option key={stack.key} value={module.id}>{stack.label}</option> : null;
                })}
              </select>
            </label>
          </div>

          <ChallengeScheduleFields
            start={challenge.start_time}
            end={challenge.end_time}
            onStartChange={(value) => update("start_time", value)}
            onEndChange={(value) => update("end_time", value)}
            errors={scheduleErrors}
            startLocked={startLocked}
            endLocked={endLocked}
            startHelper="Future challenges can be rescheduled, but never into the past."
            endHelper="End time must stay in the future and after start."
          />

          

          <div className="modal-section access-section">
            <div className="access-section-header">
              <h4>Assignment Access</h4>
              <span>Choose who can see this challenge</span>
            </div>

            {!isSME && <div className="access-group">
              <span className="access-label">Assignment Mode</span>
              <div className="modal-badges access-badges">
                {["IGNITE", "NON_IGNITE"].map((mode) => (
                  <label key={mode} className={challenge.assignment_mode === mode ? "selected" : ""}>
                    <input type="radio" checked={challenge.assignment_mode === mode} onChange={() => update("assignment_mode", mode)} />
                    <span>{mode.replace("_", "-")}</span>
                  </label>
                ))}
              </div>
            </div>}

            {challenge.assignment_mode === "IGNITE" && <div className="access-group">
              <span className="access-label">Super Batch</span>
              <div className="modal-badges access-badges numeric-badges">
              {batchOptions.superBatches.map((superBatch) => (
                <label
                  key={superBatch}
                  className={(challenge.target_super_batches || []).includes(superBatch) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={(challenge.target_super_batches || []).includes(superBatch)}
                    onChange={() => toggleTarget("target_super_batches", superBatch)}
                  />
                  <span>{superBatch}</span>
                </label>
              ))}
              </div>
            </div>}

            {challenge.assignment_mode === "IGNITE" && <div className="access-group">
              <span className="access-label">Batch</span>
              <div className="modal-badges access-badges">
              {batchOptions.batches.map((batch) => (
                <label
                  key={batch}
                  className={(challenge.target_batches || []).includes(batch) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={(challenge.target_batches || []).includes(batch)}
                    onChange={() => toggleTarget("target_batches", batch)}
                  />
                  <span>{batch}</span>
                </label>
              ))}
              </div>
            </div>}

            {challenge.assignment_mode === "IGNITE" && <div className="access-group">
              <span className="access-label">Sub Batch</span>
              <div className="modal-badges access-badges">
              {batchOptions.subBatches.map((subBatch) => (
                <label
                  key={subBatch}
                  className={(challenge.target_sub_batches || []).includes(subBatch) ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={(challenge.target_sub_batches || []).includes(subBatch)}
                    onChange={() => toggleTarget("target_sub_batches", subBatch)}
                  />
                  <span>{subBatch}</span>
                </label>
              ))}
              </div>
            </div>}

            {challenge.assignment_mode === "NON_IGNITE" && (
              <div className="access-group">
                <span className="access-label">Employee IDs</span>
                <label className="modal-manual-employee-field">
                  <textarea
                    rows={3}
                    placeholder="EMP001, EMP002, EMP003"
                    value={employeeInput}
                    onChange={(event) => setEmployeeInput(event.target.value)}
                    onBlur={() => addEmployeeIds()}
                  />
                </label>
                <div className="excel-assignment-actions">
                  <button type="button" className="secondary-button" onClick={() => addEmployeeIds()}>
                    <Plus size={14} /> Add Employee IDs
                  </button>
                </div>
                <div className="modal-employee-tags">
                  {(challenge.employee_ids || []).map((employeeId) => (
                    <span key={employeeId}>
                      {employeeId}
                      <button type="button" onClick={() => removeEmployeeId(employeeId)} aria-label={`Remove ${employeeId}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <span className="access-label">Excel assignment</span>
                <div className="excel-upload-panel modal-excel-upload-panel">
                  <div className="excel-upload-copy">
                    <strong>Upload employee mapping</strong>
                    <span>Use an .xlsx workbook with one employee_id column.</span>
                  </div>
                  <div className="excel-assignment-actions">
                    <button type="button" className="secondary-button" onClick={downloadTemplate}>
                      <Download size={14} /> Download Template
                    </button>
                    <label className="secondary-button excel-upload-button">
                      <Upload size={14} /> Choose Excel File
                      <input
                        type="file"
                        accept=".xlsx"
                        onChange={(event) => uploadAssignmentFile(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
                <div className={assignmentFile ? "excel-assignment-summary has-file" : "excel-assignment-summary"}>
                  {assignmentFile ? (
                    <div className="uploaded-file-row">
                      <button
                        type="button"
                        className="uploaded-file-button"
                        onClick={() => openLocalFile(assignmentFile)}
                        title="Open uploaded Excel file"
                      >
                        <span className="uploaded-file-icon"><FileText size={18} /></span>
                        <span className="uploaded-file-text">
                          <strong>{assignmentFile.name}</strong>
                          <small>{formatFileSize(assignmentFile.size)} selected. Click to view.</small>
                        </span>
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className="uploaded-file-remove"
                        onClick={removeAssignmentFile}
                        aria-label={`Remove ${assignmentFile.name}`}
                        title="Remove uploaded Excel file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong>{challenge.employee_ids?.length || 0} employees currently mapped</strong>
                      <span>Upload an Excel workbook or manage employee IDs manually.</span>
                    </>
                  )}
                  {uploadSummary && (
                    <span>
                      {uploadSummary.successful_mappings} valid mappings, {uploadSummary.duplicates.length} duplicates, {uploadSummary.missing_users.length} missing users
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-section access-section">
            <div className="access-section-header">
              <h4>Editable Test Cases</h4>
              <button type="button" className="secondary-button" onClick={addTestCase}><Plus size={14} /> Add</button>
            </div>
            {(challenge.test_cases || []).map((testCase, index) => (
              <div className="edit-test-case" key={index}>
                <div className="test-case-card-header">
                  <strong>Test Case {index + 1}</strong>
                  <button type="button" className="remove-test-button" onClick={() => removeTestCase(index)}>Remove</button>
                </div>
                <div className="modal-grid two">
                  <label>
                    <span>Validation Type</span>
                    <span className="validation-tech-badge">{getValidationBadge(getStackKeyForModule())}</span>
                    <select value={sanitizeTestCaseForStack(testCase, getStackKeyForModule()).type} onChange={(e) => updateTestCase(index, "type", e.target.value)}>
                      {getValidationTypesForStack(getStackKeyForModule()).map((type) => {
                        const definition = getValidationDefinition(type);
                        return <option key={type} value={type}>{definition.label}</option>;
                      })}
                    </select>
                    <small className="validation-helper-text">
                      {getValidationDefinition(sanitizeTestCaseForStack(testCase, getStackKeyForModule()).type).description}
                    </small>
                  </label>
                  <label>
                    <span>Selector</span>
                    <input value={testCase.selector} onChange={(e) => updateTestCase(index, "selector", e.target.value)} />
                  </label>
                  <label>
                    <span>Target Selector</span>
                    <input value={testCase.targetSelector || ""} onChange={(e) => updateTestCase(index, "targetSelector", e.target.value)} />
                  </label>
                  <label>
                    <span>Attribute</span>
                    <input value={testCase.attribute || ""} onChange={(e) => updateTestCase(index, "attribute", e.target.value)} />
                  </label>
                  <label>
                    <span>Property</span>
                    <input value={testCase.property} onChange={(e) => updateTestCase(index, "property", e.target.value)} />
                  </label>
                  <label>
                    <span>Expected</span>
                    <input value={testCase.expected} onChange={(e) => updateTestCase(index, "expected", e.target.value)} />
                  </label>
                  <label>
                    <span>Result Message</span>
                    <input value={testCase.message} onChange={(e) => updateTestCase(index, "message", e.target.value)} />
                  </label>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={save} disabled={saving || Boolean(scheduleErrors.start || scheduleErrors.end)}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
};

export default ChallengeEditModal;
