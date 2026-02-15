import { jest } from "@jest/globals";
import { authenticate } from "../../src/middleware/auth.js";
import { generateToken } from "../../src/utils/jwtHelper.js";
import { createUserRecord } from "../../src/services/userService.js";
import { db } from "../../src/config/database.js";

describe("身份驗證中介軟體測試", () => {
  let testUser;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // 清空資料（注意順序：先子表後父表以避免外鍵約束）
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();

    // 建立測試用戶
    testUser = createUserRecord({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    // Mock request/response
    mockReq = {
      header: jest.fn(),
      method: "GET",
      originalUrl: "/test",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("應該使用有效 token 驗證成功", () => {
    const token = generateToken({
      userId: testUser.id,
      email: testUser.email,
    });

    mockReq.header.mockReturnValue(`Bearer ${token}`);

    authenticate(mockReq, mockRes, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user.id).toBe(testUser.id);
    expect(mockNext).toHaveBeenCalled();
  });

  it("應該拒絕沒有 token 的請求", () => {
    mockReq.header.mockReturnValue(null);

    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining("token"),
      }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("應該拒絕無效的 token 格式", () => {
    mockReq.header.mockReturnValue("InvalidToken");

    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("應該拒絕無效的 token", () => {
    mockReq.header.mockReturnValue("Bearer invalid.token.here");

    authenticate(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
