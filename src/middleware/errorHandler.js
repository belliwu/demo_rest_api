/**
 * 全域錯誤處理中介層
 * -------------------------------------------------
 * 統一處理所有未捕獲的錯誤,確保回應格式一致
 * 
 * 使用方式:
 * - 在 app.js 中所有路由之後註冊
 * - Controller 可以直接 throw error 或使用 next(error)
 */
export const errorHandler = (err, req, res, next) => {
  console.error("錯誤詳情:", err);

  // 預設錯誤狀態碼
  const statusCode = err.statusCode || 500;
  
  // 預設錯誤訊息
  const message = err.message || "伺服器內部錯誤";

  // 統一錯誤回應格式
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

/**
 * 404 Not Found 處理
 * -------------------------------------------------
 * 當請求的路由不存在時回應
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `找不到路由: ${req.method} ${req.originalUrl}`,
  });
};
