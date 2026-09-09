import { ALL_VALIDATION_TYPES } from "./validationRegistry";

const safeJsonParse = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const validationTypes = new Set(ALL_VALIDATION_TYPES);

export const normalizeValidationRule = (testCase, index = 0) => {
  const inputRule = safeJsonParse(testCase.input_data);
  const expectedRule = safeJsonParse(testCase.expected_output);
  const merged = {
    ...(typeof inputRule === "object" && inputRule ? inputRule : {}),
    ...(typeof expectedRule === "object" && expectedRule ? expectedRule : {}),
  };

  const requestedType =
    merged.type ||
    merged.validator ||
    merged.validation ||
    "";
  const type = validationTypes.has(requestedType)
    ? requestedType
    : merged.selector || merged.target
      ? "elementExists"
      : "hasText";

  return {
    id: testCase.id || index + 1,
    name: testCase.name || merged.name || `TC-${index + 1}`,
    type,
    selector: merged.selector || merged.target || merged.buttonSelector || merged.inputSelector || "",
    targetSelector: merged.targetSelector || merged.target_selector || merged.target || "",
    buttonSelector: merged.buttonSelector || merged.button_selector || "",
    inputSelector: merged.inputSelector || merged.input_selector || "",
    attribute: merged.attribute || merged.attributeName || merged.attribute_name || "",
    expectedCount: Number(merged.expectedCount ?? merged.expected_count ?? merged.count ?? 0),
    inputValue: merged.inputValue ?? merged.input_value ?? merged.value ?? "",
    expected:
      merged.expected ??
      merged.expectedAfterClick ??
      merged.expected_after_click ??
      merged.value ??
      (expectedRule ? undefined : testCase.expected_output),
    property: merged.property || merged.style || "",
    className: merged.className || merged.class || "",
    text: merged.text || "",
    matchMode: merged.matchMode || merged.match_mode || "contains",
    caseSensitive: merged.caseSensitive ?? merged.case_sensitive ?? testCase.is_case_sensitive ?? true,
    event: merged.event || "click",
    viewport: merged.viewport || merged.size || null,
    timeout: Number(merged.timeout || 3000),
    hidden: Boolean(merged.hidden || merged.visibility === "hidden"),
    message: merged.message || testCase.expected_output || testCase.name,
    raw: testCase,
  };
};

export const normalizeValidationRules = (testCases = []) =>
  testCases.map((testCase, index) => normalizeValidationRule(testCase, index));

export const summarizeEvaluation = (results = []) => {
  const passed = results.filter((result) => result.passed).length;
  const total = results.length;
  const failedTests = results
    .filter((result) => !result.passed)
    .map((result) => result.message || result.name);

  return {
    status: passed === total ? "Accepted" : "Failed",
    passed,
    total,
    failed_tests: failedTests,
    feedback: results,
  };
};
