import { buildActivityUserBandMap } from "./activityUserBands";

describe("buildActivityUserBandMap", () => {
  test("assigns stable band indexes per distinct user", () => {
    const map = buildActivityUserBandMap([
      { user: "Asha" },
      { user: "Ben" },
      { user: "Asha" },
      { user: "Cara" },
      { user: "Dev" },
      { user: "Eli" },
    ]);

    expect(map.get("Asha")).toBe(0);
    expect(map.get("Ben")).toBe(1);
    expect(map.get("Cara")).toBe(2);
    expect(map.get("Dev")).toBe(3);
    expect(map.get("Eli")).toBe(0);
  });

  test("handles empty and missing user values", () => {
    expect(buildActivityUserBandMap()).toEqual(new Map());
    expect(buildActivityUserBandMap([{ user: null }, {}]).get("")).toBe(0);
  });
});
