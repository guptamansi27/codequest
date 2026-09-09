import { formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  const fixedNow = new Date("2026-05-13T12:00:00.000Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(fixedNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns an empty string for missing values", () => {
    expect(formatRelativeTime()).toBe("");
  });

  test("formats very recent timestamps as just now", () => {
    expect(formatRelativeTime("2026-05-13T11:59:45.000Z")).toBe("Just now");
  });

  test("formats timestamps in minutes, hours, and days", () => {
    expect(formatRelativeTime("2026-05-13T11:45:00.000Z")).toBe("15 mins ago");
    expect(formatRelativeTime("2026-05-13T09:00:00.000Z")).toBe("3 hours ago");
    expect(formatRelativeTime("2026-05-10T12:00:00.000Z")).toBe("3 days ago");
  });
});
