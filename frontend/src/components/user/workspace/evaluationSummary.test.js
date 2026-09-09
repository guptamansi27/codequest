import { formatSubmissionSummary, formatTestRunSummary } from "./evaluationSummary";

describe("workspace evaluation summaries", () => {
  test("reports when no test cases are configured", () => {
    expect(formatTestRunSummary()).toBe("No test cases configured");
  });

  test("formats partial and complete test runs", () => {
    expect(formatTestRunSummary({ passed: 2, total: 5 })).toBe("2/5 Test Cases Passed");
    expect(formatTestRunSummary({ passed: 5, total: 5 })).toBe("All 5/5 Test Cases Passed");
  });

  test("adds XP details only for successful submissions with earned XP", () => {
    expect(formatSubmissionSummary({ submissionSuccess: true, passed: 3, total: 3, xpEarned: 50 })).toBe(
      "All 3/3 Test Cases Passed. You earned 50 XP.",
    );
    expect(formatSubmissionSummary({ submissionSuccess: false }, { passed: 1, total: 4 })).toBe("1/4 Test Cases Passed");
  });
});
