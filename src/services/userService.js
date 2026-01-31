import { db } from "../config/database.js";
import { validateUserData, sanitizeUser } from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/passwordHelper.js";

/**
 * 將資料庫欄位映射為應用層物件
 * @param {Object} row - 資料庫查詢結果
 * @returns {Object|null} 用戶物件
 */
const mapUserRow = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * 驗證用戶資料
 * @param {Object} payload - 用戶資料
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateUserPayload = (payload) => {
  return validateUserData(payload);
};

/**
 * 清理用戶敏感資訊
 * @param {Object} user - 用戶物件
 * @returns {Object} 不包含密碼的用戶物件
 */
export const sanitizeUserRecord = (user) => {
  return sanitizeUser(user);
};

/**
 * 建立新用戶
 * @param {Object} userData - { username, email, password }
 * @returns {Object} 建立的用戶物件
 */
export const createUserRecord = ({ username, email, password }) => {
  const timestamp = new Date().toISOString();
  const hashedPassword = hashPassword(password);

  const statement = db.prepare(`
    INSERT INTO users (username, email, password, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    username,
    email,
    hashedPassword,
    timestamp,
    timestamp
  );

  return getUserById(result.lastInsertRowid);
};

/**
 * 根據 email 查詢用戶
 * @param {string} email - 電子郵件
 * @returns {Object|null} 用戶物件
 */
export const findUserByEmail = (email) => {
  const statement = db.prepare(`
    SELECT *
    FROM users
    WHERE email = ?
  `);

  const row = statement.get(email);
  return mapUserRow(row);
};

/**
 * 根據 ID 查詢用戶
 * @param {number} id - 用戶 ID
 * @returns {Object|null} 用戶物件
 */
export const getUserById = (id) => {
  const statement = db.prepare(`
    SELECT *
    FROM users
    WHERE id = ?
  `);

  const row = statement.get(id);
  return mapUserRow(row);
};

/**
 * 驗證密碼
 * @param {string} plainPassword - 明文密碼
 * @param {string} hashedPassword - 雜湊密碼
 * @returns {boolean} 密碼是否相符
 */
export const verifyPassword = (plainPassword, hashedPassword) => {
  return comparePassword(plainPassword, hashedPassword);
};
