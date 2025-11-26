import { getUserById } from "../services/userService.js";
import { verifyToken } from "../utils/jwtHelper.js";

/**
 * 認證中介層
 * -------------------------------------------------
 * 驗證使用者身份,確保只有已登入使用者可以存取受保護的路由
 * 
 * JWT 認證流程:
 * 1. 從 Authorization header 讀取 Bearer token
 * 2. 驗證 token 的有效性與簽名
 * 3. 從 token 中解碼出 userId
 * 4. 從資料庫查詢完整使用者資料
 * 5. 將使用者資料掛載到 req.user 供後續 controller 使用
 * 
 * Header 格式: Authorization: Bearer <token>
 */
export const authenticate = (req, res, next) => {
  console.log("\n🔐 === 開始認證 ===");
  console.log("📍 請求路徑:", req.method, req.originalUrl);
  
  try {
    // Step 1: 從 Authorization header 取得 token
    // -------------------------------------------------
    // 格式: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.header("Authorization");
    console.log("📨 Authorization Header:", authHeader ? authHeader.substring(0, 30) + "..." : "無");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Authorization header 格式錯誤或缺失");
      console.log("🔐 === 認證失敗 ===\n");
      return res.status(401).json({
        success: false,
        message: "未提供認證 token，請先登入",
      });
    }

    // 移除 "Bearer " 前綴，取得純 token
    const token = authHeader.substring(7);
    console.log("🎫 提取的 Token (前20字元):", token.substring(0, 20) + "...");

    // Step 2: 驗證 token
    // -------------------------------------------------
    // verifyToken 會檢查簽名和有效期限
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log("❌ Token 驗證失敗");
      console.log("🔐 === 認證失敗 ===\n");
      return res.status(401).json({
        success: false,
        message: "Token 無效或已過期，請重新登入",
      });
    }
    console.log("✅ Token 解碼成功:", decoded);

    // Step 3: 從資料庫取得完整使用者資料
    // -------------------------------------------------
    // decoded.userId 是當初產生 token 時存入的使用者 ID
    const userFromDb = getUserById(decoded.userId);
    console.log("👤 查詢用戶:", userFromDb ? `ID ${userFromDb.id} - ${userFromDb.username}` : "未找到");
    
    if (!userFromDb) {
      console.log("❌ 用戶不存在");
      console.log("🔐 === 認證失敗 ===\n");
      return res.status(401).json({
        success: false,
        message: "使用者不存在，請重新登入",
      });
    }

    // Step 4: 將使用者資料掛載到 request 物件
    // -------------------------------------------------
    req.user = userFromDb;
    console.log("✅ 認證成功，用戶:", userFromDb.username);
    console.log("🔐 === 認證完成 ===\n");
    next();
  } catch (error) {
    console.error("❌ 認證過程發生錯誤:");
    console.error("錯誤類型:", error.name);
    console.error("錯誤訊息:", error.message);
    console.log("🔐 === 認證錯誤 ===\n");
    return res.status(500).json({
      success: false,
      message: "認證過程中發生錯誤",
      error: error.message,
    });
  }
};
