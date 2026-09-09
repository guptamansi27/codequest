import { createSecureId } from "./secureRandom";

describe("secure random utilities", () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: originalCrypto,
    });
  });

  test("uses randomUUID when available", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { randomUUID: jest.fn(() => "00000000-0000-4000-8000-000000000000") },
    });

    expect(createSecureId("draft")).toBe("draft-00000000-0000-4000-8000-000000000000");
  });

  test("falls back to getRandomValues", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues: jest.fn((bytes) => {
          bytes.fill(10);
          return bytes;
        }),
      },
    });

    expect(createSecureId("draft")).toBe("draft-0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a");
  });
});
