import "dotenv/config";
import express from "express";
import authRoutes from "./src/routes/authRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import registrationRoutes from "./src/routes/registrationRoutes.js";
import { initDatabase } from "./src/config/database.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";
import { fileURLToPath } from "url";

/**
 * Express 應用配置
 * -------------------------------------------------
 * 此檔案負責組裝整個 HTTP Request Lifecycle：
 * 1. 建立 Express 應用實例
 * 2. 註冊全域中介層（JSON 解析、表單解析）
 * 3. 掛載各功能路由
 * 4. 註冊錯誤處理中介層
 *
 * 數據庫初始化和伺服器啟動只在直接運行此文件時執行
 */

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

// 只在直接運行此文件時才初始化資料庫和啟動伺服器
// 在測試環境中，app 會被 import，但不會執行以下代碼
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  // 初始化資料庫
  try {
    initDatabase();
    console.log("✓ 資料庫初始化成功");
  } catch (error) {
    console.error("✗ 初始化資料庫失敗:", error);
    process.exit(1);
  }

  // 啟動伺服器
  app.listen(PORT, () => {
    console.log(`✓ 伺服器運行於 http://localhost:${PORT}`);
    console.log(`✓ Auth API: http://localhost:${PORT}/api/user`);
    console.log(`✓ Events API: http://localhost:${PORT}/api/events`);
    console.log(`✓ Registration API: http://localhost:${PORT}/api`);
  });
}

export default app;
