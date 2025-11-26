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
  try {
    // Step 1: 從 Authorization header 取得 token
    // -------------------------------------------------
    // 格式: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "未提供認證 token，請先登入",
      });
    }

    // 移除 "Bearer " 前綴，取得純 token
    const token = authHeader.substring(7);

    // Step 2: 驗證 token
    // -------------------------------------------------
    // verifyToken 會檢查簽名和有效期限
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token 無效或已過期，請重新登入",
      });
    }

    // Step 3: 從資料庫取得完整使用者資料
    // -------------------------------------------------
    // decoded.userId 是當初產生 token 時存入的使用者 ID
    const userFromDb = getUserById(decoded.userId);
    
    if (!userFromDb) {
      return res.status(401).json({
        success: false,
        message: "使用者不存在，請重新登入",
      });
    }

    // Step 4: 將使用者資料掛載到 request 物件
    // -------------------------------------------------
    req.user = userFromDb;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "認證過程中發生錯誤",
      error: error.message,
    });
  }
};
