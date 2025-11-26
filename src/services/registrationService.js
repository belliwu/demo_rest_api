import { db } from "../config/database.js";
import { validateRegistrationData, sanitizeRegistration } from "../models/Registration.js";

/**
 * Registration Service
 * -------------------------------------------------
 * 集中處理活動報名相關的業務邏輯與資料庫操作
 * 
 * 職責：
 * 1. 資料驗證（委派給 Registration validator）
 * 2. 資料庫 CRUD 操作
 * 3. 報名狀態管理
 */

/**
 * 將資料庫欄位映射為應用層物件
 * @param {Object} row - 資料庫查詢結果
 * @returns {Object|null} 報名物件
 */
const mapRegistrationRow = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * 驗證報名資料
 * @param {Object} payload - 報名資料
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateRegistrationPayload = (payload) => {
  return validateRegistrationData(payload);
};

/**
 * 清理報名資訊
 * @param {Object} registration - 報名物件
 * @returns {Object} 清理後的報名物件
 */
export const sanitizeRegistrationRecord = (registration) => {
  return sanitizeRegistration(registration);
};

/**
 * 建立新報名
 * @param {Object} registrationData - { eventId, userId }
 * @returns {Object} 建立的報名物件
 */
export const createRegistrationRecord = ({ eventId, userId }) => {
  const timestamp = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO registrations (event_id, user_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    eventId,
    userId,
    'registered', // 預設狀態
    timestamp,
    timestamp
  );

  return getRegistrationById(result.lastInsertRowid);
};

/**
 * 根據 ID 查詢報名記錄
 * @param {number} id - 報名 ID
 * @returns {Object|null} 報名物件
 */
export const getRegistrationById = (id) => {
  const statement = db.prepare(`
    SELECT *
    FROM registrations
    WHERE id = ?
  `);

  const row = statement.get(id);
  return mapRegistrationRow(row);
};

/**
 * 查詢特定活動的所有報名記錄
 * @param {number} eventId - 活動 ID
 * @returns {Array} 報名陣列
 */
export const getRegistrationsByEventId = (eventId) => {
  const statement = db.prepare(`
    SELECT r.*, u.username, u.email
    FROM registrations r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ?
    ORDER BY r.created_at DESC
  `);

  const rows = statement.all(eventId);
  return rows.map(row => ({
    ...mapRegistrationRow(row),
    username: row.username,
    email: row.email,
  }));
};

/**
 * 查詢特定使用者的所有報名記錄
 * @param {number} userId - 使用者 ID
 * @returns {Array} 報名陣列
 */
export const getRegistrationsByUserId = (userId) => {
  const statement = db.prepare(`
    SELECT r.*, e.title, e.date, e.location
    FROM registrations r
    LEFT JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `);

  const rows = statement.all(userId);
  return rows.map(row => ({
    ...mapRegistrationRow(row),
    eventTitle: row.title,
    eventDate: row.date,
    eventLocation: row.location,
  }));
};

/**
 * 檢查使用者是否已報名該活動
 * @param {number} eventId - 活動 ID
 * @param {number} userId - 使用者 ID
 * @returns {Object|null} 報名物件（如果已報名）
 */
export const findRegistration = (eventId, userId) => {
  const statement = db.prepare(`
    SELECT *
    FROM registrations
    WHERE event_id = ? AND user_id = ?
  `);

  const row = statement.get(eventId, userId);
  return mapRegistrationRow(row);
};

/**
 * 取消報名（刪除記錄）
 * @param {number} id - 報名 ID
 * @returns {boolean} 是否刪除成功
 */
export const cancelRegistration = (id) => {
  const statement = db.prepare(`
    DELETE FROM registrations
    WHERE id = ?
  `);

  const result = statement.run(id);
  return result.changes > 0;
};

/**
 * 檢查報名是否屬於特定使用者
 * @param {number} registrationId - 報名 ID
 * @param {number} userId - 使用者 ID
 * @returns {boolean} 是否為該使用者的報名
 */
export const isRegistrationOwner = (registrationId, userId) => {
  const registration = getRegistrationById(registrationId);
  return registration && registration.userId === userId;
};
