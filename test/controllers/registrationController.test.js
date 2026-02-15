import request from "supertest";
import app from "../../app.js";
import { db } from "../../src/config/database.js";

describe("registrationController", () => {
  let token;
  let userId;
  let eventId;

  beforeEach(async () => {
    // 清空資料表
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();

    // 註冊並登入用戶
    const userResponse = await request(app).post("/api/users/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    token = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;

    // 建立測試事件
    const eventResponse = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Event",
        date: new Date().toISOString(),
      });

    eventId = eventResponse.body.data.event.id;
  });

  describe("POST /api/events/:eventId/registrations", () => {
    test("should register for event successfully", async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/registrations`)
        .set("Authorization", `Bearer ${token}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registration).toBeDefined();
      expect(response.body.data.registration.eventId).toBe(eventId);
      expect(response.body.data.registration.userId).toBe(userId);
    });

    test("should reject duplicate registration", async () => {
      // 第一次註冊
      await request(app)
        .post(`/api/events/${eventId}/registrations`)
        .set("Authorization", `Bearer ${token}`);

      // 第二次註冊相同事件
      const response = await request(app)
        .post(`/api/events/${eventId}/registrations`)
        .set("Authorization", `Bearer ${token}`)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    test("should reject unauthorized request", async () => {
      await request(app)
        .post(`/api/events/${eventId}/registrations`)
        .expect(401);
    });
  });

  describe("GET /api/events/:eventId/registrations", () => {
    beforeEach(async () => {
      // 註冊一些用戶
      await request(app)
        .post(`/api/events/${eventId}/registrations`)
        .set("Authorization", `Bearer ${token}`);
    });

    test("should get event registrations", async () => {
      const response = await request(app)
        .get(`/api/events/${eventId}/registrations`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.registrations).toBeDefined();
      expect(response.body.data.registrations.length).toBeGreaterThan(0);
    });
  });

  describe("DELETE /api/registrations/:registrationId", () => {
    let registrationId;

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/registrations`)
        .set("Authorization", `Bearer ${token}`);

      registrationId = response.body.data.registration.id;
    });

    test("should cancel registration successfully", async () => {
      const response = await request(app)
        .delete(`/api/registrations/${registrationId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
