import { colors, cssVars } from "./colors";

describe("color tokens", () => {
  test("exports concrete color values used by the app", () => {
    expect(colors.primaryBlue).toBe("#2563eb");
    expect(colors.accentGreen).toBe("#27c93f");
    expect(colors.bgWhite).toBe("#ffffff");
  });

  test("exports CSS variable references matching token names", () => {
    expect(cssVars.primaryBlue).toBe("var(--primary-blue)");
    expect(cssVars.accentRed).toBe("var(--accent-red)");
    expect(Object.keys(cssVars)).toEqual(Object.keys(colors));
  });
});
