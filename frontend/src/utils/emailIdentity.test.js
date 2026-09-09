import {
  displayLocalId,
  displayLocalPart,
  emailLocalPart,
  getSessionEmail,
} from "./emailIdentity";

describe("email identity helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("extracts the local part from a valid email address", () => {
    expect(emailLocalPart("usera2@tcs.com")).toBe("usera2");
  });

  test("trims and returns the original value when no email separator exists", () => {
    expect(emailLocalPart("  sme  ")).toBe("sme");
  });

  test("returns an empty string for missing or non-string values", () => {
    expect(emailLocalPart()).toBe("");
    expect(emailLocalPart(null)).toBe("");
    expect(emailLocalPart(42)).toBe("");
  });

  test("formats a local id for display", () => {
    expect(displayLocalId("sme")).toBe("Sme");
    expect(displayLocalPart("admin@tcs.com")).toBe("Admin");
  });

  test("reads the session email from local storage", () => {
    localStorage.setItem("email", "usera2@tcs.com");
    expect(getSessionEmail()).toBe("usera2@tcs.com");
  });
});
