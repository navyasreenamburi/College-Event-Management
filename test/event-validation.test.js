"use strict";

const test = require("node:test");
const assert = require("node:assert");
const {
    validateEvent,
    validateRegistration,
    isValidDate,
    isValidTime,
    isValidEmail,
    normalizeStatus
} = require("../lib/event-validation");

test("normalizeStatus should normalize casing and fallback to Upcoming", () => {
    assert.strictEqual(normalizeStatus("completed"), "Completed");
    assert.strictEqual(normalizeStatus("COMPLETED"), "Completed");
    assert.strictEqual(normalizeStatus("ongoing"), "Ongoing");
    assert.strictEqual(normalizeStatus("cancelled"), "Cancelled");
    assert.strictEqual(normalizeStatus("canceled"), "Cancelled");
    assert.strictEqual(normalizeStatus("unknown"), "Upcoming");
    assert.strictEqual(normalizeStatus(null), "Upcoming");
});

test("isValidDate validates YYYY-MM-DD correctly", () => {
    assert.strictEqual(isValidDate("2026-11-15"), true);
    assert.strictEqual(isValidDate("2026-02-28"), true);
    assert.strictEqual(isValidDate("invalid-date"), false);
    assert.strictEqual(isValidDate("15-11-2026"), false);
    assert.strictEqual(isValidDate("2026-13-01"), false);
    assert.strictEqual(isValidDate("2026-04-31"), false); // April has 30 days
});

test("isValidTime validates HH:MM and optional times", () => {
    assert.strictEqual(isValidTime(""), true);
    assert.strictEqual(isValidTime(null), true);
    assert.strictEqual(isValidTime("09:30"), true);
    assert.strictEqual(isValidTime("14:45:00"), true);
    assert.strictEqual(isValidTime("25:00"), false);
    assert.strictEqual(isValidTime("12:65"), false);
    assert.strictEqual(isValidTime("not-a-time"), false);
});

test("isValidEmail validates basic email structure", () => {
    assert.strictEqual(isValidEmail("student@navyacollege.ac.in"), true);
    assert.strictEqual(isValidEmail("invalid-email"), false);
    assert.strictEqual(isValidEmail("@navyacollege.ac.in"), false);
    assert.strictEqual(isValidEmail("student@"), false);
});

test("validateEvent accepts valid event data", () => {
    const validData = {
        event_name: "Annual Hackathon 2026",
        event_type: "Technical Fest",
        event_date: "2026-12-10",
        event_time: "10:00",
        event_venue: "Auditorium Hall A",
        organizer: "CSE Department",
        description: "24-hour coding competition",
        event_status: "Upcoming"
    };

    assert.strictEqual(validateEvent(validData), null);
});

test("validateEvent permits optional time and organizer", () => {
    const minimalData = {
        event_name: "Freshers Orientation",
        event_type: "Cultural",
        event_date: "2026-08-20",
        event_venue: "Main Amphitheater"
    };

    assert.strictEqual(validateEvent(minimalData), null);
});

test("validateEvent rejects missing required fields", () => {
    assert.ok(validateEvent(null));
    assert.match(validateEvent({}), /Event name is required/);
    assert.match(
        validateEvent({ event_name: "Test" }),
        /Event type is required/
    );
    assert.match(
        validateEvent({ event_name: "Test", event_type: "Cultural" }),
        /Event date is required/
    );
    assert.match(
        validateEvent({
            event_name: "Test",
            event_type: "Cultural",
            event_date: "2026-10-10"
        }),
        /Event venue is required/
    );
});

test("validateRegistration validates student registrations", () => {
    const valid = {
        student_name: "Priya Sharma",
        roll_number: "2201A0501",
        email: "priya@navyacollege.ac.in",
        department: "Computer Science"
    };
    assert.strictEqual(validateRegistration(valid), null);

    assert.match(
        validateRegistration({ ...valid, student_name: "" }),
        /Student name is required/
    );
    assert.match(
        validateRegistration({ ...valid, email: "invalid" }),
        /valid email address/
    );
});
