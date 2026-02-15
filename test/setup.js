// 設定測試環境
process.env.NODE_ENV = "test";
process.env.SQLITE_DB_PATH = ":memory:";
process.env.JWT_SECRET =
  "test-secret-key-for-jwt-token-signing-in-test-environment";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "10";

// 初始化測試數據庫
import { initDatabase } from "../src/config/database.js";
initDatabase();
