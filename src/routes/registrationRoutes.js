import express from "express";
import {
  registerEvent,
  unregisterEvent,
  getEventRegistrations,
  getMyRegistrations,
} from "../controllers/registrationController.js";
import { authenticate } from "../middleware/auth.js";

/**
 * registrationRoutes
 * -------------------------------------------------
 * 以 Router 模組化管理活動報名相關路徑。
 * 所有報名相關路由都需要使用者登入驗證。
 */
const router = express.Router();

/**
 * 所有路由都需要登入驗證
 */
router.use(authenticate);

/**
 * 報名路由：
 * - POST /events/:eventId/register        ：報名活動
 * - DELETE /events/:eventId/register      ：取消報名
 * - GET /events/:eventId/registrations    ：查詢活動報名名單（活動建立者或可選開放）
 * - GET /me/registrations                 ：查詢使用者自己報名的活動
 */
router.post("/events/:eventId/register", registerEvent);
router.delete("/events/:eventId/register", unregisterEvent);
router.get("/events/:eventId/registrations", getEventRegistrations);
router.get("/me/registrations", getMyRegistrations);

export default router;
