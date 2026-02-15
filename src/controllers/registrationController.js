import {
  validateRegistrationPayload,
  sanitizeRegistrationRecord,
  createRegistrationRecord,
  getRegistrationById,
  getRegistrationsByEventId,
  getRegistrationsByUserId,
  findRegistration,
  cancelRegistration,
  isRegistrationOwner,
} from "../services/registrationService.js";
import { getEventById } from "../services/eventService.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * Registration Controller
 * -------------------------------------------------
 * 集中處理與活動報名相關的 HTTP 業務邏輯：
 * - registerEvent：報名活動
 * - cancelRegistration：取消報名
 * - getEventRegistrations：查詢活動的報名名單
 * - getMyRegistrations：查詢使用者自己報名的活動
 * 
 * 每支方法都遵循以下結構：
 * 1. 解析與驗證請求內容
 * 2. 執行核心商業邏輯（透過 services 與 SQLite 互動）
 * 3. 使用統一的 response helper 回傳結果
 */

/**
 * 報名活動
 * POST /api/events/:eventId/register
 */
export const registerEvent = (req, res) => {
  console.log("\n📝 === 開始報名活動 ===");
  console.log("活動 ID:", req.params.eventId);
  console.log("當前用戶:", req.user ? req.user.username + " (ID: " + req.user.id + ")" : "無");
  
  try {
    const eventId = Number(req.params.eventId);
    const userId = req.user.id;

    // Step 1. 檢查活動是否存在
    console.log("Step 1: 檢查活動是否存在");
    const event = getEventById(eventId);
    if (!event) {
      console.log("❌ 活動不存在");
      console.log("📝 === 報名失敗 ===\n");
      return sendError(res, "找不到該活動", 404);
    }
    console.log("✅ 活動存在:", event.title);

    // Step 2. 檢查是否已報名
    console.log("Step 2: 檢查是否已報名");
    const existingRegistration = findRegistration(eventId, userId);
    if (existingRegistration) {
      console.log("❌ 已經報名過此活動");
      console.log("📝 === 報名失敗 ===\n");
      return sendError(res, "您已經報名過此活動", 409);
    }
    console.log("✅ 尚未報名");

    // Step 3. 驗證報名資料
    console.log("Step 3: 驗證報名資料");
    const validation = validateRegistrationPayload({ eventId, userId });
    if (!validation.valid) {
      console.log("❌ 驗證失敗:", validation.errors);
      console.log("📝 === 報名失敗 ===\n");
      return sendError(res, "報名資料驗證失敗", 400, validation.errors);
    }
    console.log("✅ 驗證通過");

    // Step 4. 建立報名記錄
    console.log("Step 4: 建立報名記錄");
    const registration = createRegistrationRecord({ eventId, userId });
    console.log("✅ 報名成功, ID:", registration.id);

    console.log("📝 === 報名完成 ===\n");
    return sendSuccess(
      res,
      { 
        registration: sanitizeRegistrationRecord(registration),
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
        }
      },
      "報名成功",
      201
    );
  } catch (error) {
    console.error("❌ 報名過程發生錯誤:");
    console.error("錯誤訊息:", error.message);
    console.error("完整錯誤:", error);
    console.log("📝 === 報名失敗 ===\n");
    return sendError(res, "報名過程中發生錯誤", 500);
  }
};

/**
 * 取消報名
 * DELETE /api/events/:eventId/register
 */
