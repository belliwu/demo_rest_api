import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 資料庫配置與連線管理
 * -------------------------------------------------
 * 此模組負責：
 * 1. 建立 SQLite 資料庫連線
 * 2. 設定資料庫效能優化參數
 * 3. 提供資料表初始化函數
 * 
 * 使用 better-sqlite3 套件（同步 API）
 */

// -------------------------------------------------
// 解決 ES Module 中無法直接使用 __dirname 的問題
// -------------------------------------------------
// 在 ES Module 中，__dirname 和 __filename 不存在
// 需要透過 import.meta.url 取得當前檔案路徑，再轉換為標準檔案路徑
const __filename = fileURLToPath(import.meta.url);  // 取得當前檔案的絕對路徑
const __dirname = path.dirname(__filename);         // 取得當前檔案所在目錄

// -------------------------------------------------
// 資料庫檔案路徑設定
// -------------------------------------------------
// 優先使用環境變數 SQLITE_DB_PATH（方便不同環境切換）
// 若未設定則使用預設路徑：專案根目錄的 data.sqlite
const resolvedDbPath =
  process.env.SQLITE_DB_PATH || path.join(__dirname, "../../data.sqlite");

// -------------------------------------------------
// 建立 SQLite 資料庫連線
// -------------------------------------------------
const db = new Database(resolvedDbPath);

// -------------------------------------------------
// 效能優化：啟用 WAL (Write-Ahead Logging) 模式
// -------------------------------------------------
// WAL 模式的優點：
// 1. 讀取操作不會被寫入操作阻塞（並發效能更好）
// 2. 寫入速度更快
// 3. 更安全的資料持久化機制
db.pragma("journal_mode = WAL");

// -------------------------------------------------
// 資料完整性：啟用外鍵約束
// -------------------------------------------------
// SQLite 預設不啟用外鍵檢查，需手動開啟
// 確保資料表之間的參照完整性（例如：防止刪除被參照的記錄）
db.pragma("foreign_keys = ON");

/**
 * 初始化資料庫資料表
 * -------------------------------------------------
 * 建立必要的資料表結構（如果不存在）
 * 
 * Users 資料表欄位說明：
 * - id: 主鍵，自動遞增
 * - username: 使用者名稱，不可為空
 * - email: 電子郵件，不可為空且唯一（用於登入）
 * - password: 雜湊後的密碼，不可為空
 * - created_at: 建立時間（ISO 8601 格式）
 * - updated_at: 更新時間（ISO 8601 格式）
 */
export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      location TEXT,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'registered',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(event_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
  `);
};

// -------------------------------------------------
// 匯出資料庫連線實例與路徑
// -------------------------------------------------
// db: 供 Service 層執行 SQL 查詢
// dbPath: 供測試或除錯時確認資料庫位置
export { db, resolvedDbPath as dbPath };
