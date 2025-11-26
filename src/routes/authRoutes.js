import express from "express";
import { signup, login, getMe, logout } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

/**
 * authRoutes
 * -------------------------------------------------
 * 以 Router 模組化管理 `/api/auth/*` 相關路徑。
 * 此檔案僅負責「HTTP 方法 + 路徑」到對應 controller 的映射，
 * 並在需要權限控制的路由前串上對應 middleware。
 */
const router = express.Router();

/**
 * 公開路由：
 * - POST /signup：訪客註冊帳號
 * - POST /login：使用者登入並換取憑證
 */
router.post("/signup", signup);
router.post("/login", login);

/**
 * 需登入路由：
 * 將 authenticate middleware 放在 controller 之前，確保只有通過驗證的請求
 * 才能執行 getMe / logout 的業務邏輯。
 */
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
