import {
  createRegistrationRecord,
  getRegistrationById,
  getRegistrationsByEventId,
  getRegistrationsByUserId,
  findRegistration,
  cancelRegistration,
  isRegistrationOwner,
} from "../../src/services/registrationService.js";
import { createUserRecord } from "../../src/services/userService.js";
import { createEventRecord } from "../../src/services/eventService.js";
import { db } from "../../src/config/database.js";

describe("registrationService", () => {
  let testUser;
  let testEvent;

  beforeEach(() => {
    // 清空資料表
    db.prepare("DELETE FROM registrations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM users").run();

    // 建立測試資料
    testUser = createUserRecord({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    testEvent = createEventRecord({
      title: "Test Event",
      date: new Date().toISOString(),
      userId: testUser.id,
    });
  });

  it("should create registration successfully", () => {
    const registration = createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });

    expect(registration).toBeDefined();
    expect(registration.id).toBeDefined();
    expect(registration.eventId).toBe(testEvent.id);
    expect(registration.userId).toBe(testUser.id);
    expect(registration.status).toBe("registered");
  });

  it("should get registration by id", () => {
    const created = createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });

    const registration = getRegistrationById(created.id);

    expect(registration).toBeDefined();
    expect(registration.id).toBe(created.id);
  });

  it("should get registrations by event id", () => {
    const user2 = createUserRecord({
      username: "user2",
      email: "user2@example.com",
      password: "password123",
    });

    createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });
    createRegistrationRecord({
      eventId: testEvent.id,
      userId: user2.id,
    });

    const registrations = getRegistrationsByEventId(testEvent.id);

    expect(registrations).toHaveLength(2);
  });

  it("should get registrations by user id", () => {
    const event2 = createEventRecord({
      title: "Event 2",
      date: new Date().toISOString(),
      userId: testUser.id,
    });

    createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });
    createRegistrationRecord({
      eventId: event2.id,
      userId: testUser.id,
    });

    const registrations = getRegistrationsByUserId(testUser.id);

    expect(registrations).toHaveLength(2);
  });

  it("should find existing registration", () => {
    createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });

    const registration = findRegistration(testEvent.id, testUser.id);

    expect(registration).toBeDefined();
    expect(registration.eventId).toBe(testEvent.id);
  });

  it("should cancel registration successfully", () => {
    const registration = createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });

    const result = cancelRegistration(registration.id);

    expect(result).toBe(true);
    expect(getRegistrationById(registration.id)).toBeNull();
  });

  it("should verify registration ownership", () => {
    const registration = createRegistrationRecord({
      eventId: testEvent.id,
      userId: testUser.id,
    });

    expect(isRegistrationOwner(registration.id, testUser.id)).toBe(true);
    expect(isRegistrationOwner(registration.id, 9999)).toBe(false);
  });
});
