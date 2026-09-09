import {
  combineLocalDateTime,
  compareLocalDateTime,
  formatScheduleDisplay,
  getScheduleErrors,
  isEnded,
  isStarted,
  splitLocalDateTime,
  toDatetimeLocal,
  toUtcIsoString,
} from "./challengeSchedule";

describe("challenge schedule helpers", () => {
  test("converts valid dates and rejects invalid dates", () => {
    expect(toDatetimeLocal("2026-05-13T10:30:00.000Z")).toMatch(/^2026-05-13T/);
    expect(toDatetimeLocal("bad-date")).toBe("");
    expect(toUtcIsoString("2026-05-13T10:30:00.000Z")).toBe("2026-05-13T10:30:00.000Z");
    expect(toUtcIsoString("bad-date")).toBe("");
  });

  test("formats schedule values for display", () => {
    expect(formatScheduleDisplay("2026-05-13T10:30:00.000Z")).toEqual(expect.stringContaining("2026"));
    expect(formatScheduleDisplay("bad-date")).toBe("");
  });

  test("compares, splits, and combines local datetime values", () => {
    expect(compareLocalDateTime("2026-05-13T10:00", "2026-05-13T09:00")).toBeGreaterThan(0);
    expect(compareLocalDateTime("", "2026-05-13T09:00")).toBeNull();
    expect(splitLocalDateTime("2026-05-13T00:05")).toEqual({
      date: "2026-05-13",
      hour: "12",
      minute: "05",
      meridiem: "AM",
    });
    expect(splitLocalDateTime("2026-05-13T14:30")).toEqual({
      date: "2026-05-13",
      hour: "02",
      minute: "30",
      meridiem: "PM",
    });
    expect(combineLocalDateTime({ date: "2026-05-13", hour: "2", minute: "30", meridiem: "PM" })).toBe(
      "2026-05-13T14:30",
    );
    expect(combineLocalDateTime({ date: "2026-05-13", hour: "13", minute: "30", meridiem: "PM" })).toBe("");
  });

  test("validates required, past, and ordered schedule values", () => {
    const now = "2026-05-13T10:00";

    expect(getScheduleErrors({ start: "", end: "", now })).toEqual({
      start: "Please select challenge start date.",
      end: "Please select challenge end date.",
    });
    expect(getScheduleErrors({ start: "2026-05-13T09:00", end: "2026-05-13T11:00", now })).toMatchObject({
      start: "Start time must be greater than current time.",
    });
    expect(getScheduleErrors({ start: "2026-05-13T11:00", end: "2026-05-13T10:30", now })).toMatchObject({
      end: "End time must be after start time.",
    });
    expect(getScheduleErrors({ start: "2026-05-14T11:00", end: "2026-05-13T12:00", now })).toMatchObject({
      end: "End date cannot be before start date.",
    });
  });

  test("detects started and ended schedules", () => {
    const now = "2026-05-13T10:00";

    expect(isStarted("2026-05-13T09:59", now)).toBe(true);
    expect(isStarted("2026-05-13T10:01", now)).toBe(false);
    expect(isEnded("2026-05-13T09:59", now)).toBe(true);
    expect(isEnded("2026-05-13T10:01", now)).toBe(false);
  });
});
