import { getClientErrorEvents, handleApplicationError } from "./safeLogger";

describe("safe logger", () => {
  test("stores sanitized client error events without raw objects", () => {
    const message = handleApplicationError(" Unable to process request ", {
      status: 500,
      retriable: false,
      raw: { token: "secret" },
    });

    expect(message).toBe("Unable to process request");
    expect(getClientErrorEvents()).toContainEqual(
      expect.objectContaining({
        message: "Unable to process request",
        metadata: { status: 500, retriable: false },
      }),
    );
  });

  test("uses a generic fallback for blank messages", () => {
    expect(handleApplicationError(" ")).toBe("Application request failed");
  });
});
