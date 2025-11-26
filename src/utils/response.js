/**
 * 回應格式化工具
 * -------------------------------------------------
 * 統一 API 回應格式,確保前端能一致處理結果
 */

/**
 * 成功回應
 * @param {Object} res - Express response 物件
 * @param {Object} data - 回傳資料
 * @param {string} message - 成功訊息
 * @param {number} statusCode - HTTP 狀態碼 (預設 200)
 */
export const sendSuccess = (res, data = null, message = "操作成功", statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * 錯誤回應
 * @param {Object} res - Express response 物件
 * @param {string} message - 錯誤訊息
 * @param {number} statusCode - HTTP 狀態碼 (預設 400)
 * @param {Array} errors - 詳細錯誤陣列 (可選)
 */
export const sendError = (res, message = "操作失敗", statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
