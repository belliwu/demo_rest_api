import "dotenv/config";
import express from "express";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import registrationRoutes from "./src/routes/registrationRoutes.js";
import { initDatabase } from "./src/config/database.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

/**
 * 伺服器進入點
 * -------------------------------------------------
 * 此檔案負責組裝整個 HTTP Request Lifecycle：
 * 1. 初始化資料庫
 * 2. 建立 Express 應用實例
 * 3. 註冊全域中介層（JSON 解析、表單解析）
 * 4. 掛載各功能路由（目前僅有 auth）
 * 5. 註冊錯誤處理中介層
 * 6. 啟動 HTTP 伺服器
 */

// 初始化資料庫（在啟動伺服器前執行）
try {
  initDatabase();
  console.log("✓ 資料庫初始化成功");
} catch (error) {
  console.error("✗ 初始化資料庫失敗:", error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 及 URL-Encoded 請求體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 掛載路由
app.use("/api/users", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", registrationRoutes);

// 404 處理（必須在所有路由之後）
app.use(notFoundHandler);

// 全域錯誤處理（必須在最後）
app.use(errorHandler);

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`✓ 伺服器運行於 http://localhost:${PORT}`);
  console.log(`✓ Auth API: http://localhost:${PORT}/api/user`);
  console.log(`✓ Events API: http://localhost:${PORT}/api/events`);
  console.log(`✓ Registration API: http://localhost:${PORT}/api`);
});

export default app;
