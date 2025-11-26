/**
 * Registration Validator
 * -------------------------------------------------
 * 此模組專注於「活動報名資料驗證與清理」：
 * 1. validateRegistrationData：集中管理報名欄位檢查規則
 * 2. sanitizeRegistration：在回傳 API 時清理資料
 */

/**
 * 驗證報名資料格式
 * @param {Object} registrationData - 報名資料
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateRegistrationData = (registrationData) => {
  const errors = [];

  // ---------- EventId ----------
  // 1. 必填
  // 2. 必須是有效的數字
  if (!registrationData.eventId) {
    errors.push("活動 ID 為必填");
  } else if (isNaN(Number(registrationData.eventId))) {
    errors.push("活動 ID 必須是有效的數字");
  }

  // ---------- UserId ----------
  // 1. 必填（通常從 req.user 取得，但仍需驗證）
  if (!registrationData.userId) {
    errors.push("使用者 ID 為必填");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 清理報名資訊
 * @param {Object} registration - 報名物件
 * @returns {Object} 清理後的報名物件
 */
export const sanitizeRegistration = (registration) => {
  if (!registration) return null;

  return {
    id: registration.id,
    eventId: registration.eventId,
    userId: registration.userId,
    status: registration.status,
    createdAt: registration.createdAt,
    updatedAt: registration.updatedAt,
  };
};
