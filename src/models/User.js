// User Validator
// -------------------------------------------------
// 此模組專注於「用戶資料驗證與清理」：
// 1. validateUserData：集中管理欄位檢查規則，確保各入口一致
// 2. sanitizeUser：在回傳 API 時移除敏感資訊（如密碼）
// 3. isValidEmail：封裝 email 正規表達式邏輯，避免重複定義
// 
// 實際資料持久化交由 services 層 (userService) 與 SQLite 負責

/**
 * 驗證用戶資料格式
 * @param {Object} userData - 用戶資料
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateUserData = (userData) => {
  const errors = [];

  // ---------- Username ----------
  // 1. 必填
  // 2. 去除空白後長度需大於 0，避免只有空白字元的情況
  if (!userData.username || userData.username.trim().length === 0) {
    errors.push("使用者名稱為必填");
  }

  // ---------- Email ----------
  // 1. 必填
  // 2. 需符合基本 email regex
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push("有效的電子郵件為必填");
  }

  // ---------- Password ----------
  // 1. 必填
  // 2. 最低長度限制（示範設定為 6）
  if (!userData.password || userData.password.length < 6) {
    errors.push("密碼長度至少需要 6 個字元");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證電子郵件格式
 * @param {string} email - 電子郵件
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 過濾用戶敏感資訊（移除密碼）
 * @param {Object} user - 用戶物件
 * @returns {Object} 不包含密碼的用戶物件
 */
export const sanitizeUser = (user) => {
  if (!user) return null;

  // 使用解構賦值將 password 拿掉，避免在 API 回應中洩漏
  const { password, ...sanitized } = user;
  return sanitized;
};
