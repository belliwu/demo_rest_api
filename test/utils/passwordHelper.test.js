import {
  hashPassword,
  comparePassword,
} from "../../src/utils/passwordHelper.js";

describe("Password Helper", () => {
  it("should hash a password", () => {
    const password = "myPassword123";
    const hashed = hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(hashed).toBeDefined();
  });

  it("should verify a password", () => {
    const password = "myPassword123";
    const hashed = hashPassword(password);
    const isValid = comparePassword(password, hashed);
    expect(isValid).toBe(true);
  });

  it("should not verify an incorrect password", () => {
    const password = "myPassword123";
    const wrongPassword = "wrongPassword";
    const hashed = hashPassword(password);
    const isValid = comparePassword(wrongPassword, hashed);
    expect(isValid).toBe(false);
  });
});
