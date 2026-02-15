import { generateToken, verifyToken } from "../../src/utils/jwtHelper.js";

describe("JWT Helper", () => {
  it("should generate a valid token", () => {
    const token = generateToken({ userId: 1, email: "test@example.com" });
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  it("should verify a valid token", () => {
    const payload = { userId: 1, email: "test@example.com" };
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it("should return null for an invalid token", () => {
    const result = verifyToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("should throw error when userId is missing", () => {
    expect(() => {
      generateToken({ email: "test@example.com" });
    }).toThrow("Token payload must include userId and email");
  });

  it("should throw error when email is missing", () => {
    expect(() => {
      generateToken({ userId: 1 });
    }).toThrow("Token payload must include userId and email");
  });
});
