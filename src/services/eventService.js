import { db } from "../config/database.js";
import { validateEventData, sanitizeEvent } from "../models/Event.js";

/**
 * Event Service
 * -------------------------------------------------
 * 集中處理事件相關的業務邏輯與資料庫操作
 * 
 * 職責：
 * 1. 資料驗證（委派給 Event validator）
 * 2. 資料庫 CRUD 操作
 * 3. 資料轉換與清理
 */

/**
 * 將資料庫欄位映射為應用層物件 (ie, EventDTO)
 * @param {Object} row - 資料庫查詢結果
 * @returns {Object|null} 事件物件
 */
const mapEventRow = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    location: row.location,
    image: row.image,              // 新增 image 對應
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * 驗證事件資料
 * @param {Object} payload - 事件資料
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateEventPayload = (payload) => {
  return validateEventData(payload);
};

/**
 * 清理事件資訊
 * @param {Object} event - 事件物件
 * @returns {Object} 清理後的事件物件
 */
export const sanitizeEventRecord = (event) => {
  return sanitizeEvent(event);
};

/**
 * 建立新事件
 * @param {Object} eventData - { title, description, date, location, userId }
 * @returns {Object} 建立的事件物件
 */
export const createEventRecord = ({ title, description, date, location, userId, image = null }) => {
  const timestamp = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO events (title, description, date, location, image, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    title,
    description || null,
    date,
    location || null,
    image || null,
    userId,
    timestamp,
    timestamp
  );

  return getEventById(result.lastInsertRowid);
};

/**
 * 根據 ID 查詢事件
 * @param {number} id - 事件 ID
 * @returns {Object|null} 事件物件
 */
export const getEventById = (id) => {
  const statement = db.prepare(`
    SELECT *
    FROM events
    WHERE id = ?
  `);

  const row = statement.get(id);
  return mapEventRow(row);
};

/**
 * 查詢所有事件（可選擇只查詢特定使用者的事件）
 * @param {number|null} userId - 使用者 ID（選填）
 * @returns {Array} 事件陣列
 */
export const getAllEvents = (userId = null) => {
  let statement;
  let rows;

  if (userId) {
    statement = db.prepare(`
      SELECT *
      FROM events
      WHERE user_id = ?
      ORDER BY date DESC
    `);
    rows = statement.all(userId);
  } else {
    statement = db.prepare(`
      SELECT *
      FROM events
      ORDER BY date DESC
    `);
    rows = statement.all();
  }

  return rows.map(mapEventRow);
};

/**
 * 更新事件
 * @param {number} id - 事件 ID
 * @param {Object} updates - 要更新的欄位
 * @returns {Object|null} 更新後的事件物件
 */
export const updateEventRecord = (id, updates) => {
  const timestamp = new Date().toISOString();
  const { title, description, date, location, image = null } = updates;

  const statement = db.prepare(`
    UPDATE events
    SET title = ?, description = ?, date = ?, location = ?, image = ?, updated_at = ?
    WHERE id = ?
  `);

  statement.run(
    title,
    description || null,
    date,
    location || null,
    image || null,
    timestamp,
    id
  );

  return getEventById(id);
};

/**
 * 刪除事件
 * @param {number} id - 事件 ID
 * @returns {boolean} 是否刪除成功
 */
export const deleteEventRecord = (id) => {
  const statement = db.prepare(`
    DELETE FROM events
    WHERE id = ?
  `);

  const result = statement.run(id);
  return result.changes > 0;
};

/**
 * 檢查事件是否屬於特定使用者
 * @param {number} eventId - 事件 ID
 * @param {number} userId - 使用者 ID
 * @returns {boolean} 是否為該使用者的事件
 */
export const isEventOwner = (eventId, userId) => {
  const event = getEventById(eventId);
  return event && event.userId === userId;
};
