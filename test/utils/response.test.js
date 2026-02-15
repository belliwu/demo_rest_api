import { jest } from "@jest/globals";
import { sendSuccess, sendError } from "../../src/utils/response.js";

describe("響應幫助函數測試", () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("應該返回正確的成功響應", () => {
    const data = { user: { id: 1, name: "Test" } };
    const message = "操作成功";

    sendSuccess(mockRes, data, message);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message,
      data,
    });
  });

  it("應該返回正確的成功響應（無資料）", () => {
    sendSuccess(mockRes, null, "操作成功");

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "操作成功",
    });
  });

  it("應該返回正確的錯誤響應", () => {
    const message = "操作失敗";

    sendError(mockRes, message);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message,
    });
  });

  it("應該返回帶有錯誤陣列的錯誤響應", () => {
    const message = "驗證失敗";
    const errors = ["錯誤1", "錯誤2"];

    sendError(mockRes, message, 400, errors);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message,
      errors,
    });
  });

  it("應該使用自訂狀態碼", () => {
    sendSuccess(mockRes, { id: 1 }, "建立成功", 201);
    expect(mockRes.status).toHaveBeenCalledWith(201);

    sendError(mockRes, "未授權", 401);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});
