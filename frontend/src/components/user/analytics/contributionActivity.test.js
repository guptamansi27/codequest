import {
  buildContributionActivity,
  getContributionLevel,
  toDateKey,
} from "./contributionActivity";

describe("contribution activity helpers", () => {
  test("normalizes dates to local date keys", () => {
    expect(toDateKey("2026-05-13T02:30:00.000Z")).toMatch(/^2026-05-13$/);
  });

  test("builds daily activity totals and XP from submissions", () => {
    const activity = buildContributionActivity(
      [
        { submitted_at: "2026-05-13T02:30:00.000Z", is_passed: true, challenge: 1 },
        { submitted_at: "2026-05-13T04:30:00.000Z", is_passed: false, challenge: 2 },
        { submitted_at: "", is_passed: true, challenge: 3 },
      ],
      [{ id: 1, xp_points: 100 }],
    );

    const day = activity.get("2026-05-13");
    expect(day).toMatchObject({ total: 2, accepted: 1, completed: 1, xp: 100 });
  });

  test("calculates contribution levels from activity score", () => {
    expect(getContributionLevel()).toBe(0);
    expect(getContributionLevel({ total: 1, accepted: 0, xp: 0 })).toBe(1);
    expect(getContributionLevel({ total: 1, accepted: 1, xp: 0 })).toBe(2);
    expect(getContributionLevel({ total: 4, accepted: 1, xp: 0 })).toBe(3);
    expect(getContributionLevel({ total: 6, accepted: 2, xp: 100 })).toBe(4);
  });
});
