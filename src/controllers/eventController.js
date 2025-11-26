import {
  validateEventPayload,
  sanitizeEventRecord,
  createEventRecord,
  getEventById,
  getAllEvents,
  updateEventRecord,
  deleteEventRecord,
  isEventOwner,
} from "../services/eventService.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * Event Controller
 * -------------------------------------------------
 * 集中處理與事件相關的 HTTP 業務邏輯：
 * - createEvent：建立新事件
 * - getEvents：取得事件列表
 * - getEvent：取得單一事件
 * - updateEvent：更新事件
 * - deleteEvent：刪除事件
 * 
 * 每支方法都遵循以下結構：
 * 1. 解析與驗證請求內容
 * 2. 執行核心商業邏輯（透過 services 與 SQLite 互動）
 * 3. 使用統一的 response helper 回傳結果
 */

/**
 * 建立新事件
 * POST /api/events
 */
export const createEvent = (req, res) => {
  console.log("\n➕ === 開始建立事件 ===");
  console.log("請求 Body:", req.body);
  console.log("當前用戶:", req.user ? req.user.username + " (ID: " + req.user.id + ")" : "無");
  
  try {
    const { title, description, date, location } = req.body;
    const userId = req.user.id; // 從 authenticate middleware 取得

    // Step 1. 驗證輸入資料
    console.log("Step 1: 驗證輸入資料");
    const validation = validateEventPayload({ title, description, date, location });
    if (!validation.valid) {
      return sendError(res, "輸入資料驗證失敗", 400, validation.errors);
    }

    // Step 2. 建立事件
    const newEvent = createEventRecord({
      title,
      description,
      date,
      location,
      userId,
    });

    // Step 3. 回傳建立的事件
    return sendSuccess(
      res,
      { event: sanitizeEventRecord(newEvent) },
      "事件建立成功",
      201
    );
  } catch (error) {
    console.error("建立事件錯誤:", error);
    return sendError(res, "建立事件過程中發生錯誤", 500);
  }
};

/**
 * 取得事件列表
 * GET /api/events
 * Query params:
 * - mine: true/false (是否只取得當前使用者的事件)
 */
export const getEvents = (req, res) => {
  console.log("\n📋 === 開始取得事件列表 ===");
  console.log("查詢參數:", req.query);
  console.log("當前用戶:", req.user ? req.user.username + " (ID: " + req.user.id + ")" : "無");
  
  try {
    const { mine } = req.query;
    const userId = mine === "true" ? req.user.id : null;
    console.log("過濾條件:", mine === "true" ? "只顯示我的事件" : "顯示所有事件");

    const events = getAllEvents(userId);
    console.log("✅ 找到 " + events.length + " 個事件");
    const sanitizedEvents = events.map(sanitizeEventRecord);

    return sendSuccess(res, { events: sanitizedEvents });
  } catch (error) {
    console.error("取得事件列表錯誤:", error);
    return sendError(res, "取得事件列表時發生錯誤", 500);
  }
};

/**
 * 取得單一事件
 * GET /api/events/:id
 */
export const getEvent = (req, res) => {
  try {
    const { id } = req.params;

    const event = getEventById(Number(id));
    if (!event) {
      return sendError(res, "找不到該事件", 404);
    }

    return sendSuccess(res, { event: sanitizeEventRecord(event) });
  } catch (error) {
    console.error("取得事件錯誤:", error);
    return sendError(res, "取得事件時發生錯誤", 500);
  }
};

/**
 * 更新事件
 * PUT /api/events/:id
 */
export const updateEvent = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location } = req.body;
    const userId = req.user.id;

    // Step 1. 檢查事件是否存在
    const event = getEventById(Number(id));
    if (!event) {
      return sendError(res, "找不到該事件", 404);
    }

    // Step 2. 檢查是否為事件擁有者
    if (!isEventOwner(Number(id), userId)) {
      return sendError(res, "您沒有權限修改此事件", 403);
    }

    // Step 3. 驗證輸入資料
    const validation = validateEventPayload({ title, description, date, location });
    if (!validation.valid) {
      return sendError(res, "輸入資料驗證失敗", 400, validation.errors);
    }

    // Step 4. 更新事件
    const updatedEvent = updateEventRecord(Number(id), {
      title,
      description,
      date,
      location,
    });

    return sendSuccess(
      res,
      { event: sanitizeEventRecord(updatedEvent) },
      "事件更新成功"
    );
  } catch (error) {
    console.error("更新事件錯誤:", error);
    return sendError(res, "更新事件過程中發生錯誤", 500);
  }
};

/**
 * 刪除事件
 * DELETE /api/events/:id
 */
export const deleteEvent = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Step 1. 檢查事件是否存在
    const event = getEventById(Number(id));
    if (!event) {
      return sendError(res, "找不到該事件", 404);
    }

    // Step 2. 檢查是否為事件擁有者
    if (!isEventOwner(Number(id), userId)) {
      return sendError(res, "您沒有權限刪除此事件", 403);
    }

    // Step 3. 刪除事件
    const success = deleteEventRecord(Number(id));
    if (!success) {
      return sendError(res, "刪除事件失敗", 500);
    }

    return sendSuccess(res, null, "事件刪除成功");
  } catch (error) {
    console.error("刪除事件錯誤:", error);
    return sendError(res, "刪除事件過程中發生錯誤", 500);
  }
};
