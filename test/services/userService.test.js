import {
  createUserRecord,
  findUserByEmail,
  getUserById,
  validateUserPayload,
  sanitizeUserRecord,
  verifyPassword,
} from "../../src/services/userService.js";
import { db } from "../../src/config/database.js";

describe("User Service", () => {
  beforeEach(() => {
    // 清空資料表（注意順序：先子表後父表以避免外鍵約束）
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();
  });

  it("should create a user successfully", () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    const user = createUserRecord(userData);

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe(userData.username);
    expect(user.email).toBe(userData.email);
  });

  it("should find user by email", () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };
    createUserRecord(userData);

    const user = findUserByEmail(userData.email);

    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });

  it("should return null for non-existent email", () => {
    const user = findUserByEmail("nonexistent@example.com");
    expect(user).toBeNull();
  });

  it("should get user by id", () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };
    const createdUser = createUserRecord(userData);

    const user = getUserById(createdUser.id);

    expect(user).toBeDefined();
    expect(user.id).toBe(createdUser.id);
  });

  it("should validate user payload", () => {
    const validData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    const result = validateUserPayload(validData);

    expect(result.valid).toBe(true);
  });

  it("should sanitize user record removing password", () => {
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };
    const user = createUserRecord(userData);

    const sanitized = sanitizeUserRecord(user);

    expect(sanitized.password).toBeUndefined();
    expect(sanitized.username).toBe(user.username);
  });

  it("should verify password correctly", () => {
    const password = "password123";
    const userData = {
      username: "testuser",
      email: "test@example.com",
      password,
    };
    const user = createUserRecord(userData);

    const isValid = verifyPassword(password, user.password);
    expect(isValid).toBe(true);

    const isInvalid = verifyPassword("wrongpassword", user.password);
    expect(isInvalid).toBe(false);
  });
});
