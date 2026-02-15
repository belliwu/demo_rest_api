import request from "supertest";
import app from "../../app.js";
import { db } from "../../src/config/database.js";

describe("authController", () => {
  beforeEach(() => {
    // 清空資料（注意順序：先子表後父表以避免外鍵約束）
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();
  });

  describe("POST /api/users/signup", () => {
    test("should register new user successfully", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/users/signup")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    test("should reject duplicate email", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      // 第一次註冊
      await request(app).post("/api/users/signup").send(userData);

      // 第二次註冊相同 email
      const response = await request(app)
        .post("/api/users/signup")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    test("should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/users/signup")
        .send({
          username: "testuser",
          email: "invalid-email",
          password: "password123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/users/login", () => {
    beforeEach(async () => {
      // 註冊一個測試用戶
      await request(app).post("/api/users/signup").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
    });

    test("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    test("should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test("should reject non-existent user", async () => {
      const response = await request(app)
        .post("/api/users/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/users/me", () => {
    let token;

    beforeEach(async () => {
      const response = await request(app).post("/api/users/signup").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      token = response.body.data.token;
    });

    test("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe("test@example.com");
    });

    test("should reject request without token", async () => {
      await request(app).get("/api/users/me").expect(401);
    });
  });
});
