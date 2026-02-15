import {
  createEventRecord,
  getEventById,
  getAllEvents,
  updateEventRecord,
  deleteEventRecord,
  isEventOwner,
} from "../../src/services/eventService.js";
import { createUserRecord } from "../../src/services/userService.js";
import { db } from "../../src/config/database.js";

describe("eventService", () => {
  let testUser;

  beforeEach(() => {
    // 清空資料表（注意順序：先子表後父表以避免外鍵約束）
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();

    // 建立測試用戶
    testUser = createUserRecord({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should create event successfully", () => {
    const eventData = {
      title: "Test Event",
      description: "Test Description",
      date: new Date().toISOString(),
      location: "Test Location",
      userId: testUser.id,
    };

    const event = createEventRecord(eventData);

    expect(event).toBeDefined();
    expect(event.id).toBeDefined();
    expect(event.title).toBe(eventData.title);
    expect(event.userId).toBe(testUser.id);
  });

  it("should get event by id", () => {
    const eventData = {
      title: "Test Event",
      date: new Date().toISOString(),
      userId: testUser.id,
    };
    const createdEvent = createEventRecord(eventData);

    const event = getEventById(createdEvent.id);

    expect(event).toBeDefined();
    expect(event.id).toBe(createdEvent.id);
  });

  it("should get all events", () => {
    createEventRecord({
      title: "Event 1",
      date: new Date().toISOString(),
      userId: testUser.id,
    });
    createEventRecord({
      title: "Event 2",
      date: new Date().toISOString(),
      userId: testUser.id,
    });

    const events = getAllEvents();

    expect(events).toHaveLength(2);
  });

  it("should update event successfully", () => {
    const event = createEventRecord({
      title: "Original Title",
      date: new Date().toISOString(),
      userId: testUser.id,
    });

    const updated = updateEventRecord(event.id, {
      title: "Updated Title",
      description: "Updated Description",
      date: event.date,
      location: "Updated Location",
    });

    expect(updated.title).toBe("Updated Title");
  });

  it("should delete event successfully", () => {
    const event = createEventRecord({
      title: "Test Event",
      date: new Date().toISOString(),
      userId: testUser.id,
    });

    const result = deleteEventRecord(event.id);

    expect(result).toBe(true);
    expect(getEventById(event.id)).toBeNull();
  });

  it("should verify event ownership", () => {
    const event = createEventRecord({
      title: "Test Event",
      date: new Date().toISOString(),
      userId: testUser.id,
    });

    expect(isEventOwner(event.id, testUser.id)).toBe(true);
    expect(isEventOwner(event.id, 9999)).toBe(false);
  });
});
