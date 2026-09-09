import {
  getValidationBadge,
  getValidationTypesForStack,
  isValidationAllowedForStack,
} from "./validationRegistry";

describe("validation registry", () => {
  test("filters HTML challenges to structure validations", () => {
    expect(getValidationTypesForStack("HTML")).toEqual([
      "elementExists",
      "hasText",
      "hasAttribute",
      "textContentEquals",
      "isVisible",
    ]);
    expect(isValidationAllowedForStack("styleMatches", "HTML")).toBe(false);
    expect(isValidationAllowedForStack("buttonClickUpdatesText", "HTML")).toBe(false);
  });

  test("separates vanilla JavaScript and React validations", () => {
    expect(getValidationTypesForStack("JS")).toContain("domUpdatesAfterClick");
    expect(getValidationTypesForStack("JS")).not.toContain("buttonClickUpdatesText");
    expect(getValidationTypesForStack("REACT")).toContain("buttonClickUpdatesText");
    expect(getValidationTypesForStack("REACT")).not.toContain("handlesEvent");
    expect(getValidationBadge("REACT")).toBe("React Validation");
  });
});
