import { validateLoginPassword, validateTcsEmail } from "./loginValidation";

describe("login validation", () => {
  test("validates company email addresses without permissive regex", () => {
    expect(validateTcsEmail("learner@tcs.com")).toBe(true);
    expect(validateTcsEmail("learner.one+qa@tcs.com")).toBe(true);
    expect(validateTcsEmail("learner@example.com")).toBe(false);
    expect(validateTcsEmail("learner@tcs.com@evil.com")).toBe(false);
  });

  test("validates login password policy", () => {
    expect(validateLoginPassword("Strong1!")).toBe(true);
    expect(validateLoginPassword("weak")).toBe(false);
    expect(validateLoginPassword("StrongPassword1!TooLong")).toBe(false);
    expect(validateLoginPassword("Strong1^")).toBe(false);
  });
});
