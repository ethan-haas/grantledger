import { describe, it, expect, vi, beforeEach } from "vitest";

// Valid 64-hex-char key (32 bytes)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const mockGetServerEnv = vi.fn();

vi.mock("@/lib/env", () => ({
  getServerEnv: () => mockGetServerEnv(),
}));

describe("encryptToken / decryptToken", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetServerEnv.mockReturnValue({ TOKEN_ENCRYPTION_KEY: TEST_KEY });
  });

  async function loadModule() {
    return import("./tokens");
  }

  it("round-trips plaintext correctly", async () => {
    const { encryptToken, decryptToken } = await loadModule();
    const plaintext = "my-secret-refresh-token-12345";
    const ciphertext = encryptToken(plaintext);
    expect(decryptToken(ciphertext)).toBe(plaintext);
  });

  it("produces different ciphertexts for the same input (random IV)", async () => {
    const { encryptToken } = await loadModule();
    const a = encryptToken("same-input");
    const b = encryptToken("same-input");
    expect(a).not.toBe(b);
  });

  it("throws on malformed ciphertext (wrong number of parts)", async () => {
    const { decryptToken } = await loadModule();
    expect(() => decryptToken("not:valid")).toThrow("Invalid ciphertext format");
  });

  it("throws when auth tag is tampered", async () => {
    const { encryptToken, decryptToken } = await loadModule();
    const ciphertext = encryptToken("tamper-test");
    const parts = ciphertext.split(":");
    // Flip a character in the auth tag
    const tampered = parts[1].startsWith("a")
      ? "b" + parts[1].slice(1)
      : "a" + parts[1].slice(1);
    const broken = `${parts[0]}:${tampered}:${parts[2]}`;
    expect(() => decryptToken(broken)).toThrow();
  });

  it("throws when getServerEnv throws for missing key", async () => {
    mockGetServerEnv.mockImplementation(() => {
      throw new Error("Missing or invalid environment variables:\n  TOKEN_ENCRYPTION_KEY: required");
    });
    const { encryptToken } = await loadModule();
    expect(() => encryptToken("test")).toThrow("TOKEN_ENCRYPTION_KEY");
  });

  it("throws when key is wrong length", async () => {
    mockGetServerEnv.mockImplementation(() => {
      throw new Error("Missing or invalid environment variables:\n  TOKEN_ENCRYPTION_KEY: must be exactly 64 hex characters");
    });
    const { encryptToken } = await loadModule();
    expect(() => encryptToken("test")).toThrow("64 hex characters");
  });

  it("decryptToken throws on single-part string (no colons)", async () => {
    const { decryptToken } = await loadModule();
    expect(() => decryptToken("abcdef")).toThrow("Invalid ciphertext format");
  });

  it("decryptToken throws on four-part string (too many colons)", async () => {
    const { decryptToken } = await loadModule();
    expect(() => decryptToken("a:b:c:d")).toThrow("Invalid ciphertext format");
  });

  it("decryptToken throws on empty string", async () => {
    const { decryptToken } = await loadModule();
    expect(() => decryptToken("")).toThrow("Invalid ciphertext format");
  });

  it("decryptToken throws when encrypted body is tampered", async () => {
    const { encryptToken, decryptToken } = await loadModule();
    const ciphertext = encryptToken("tamper-body-test");
    const parts = ciphertext.split(":");
    // Flip a character in the ciphertext body (3rd part)
    const tamperedBody = parts[2].startsWith("a")
      ? "b" + parts[2].slice(1)
      : "a" + parts[2].slice(1);
    const broken = `${parts[0]}:${parts[1]}:${tamperedBody}`;
    expect(() => decryptToken(broken)).toThrow();
  });
});