export const unregisterEvent = (req, res) => {
  console.log("\n❌ === 開始取消報名 ===");
  console.log("報名 ID:", req.params.registrationId);
  console.log("當前用戶:", req.user ? req.user.username + " (ID: " + req.user.id + ")" : "無");
  
  try {
    const registrationId = Number(req.params.registrationId);
    const userId = req.user.id;

    // Step 1. 檢查報名記錄是否存在
    console.log("Step 1: 檢查報名記錄");
    // 透過 registrationId 獲取報名記錄
    const registration = getRegistrationById(registrationId);
    if (!registration) {
      console.log("❌ 未找到報名記錄");
      console.log("❌ === 取消報名失敗 ===\n");
      return sendError(res, "未找到此報名記錄", 404);
    }
    console.log("✅ 找到報名記錄, ID:", registration.id);

    // Step 2. 驗證擁有權
    console.log("Step 2: 驗證擁有權");
    if (!isRegistrationOwner(registrationId, userId)) {
      console.log("❌ 無權取消此報名");
      console.log("❌ === 取消報名失敗 ===\n");
      return sendError(res, "無權取消此報名", 403);
    }
    console.log("✅ 擁有權驗證通過");

    // Step 3. 取消報名
    console.log("Step 3: 取消報名");
    const success = cancelRegistration(registrationId);
    if (!success) {
      console.log("❌ 取消報名失敗");
      console.log("❌ === 取消報名失敗 ===\n");
      return sendError(res, "取消報名失敗", 500);
    }
    console.log("✅ 取消報名成功");

    console.log("❌ === 取消報名完成 ===\n");
    return sendSuccess(res, null, "取消報名成功");
  } catch (error) {
    console.error("❌ 取消報名過程發生錯誤:");
    console.error("錯誤訊息:", error.message);
    console.error("完整錯誤:", error);
    console.log("❌ === 取消報名失敗 ===\n");
    return sendError(res, "取消報名過程中發生錯誤", 500);
  }
};

/**
 * 查詢活動的報名名單
 * GET /api/events/:eventId/registrations
 */
export const getEventRegistrations = (req, res) => {
  console.log("\n👥 === 查詢活動報名名單 ===");
  console.log("活動 ID:", req.params.eventId);
  console.log("當前用戶:", req.user ? req.user.username + " (ID: " + req.user.id + ")" : "無");
  
  try {
    const eventId = Number(req.params.eventId);
    const userId = req.user.id;

    // Step 1. 檢查活動是否存在
    console.log("Step 1: 檢查活動是否存在");
    const event = getEventById(eventId);
    if (!event) {
      console.log("❌ 活動不存在");
      console.log("👥 === 查詢失敗 ===\n");
      return sendError(res, "找不到該活動", 404);
    }

    // Step 2. 檢查權限（可選：只有活動建立者可以查看報名名單）
    // 如果要開放給所有人查看，可以移除此檢查
    console.log("Step 2: 檢查權限");
    if (event.userId !== userId) {
      console.log("⚠️ 非活動建立者，但允許查看");
      // 可選：return sendError(res, "只有活動建立者可以查看報名名單", 403);
    }

    // Step 3. 查詢報名名單
    console.log("Step 3: 查詢報名名單");
    const registrations = getRegistrationsByEventId(eventId);
    console.log("✅ 找到 " + registrations.length + " 筆報名記錄");

    console.log("👥 === 查詢完成 ===\n");
    return sendSuccess(res, {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
      },
      registrations: registrations.map(r => ({
        id: r.id,
        userId: r.userId,
        username: r.username,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total: registrations.length,
    });
  } catch (error) {
    console.error("❌ 查詢報名名單錯誤:");
    console.error("錯誤訊息:", error.message);
    console.error("完整錯誤:", error);
    console.log("👥 === 查詢失敗 ===\n");
    return sendError(res, "查詢報名名單時發生錯誤", 500);
  }
};

/**
 * 查詢使用者自己報名的活動
 * GET /api/me/registrations
 */
export const getMyRegistrations = (req, res) => {
  console.log("\n📋 === 查詢我的報名記錄 ===");
  console.log("當前用戶:", req.user ? req.user.username + " (ID: " + req.user.id + ")" : "無");
  
  try {
    const userId = req.user.id;

    console.log("查詢報名記錄...");
    const registrations = getRegistrationsByUserId(userId);
    console.log("✅ 找到 " + registrations.length + " 筆報名記錄");

    console.log("📋 === 查詢完成 ===\n");
    return sendSuccess(res, {
      registrations: registrations.map(r => ({
        id: r.id,
        eventId: r.eventId,
        eventTitle: r.eventTitle,
        eventDate: r.eventDate,
        eventLocation: r.eventLocation,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total: registrations.length,
    });
  } catch (error) {
    console.error("❌ 查詢我的報名記錄錯誤:");
    console.error("錯誤訊息:", error.message);
    console.error("完整錯誤:", error);
    console.log("📋 === 查詢失敗 ===\n");
    return sendError(res, "查詢報名記錄時發生錯誤", 500);
  }
};
