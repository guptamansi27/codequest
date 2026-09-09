import {
  normalizeValidationRule,
  normalizeValidationRules,
  summarizeEvaluation,
} from "./testRules";

describe("challenge validation rule helpers", () => {
  test("normalizes JSON-backed selector and expected output rules", () => {
    const rule = normalizeValidationRule(
      {
        id: 99,
        name: "Hero heading",
        input_data: JSON.stringify({ selector: ".hero-title", type: "hasText" }),
        expected_output: JSON.stringify({ expected: "CodeQuest", matchMode: "contains" }),
        is_case_sensitive: false,
      },
      0,
    );

    expect(rule).toMatchObject({
      id: 99,
      name: "Hero heading",
      type: "hasText",
      selector: ".hero-title",
      expected: "CodeQuest",
      matchMode: "contains",
      caseSensitive: false,
    });
  });

  test("falls back to readable defaults for plain backend test cases", () => {
    const rule = normalizeValidationRule(
      {
        input_data: "",
        expected_output: "Login button should be disabled",
      },
      1,
    );

    expect(rule.id).toBe(2);
    expect(rule.name).toBe("TC-2");
    expect(rule.type).toBe("hasText");
    expect(rule.expected).toBe("Login button should be disabled");
    expect(rule.matchMode).toBe("contains");
    expect(rule.timeout).toBe(3000);
  });

  test("does not treat readable names as validator types", () => {
    const rule = normalizeValidationRule(
      {
        name: "Render a button",
        input_data: JSON.stringify({ selector: "button" }),
        expected_output: "Button exists",
      },
      0,
    );

    expect(rule.type).toBe("elementExists");
    expect(rule.selector).toBe("button");
  });

  test("normalizes a list of validation rules", () => {
    expect(normalizeValidationRules([{ name: "One" }, { name: "Two" }])).toHaveLength(2);
  });

  test("summarizes accepted and failed evaluations", () => {
    expect(
      summarizeEvaluation([
        { name: "Navbar", passed: true },
        { name: "Login validation", passed: true },
      ]),
    ).toMatchObject({ status: "Accepted", passed: 2, total: 2, failed_tests: [] });

    expect(
      summarizeEvaluation([
        { name: "Navbar", passed: true },
        { name: "Login validation", passed: false, message: "Invalid email toast missing" },
      ]),
    ).toMatchObject({
      status: "Failed",
      passed: 1,
      total: 2,
      failed_tests: ["Invalid email toast missing"],
    });
  });
});
