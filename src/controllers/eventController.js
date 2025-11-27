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
import fs from "fs";
import path from "path";

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
  try {
    const { title, description, date, location } = req.body;
    const userId = req.user.id;

    // 如果有上傳檔案，組成公開可用的相對 URL (public/images/<filename>)
    let image = null;
    if (req.file) {
      image = `/images/${req.file.filename}`;
      console.log("上傳的圖檔:", req.file.filename);
    }

    const validation = validateEventPayload({ title, description, date, location });
    if (!validation.valid) {
      // 若上傳了檔案但驗證不通過，刪除剛上傳的檔案
      if (req.file) {
        const filePath = path.join(process.cwd(), "public", "images", req.file.filename);
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      return sendError(res, "輸入資料驗證失敗", 400, validation.errors);
    }

    const newEvent = createEventRecord({
      title,
      description,
      date,
      location,
      userId,
      image,
    });

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

    const event = getEventById(Number(id));
    if (!event) {
      // 若上傳了檔案但事件不存在，刪除上傳檔案
      if (req.file) {
        try { fs.unlinkSync(path.join(process.cwd(), "public", "images", req.file.filename)); } catch (e) {}
      }
      return sendError(res, "找不到該事件", 404);
    }

    if (!isEventOwner(Number(id), userId)) {
      if (req.file) {
        try { fs.unlinkSync(path.join(process.cwd(), "public", "images", req.file.filename)); } catch (e) {}
      }
      return sendError(res, "您沒有權限修改此事件", 403);
    }

    const validation = validateEventPayload({ title, description, date, location });
    if (!validation.valid) {
      if (req.file) {
        try { fs.unlinkSync(path.join(process.cwd(), "public", "images", req.file.filename)); } catch (e) {}
      }
      return sendError(res, "輸入資料驗證失敗", 400, validation.errors);
    }

    // 若有新上傳，刪除舊圖（若存在）
    let image = event.image || null;
    if (req.file) {
      // 刪除舊檔案（若為 /images/xxx）
      if (event.image) {
        const oldFile = path.join(process.cwd(), "public", event.image.replace(/^\//, ""));
        try { if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile); } catch (e) {}
      }
      image = `/images/${req.file.filename}`;
    }

    const updatedEvent = updateEventRecord(Number(id), {
      title,
      description,
      date,
      location,
      image,
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

    const event = getEventById(Number(id));
    if (!event) {
      return sendError(res, "找不到該事件", 404);
    }

    if (!isEventOwner(Number(id), userId)) {
      return sendError(res, "您沒有權限刪除此事件", 403);
    }

    // 刪除資料庫紀錄
    const success = deleteEventRecord(Number(id));
    if (!success) {
      return sendError(res, "刪除事件失敗", 500);
    }

    // 刪除圖片檔案
    if (event.image) {
      const imgPath = path.join(process.cwd(), "public", event.image.replace(/^\//, ""));
      try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (e) { console.error("刪除圖片失敗:", e.message); }
    }

    return sendSuccess(res, null, "事件刪除成功");
  } catch (error) {
    console.error("刪除事件錯誤:", error);
    return sendError(res, "刪除事件過程中發生錯誤", 500);
  }
};
