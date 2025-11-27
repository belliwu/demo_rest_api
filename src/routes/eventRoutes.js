import express from "express";
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { authenticate } from "../middleware/auth.js";
import upload  from "../uploads/upload.js";

/**
 * eventRoutes
 * -------------------------------------------------
 * 以 Router 模組化管理 `/api/events/*` 相關路徑。
 * 所有事件相關路由都需要使用者登入驗證。
 */
const router = express.Router();

/**
 * 所有路由都需要登入驗證
 */
router.use(authenticate);

/**
 * 事件路由：
 * - POST /           ：建立新事件
 * - GET /            ：取得事件列表（可用 ?mine=true 只取得自己的事件）
 * - GET /:id         ：取得單一事件
 * - PUT /:id         ：更新事件（僅擁有者）
 * - DELETE /:id      ：刪除事件（僅擁有者）
 */
router.get("/", getEvents);
router.get("/:id", getEvent);
router.post("/", upload.single("image"), createEvent);
router.put("/:id",upload.single("image"), updateEvent);
router.delete("/:id", deleteEvent);

export default router;
