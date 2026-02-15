import request from "supertest";
import app from "../../app.js";
import { db } from "../../src/config/database.js";

describe("eventController", () => {
  let token;
  let userId;

  beforeEach(async () => {
    // 清空資料表（注意順序：先子表後父表以避免外鍵約束）
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();

    // 註冊並登入用戶
    const response = await request(app).post("/api/users/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    token = response.body.data.token;
    userId = response.body.data.user.id;
  });

  describe("POST /api/events", () => {
    test("should create an event successfully", async () => {
      const eventData = {
        title: "Test Event",
        description: "Test Description",
        date: new Date().toISOString(),
        location: "Test Location",
      };

      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event).toBeDefined();
      expect(response.body.data.event.title).toBe(eventData.title);
    });

    test("should reject unauthorized request", async () => {
      const eventData = {
        title: "Test Event",
        date: new Date().toISOString(),
      };

      await request(app).post("/api/events").send(eventData).expect(401);
    });
  });

  describe("GET /api/events", () => {
    beforeEach(async () => {
      // 建立一些測試事件
      await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Event 1",
          date: new Date().toISOString(),
        });

      await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Event 2",
          date: new Date().toISOString(),
        });
    });

    test("should get all events", async () => {
      const response = await request(app)
        .get("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /api/events/:id", () => {
    let eventId;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test Event",
          date: new Date().toISOString(),
        });

      eventId = response.body.data.event.id;
    });

    test("should get event by id", async () => {
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.id).toBe(eventId);
    });

    test("should return 404 for non-existent event", async () => {
      await request(app)
        .get("/api/events/9999")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });
  });

  describe("PUT /api/events/:id", () => {
    let eventId;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Original Title",
          date: new Date().toISOString(),
        });

      eventId = response.body.data.event.id;
    });

    test("should update own event", async () => {
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
          date: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/events/:id", () => {
    let eventId;

    beforeEach(async () => {
      const response = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test Event",
          date: new Date().toISOString(),
        });

      eventId = response.body.data.event.id;
    });

    test("should delete own event", async () => {
      const response = await request(app)
        .delete(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
