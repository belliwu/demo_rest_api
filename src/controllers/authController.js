import {
  validateUserPayload,
  sanitizeUserRecord,
  createUserRecord,
  findUserByEmail,
  verifyPassword,
} from "../services/userService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { generateToken } from "../utils/jwtHelper.js";

/**
 * Auth Controller
 * -------------------------------------------------
 * 集中處理與使用者身份相關的 HTTP 業務邏輯：
 * - signup：建立新帳號
 * - login：驗證憑證並建立登入狀態
 * - getMe：回傳當前登入者（需依賴 middleware 預先寫入 req.user）
 * - logout：清除登入狀態
 *
 * 每支方法都遵循以下結構：
 * 1. 解析與驗證請求內容
 * 2. 執行核心商業邏輯（透過 services 與 SQLite 互動）
 * 3. 使用統一的 response helper 回傳結果
 */

/**
 * 註冊新用戶
 * POST /api/user/signup
 */
export const signup = (req, res) => {
  console.log("\n📝 === 開始註冊流程 ===");
  console.log("請求 Body:", { username: req.body.username, email: req.body.email, password: "***" });
  
  try {
    const { username, email, password } = req.body;

    // Step 1. 驗證輸入資料
    console.log("Step 1: 驗證輸入資料");
    const validation = validateUserPayload({ username, email, password });
    if (!validation.valid) {
      console.log("❌ 驗證失敗:", validation.errors);
      console.log("📝 === 註冊流程失敗 ===\n");
      return sendError(res, "輸入資料驗證失敗", 400, validation.errors);
    }
    console.log("✅ 驗證通過");

    // Step 2. 檢查是否已有相同 email 的帳號
    console.log("Step 2: 檢查 Email 是否存在");
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      console.log("❌ Email 已被註冊:", email);
      console.log("📝 === 註冊流程失敗 ===\n");
      return sendError(res, "電子郵件已被使用，請改用其他帳號", 409);
    }
    console.log("✅ Email 可用");

    // Step 3. 建立用戶並寫入 SQLite
    console.log("Step 3: 建立新用戶");
    const newUser = createUserRecord({ username, email, password });
    console.log("✅ 用戶建立成功, ID:", newUser.id);

    // Step 4. 產生 JWT token
    // -------------------------------------------------
    // 註冊成功後自動登入，產生 token 供後續使用
    console.log("Step 4: 產生 JWT token");
    const token = generateToken({ userId: newUser.id, email: newUser.email });
    console.log("✅ Token 產生成功");

    // Step 5. 回傳不含密碼的用戶資料與 token
    const sanitizedUser = sanitizeUserRecord(newUser);
    console.log("Step 5: 回傳註冊成功");
    console.log("📝 === 註冊流程完成 ===\n");

    return sendSuccess(
      res,
      {
        user: sanitizedUser,
        token: token,
      },
      "註冊成功",
      201
    );
  } catch (error) {
    console.error("❌ 註冊過程發生錯誤:");
    console.error("錯誤訊息:", error.message);
    console.error("完整錯誤:", error);
    console.log("📝 === 註冊流程失敗 ===\n");
    return sendError(res, "註冊過程中發生錯誤", 500);
  }
};

/**
 * 用戶登入
 * POST /api/user/login
 */
export const login = (req, res) => {
  console.log("\n🔑 === 開始登入流程 ===");
  console.log("請求 Body:", { email: req.body.email, password: "***" });
  
  try {
    const { email, password } = req.body;

    // Step 1. 驗證必填欄位
    console.log("Step 1: 驗證必填欄位");
    if (!email || !password) {
      console.log("❌ 缺少必填欄位");
      console.log("🔑 === 登入流程失敗 ===\n");
      return sendError(res, "電子郵件和密碼為必填", 400);
    }

    // Step 2. 根據 email 查詢 SQLite 內是否存在該用戶
    const user = findUserByEmail(email);
    if (!user) {
      return sendError(res, "不存在該用戶", 401);
    }

    // Step 3. 驗證密碼
    const passwordMatches = verifyPassword(password, user.password);
    if (!passwordMatches) {
      return sendError(res, "密碼錯誤", 401);
    }

    // Step 4. 產生 JWT token
    // -------------------------------------------------
    // payload 只包含必要資訊（userId, email），避免存放敏感資料
    const token = generateToken({ userId: user.id, email: user.email });

    // Step 5. 回傳用戶資料與 token
    const sanitizedUser = sanitizeUserRecord(user);

    return sendSuccess(
      res,
      {
        user: sanitizedUser,
        token: token,
      },
      "登入成功"
    );
  } catch (error) {
    return sendError(res, "登入過程中發生錯誤", 500);
  }
};

/**
 * 取得目前登入用戶資料
 * GET /api/user/me
 */
export const getMe = (req, res) => {
  try {
    // req.user 由 authenticate middleware 設定
    const currentUser = req.user;

    if (!currentUser) {
      return sendError(res, "找不到使用者資料", 404);
    }

    return sendSuccess(res, { user: sanitizeUserRecord(currentUser) });
  } catch (error) {
    return sendError(res, "取得用戶資料時發生錯誤", 500);
  }
};

/**
 * 用戶登出
 * POST /api/user/logout
 */
export const logout = (req, res) => {
  try {
    // 注意：實際應用中應在此處：
    // 1. 將 token 加入黑名單（如果使用 token 黑名單機制）
    // 2. 清除 session（如果使用 session）
    // 3. 清除客戶端的 token

    return sendSuccess(res, null, "登出成功");
  } catch (error) {
    return sendError(res, "登出過程中發生錯誤", 500);
  }
};
