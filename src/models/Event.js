/**
 * Event Validator
 * -------------------------------------------------
 * 此模組專注於「事件資料驗證與清理」：
 * 1. validateEventData：集中管理事件欄位檢查規則
 * 2. sanitizeEvent：在回傳 API 時移除敏感資訊
 */

/**
 * 驗證事件資料格式
 * @param {Object} eventData - 事件資料
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateEventData = (eventData) => {
  const errors = [];

  // ---------- Title ----------
  // 1. 必填
  // 2. 去除空白後長度需大於 0
  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.push("事件標題為必填");
  }

  // ---------- Description ----------
  // 選填，但如果有值則檢查長度
  if (eventData.description && eventData.description.length > 20) {
    errors.push("事件描述不得超過 20 個字元");
  }

  // ---------- Date ----------
  // 1. 必填
  // 2. 需為有效的 ISO 8601 日期格式
  if (!eventData.date) {
    errors.push("事件日期為必填");
  } else {
    const dateObj = new Date(eventData.date);
    if (isNaN(dateObj.getTime())) {
      errors.push("事件日期格式無效");
    }
  }

  // ---------- Location ----------
  // 選填
  if (eventData.location && eventData.location.length > 200) {
    errors.push("事件地點不得超過 200 個字元");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 清理事件資訊
 * @param {Object} event - 事件物件
 * @returns {Object} 清理後的事件物件
 */
export const sanitizeEvent = (event) => {
  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    userId: event.userId,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
