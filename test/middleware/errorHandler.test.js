import { jest } from "@jest/globals";
import {
  errorHandler,
  notFoundHandler,
} from "../../src/middleware/errorHandler.js";

describe("errorHandler middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: "GET",
      originalUrl: "/api/test",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("errorHandler", () => {
    test("should handle error with default status code", () => {
      const error = new Error("Test error");

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Test error",
        }),
      );
    });

    test("should handle error with custom status code", () => {
      const error = new Error("Not found");
      error.statusCode = 404;

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("notFoundHandler", () => {
    test("should return 404 response", () => {
      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("找不到路由"),
        }),
      );
    });
  });
});
