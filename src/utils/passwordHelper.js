import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

/**
 * 密碼加密工具
 * -------------------------------------------------
 * 封裝 bcrypt 相關操作,集中管理密碼處理邏輯
 */

/**
 * 雜湊密碼
 * @param {string} plainPassword - 明文密碼
 * @returns {string} 雜湊後的密碼
 */
export const hashPassword = (plainPassword) => {
  return bcrypt.hashSync(plainPassword, SALT_ROUNDS);
};

/**
 * 驗證密碼
 * @param {string} plainPassword - 明文密碼
 * @param {string} hashedPassword - 雜湊後的密碼
 * @returns {boolean} 密碼是否相符
 */
export const comparePassword = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};
