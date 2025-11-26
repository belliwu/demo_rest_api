import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

/**
 * JWT 工具函數
 * -------------------------------------------------
 * 封裝 JWT token 的產生與驗證邏輯
 * 
 * 使用 jsonwebtoken 套件
 */

// JWT 密鑰（實務上應存放在環境變數中）
const JWT_SECRET = process.env.JWT_SECRET;

// Token 有效期限
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

/**
 * 產生 JWT token
 * -------------------------------------------------
 * @param {Object} payload - 要編碼進 token 的資料（通常是 userId）
 * @returns {string} JWT token
 * 
 * 說明：
 * - payload 通常只包含最小必要資訊（如 userId）
 * - 避免在 token 中存放敏感資料（如密碼）
 * - token 本身不加密，只是簽名，任何人都可解碼查看內容
 */
export const generateToken = ({ userId, email }) => {
  if (!userId || !email) {
    throw new Error("Token payload must include userId and email");
  }

  const tokenPayload = { userId, email };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * 產生 JWT token 並回傳統一的成功回應
 * -------------------------------------------------
 * @param {import("express").Response} res - Express response 物件
 * @param {Object} payload - 至少包含 userId、email 的使用者資料
 * @param {number} statusCode - 回應狀態碼（預設 200）
 * @param {string} message - 客製訊息（預設 "Success"）
 * @returns {Object} Express 回應
 */
export const sendTokenResponse = (res, payload, statusCode = 200, message = "Success") => {
  const token = generateToken(payload);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      userId: payload.userId,
      email: payload.email,
    },
  });
};

/**
 * 驗證 JWT token
 * -------------------------------------------------
 * @param {string} token - JWT token
 * @returns {Object|null} 解碼後的 payload，驗證失敗回傳 null
 * 
 * 說明：
 * - 驗證 token 簽名是否正確
 * - 檢查 token 是否過期
 * - 成功則回傳原始 payload（包含 userId 等資訊）
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Token 無效或過期
    return null;
  }
};

/**
 * 產生安全的 JWT_SECRET
 * -------------------------------------------------
 * @param {number} byteLength - 隨機位元組數（預設 64 bytes ≈ 128 hex chars）
 * @returns {string} 建議用於 .env 的 hex 字串
 */
export const generateJwtSecret = (byteLength = 64) => randomBytes(byteLength).toString("hex");
