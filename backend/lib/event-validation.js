"use strict";

const allowedStatuses = [
    "Upcoming",
    "Ongoing",
    "Completed",
    "Cancelled"
];

const allowedEventTypes = [
    "Competition",
    "Technical Fest",
    "Workshop",
    "Cultural",
    "Seminar",
    "Sports",
    "Other"
];

function normalizeStatus(status) {
    const value = String(status || "Upcoming").trim().toLowerCase();

    if (value === "completed") return "Completed";
    if (value === "ongoing") return "Ongoing";
    if (value === "cancelled" || value === "canceled") return "Cancelled";

    return "Upcoming";
}

function isValidDate(dateStr) {
    if (typeof dateStr !== "string") return false;
    const match = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr.trim());
    if (!match) return false;

    const [year, month, day] = dateStr.split("-").map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function isValidTime(timeStr) {
    if (!timeStr) return true; // Optional
    const trimmed = String(timeStr).trim();
    if (trimmed === "") return true;

    return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(trimmed);
}

function isValidEmail(email) {
    if (typeof email !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateEvent(data) {
    if (!data || typeof data !== "object") {
        return "Event data is required.";
    }

    const eventName = String(data.event_name ?? "").trim();
    if (!eventName) {
        return "Event name is required.";
    }
    if (eventName.length > 150) {
        return "Event name must be 150 characters or fewer.";
    }

    const eventType = String(data.event_type ?? "").trim();
    if (!eventType) {
        return "Event type is required.";
    }

    const eventDate = String(data.event_date ?? "").trim();
    if (!eventDate) {
        return "Event date is required.";
    }
    if (!isValidDate(eventDate)) {
        return "Please provide a valid event date in YYYY-MM-DD format.";
    }

    if (data.event_time && !isValidTime(data.event_time)) {
        return "Please provide a valid event time in HH:MM format.";
    }

    const eventVenue = String(data.event_venue ?? "").trim();
    if (!eventVenue) {
        return "Event venue is required.";
    }
    if (eventVenue.length > 200) {
        return "Event venue must be 200 characters or fewer.";
    }

    if (data.organizer && String(data.organizer).trim().length > 150) {
        return "Organizer name must be 150 characters or fewer.";
    }

    const status = data.event_status ? normalizeStatus(data.event_status) : "Upcoming";
    if (!allowedStatuses.includes(status)) {
        return "Invalid event status.";
    }

    return null;
}

function validateRegistration(data) {
    if (!data || typeof data !== "object") {
        return "Registration data is required.";
    }

    const name = String(data.student_name ?? "").trim();
    if (!name) {
        return "Student name is required.";
    }
    if (name.length > 120) {
        return "Student name must be 120 characters or fewer.";
    }

    const rollNo = String(data.roll_number ?? "").trim();
    if (!rollNo) {
        return "Roll number is required.";
    }

    const email = String(data.email ?? "").trim();
    if (!email) {
        return "Email address is required.";
    }
    if (!isValidEmail(email)) {
        return "Please enter a valid email address.";
    }

    const department = String(data.department ?? "").trim();
    if (!department) {
        return "Department is required.";
    }

    return null;
}

module.exports = {
    allowedStatuses,
    allowedEventTypes,
    normalizeStatus,
    isValidDate,
    isValidTime,
    isValidEmail,
    validateEvent,
    validateRegistration
};
