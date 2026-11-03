
"use strict";

const path = require("path");

// Load .env from the main project folder
require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const express = require("express");
const mysql = require("mysql2");

const {
    validateEvent,
    validateRegistration,
    normalizeStatus
} = require("./lib/event-validation");

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345678";

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve HTML, CSS, JavaScript and images
// backend/app.js -> ../frontend
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(express.static(frontendPath));

// ========================================
// MYSQL DATABASE CONNECTION POOL
// ========================================

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "event",
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verify initial pool connection
db.getConnection(function (error, connection) {
    if (error) {
        console.error(
            "MySQL connection pool failed to initialize:",
            error.message
        );
        console.error(
            "Please verify that MySQL is running and your .env credentials match."
        );
        return;
    }

    console.log("Connected to MySQL database pool successfully.");

    // Ensure event_registrations table exists
    const initRegistrationsTable = `
        CREATE TABLE IF NOT EXISTS event_registrations (
            registration_id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            student_name VARCHAR(120) NOT NULL,
            roll_number VARCHAR(50) NOT NULL,
            email VARCHAR(120) NOT NULL,
            department VARCHAR(100) NOT NULL,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id)
                REFERENCES events(event_id)
                ON DELETE CASCADE
        )
    `;

    connection.query(initRegistrationsTable, function (err) {
        connection.release();

        if (err) {
            console.warn(
                "Could not auto-create event_registrations table:",
                err.message
            );
        } else {
            console.log("Event registrations schema ready.");
        }
    });
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function getEventValues(data) {
    return [
        String(data.event_name).trim(),
        String(data.event_type).trim(),
        data.event_date,
        data.event_time ? String(data.event_time).trim() : null,
        String(data.event_venue).trim(),
        data.organizer ? String(data.organizer).trim() : null,
        data.description ? String(data.description).trim() : "",
        data.event_status
            ? normalizeStatus(data.event_status)
            : "Upcoming"
    ];
}

function handleDatabaseError(res, error) {
    console.error("Database error:", error.message);

    res.status(500).json({
        message: "A database error occurred. Please check the server logs."
    });
}

// ========================================
// HOME PAGE
// ========================================

app.get("/", function (req, res) {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ========================================
// ADMIN AUTHENTICATION
// POST /api/admin/login
// ========================================

app.post("/api/admin/login", function (req, res) {
    const password = req.body.password;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: "Password is required."
        });
    }

    if (String(password).trim() === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            message: "Admin login successful.",
            role: "admin",
            token:
                "admin_session_" +
                Buffer.from(ADMIN_PASSWORD)
                    .toString("base64")
                    .slice(0, 12)
        });
    }

    return res.status(401).json({
        success: false,
        message: "Incorrect administrator password."
    });
});

// ========================================
// GET ALL EVENTS
// GET /api/events
// ========================================

app.get("/api/events", function (req, res) {
    const sql = `
        SELECT
            e.event_id,
            e.event_name,
            e.event_type,
            DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
            TIME_FORMAT(e.event_time, '%H:%i:%s') AS event_time,
            e.event_venue,
            e.organizer,
            e.description,
            e.event_status,
            e.created_at,
            COUNT(r.registration_id) AS registration_count
        FROM events e
        LEFT JOIN event_registrations r
            ON e.event_id = r.event_id
        GROUP BY e.event_id
        ORDER BY e.event_date ASC, e.event_time ASC
    `;

    db.query(sql, function (error, results) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        res.json(results);
    });
});

// ========================================
// EXPORT EVENTS AS CSV
// GET /api/events/export/csv
// ========================================

app.get("/api/events/export/csv", function (req, res) {
    const sql = `
        SELECT
            event_id,
            event_name,
            event_type,
            DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
            TIME_FORMAT(event_time, '%H:%i') AS event_time,
            event_venue,
            organizer,
            event_status,
            description
        FROM events
        ORDER BY event_date ASC
    `;

    db.query(sql, function (error, results) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        const headers = [
            "ID",
            "Event Name",
            "Category",
            "Date",
            "Time",
            "Venue",
            "Organizer",
            "Status",
            "Description"
        ];

        const escapeCSV = (field) => {
            if (field === null || field === undefined) return '""';

            const str = String(field).replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = results.map(row => [
            row.event_id,
            escapeCSV(row.event_name),
            escapeCSV(row.event_type),
            row.event_date,
            row.event_time || "",
            escapeCSV(row.event_venue),
            escapeCSV(row.organizer || ""),
            escapeCSV(row.event_status),
            escapeCSV(row.description || "")
        ].join(","));

        const csvContent =
            "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="navya_college_events.csv"'
        );

        res.send(csvContent);
    });
});

// ========================================
// GET ONE EVENT
// GET /api/events/:id
// ========================================

app.get("/api/events/:id", function (req, res) {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Invalid event ID."
        });
    }

    const sql = `
        SELECT
            event_id,
            event_name,
            event_type,
            DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
            TIME_FORMAT(event_time, '%H:%i:%s') AS event_time,
            event_venue,
            organizer,
            description,
            event_status,
            created_at
        FROM events
        WHERE event_id = ?
    `;

    db.query(sql, [eventId], function (error, results) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Event not found."
            });
        }

        res.json(results[0]);
    });
});

// ========================================
// ADD A NEW EVENT
// POST /api/events
// ========================================

app.post("/api/events", function (req, res) {
    const data = req.body;
    const validationError = validateEvent(data);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const sql = `
        INSERT INTO events (
            event_name,
            event_type,
            event_date,
            event_time,
            event_venue,
            organizer,
            description,
            event_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, getEventValues(data), function (error, result) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        res.status(201).json({
            message: "Event added successfully.",
            event_id: result.insertId
        });
    });
});

// ========================================
// UPDATE AN EXISTING EVENT
// PUT /api/events/:id
// ========================================

app.put("/api/events/:id", function (req, res) {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Invalid event ID."
        });
    }

    const data = req.body;
    const validationError = validateEvent(data);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const sql = `
        UPDATE events
        SET
            event_name = ?,
            event_type = ?,
            event_date = ?,
            event_time = ?,
            event_venue = ?,
            organizer = ?,
            description = ?,
            event_status = ?
        WHERE event_id = ?
    `;

    const values = [...getEventValues(data), eventId];

    db.query(sql, values, function (error, result) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found."
            });
        }

        res.json({
            message: "Event updated successfully."
        });
    });
});

// ========================================
// DELETE AN EVENT
// DELETE /api/events/:id
// ========================================

app.delete("/api/events/:id", function (req, res) {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Invalid event ID."
        });
    }

    const sql = "DELETE FROM events WHERE event_id = ?";

    db.query(sql, [eventId], function (error, result) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Event not found."
            });
        }

        res.json({
            message: "Event deleted successfully."
        });
    });
});

// ========================================
// STUDENT REGISTRATION / RSVP
// POST /api/events/:id/register
// ========================================

app.post("/api/events/:id/register", function (req, res) {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Invalid event ID."
        });
    }

    const data = req.body;
    const validationError = validateRegistration(data);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    // Verify event exists first
    db.query(
        "SELECT event_name FROM events WHERE event_id = ?",
        [eventId],
        function (err, results) {
            if (err) return handleDatabaseError(res, err);

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Event not found."
                });
            }

            const eventName = results[0].event_name;

            // Prevent duplicate registrations
            const checkSql = `
                SELECT registration_id
                FROM event_registrations
                WHERE event_id = ?
                AND (roll_number = ? OR email = ?)
            `;

            db.query(
                checkSql,
                [
                    eventId,
                    data.roll_number.trim(),
                    data.email.trim()
                ],
                function (checkErr, checkResults) {
                    if (checkErr) {
                        return handleDatabaseError(res, checkErr);
                    }

                    if (checkResults.length > 0) {
                        return res.status(409).json({
                            message:
                                "You are already registered for this event."
                        });
                    }

                    const insertSql = `
                        INSERT INTO event_registrations (
                            event_id,
                            student_name,
                            roll_number,
                            email,
                            department
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;

                    const insertValues = [
                        eventId,
                        data.student_name.trim(),
                        data.roll_number.trim(),
                        data.email.trim(),
                        data.department.trim()
                    ];

                    db.query(
                        insertSql,
                        insertValues,
                        function (insertErr, result) {
                            if (insertErr) {
                                return handleDatabaseError(
                                    res,
                                    insertErr
                                );
                            }

                            res.status(201).json({
                                message:
                                    `Registration confirmed for ${eventName}!`,
                                registration_id: result.insertId,
                                event_name: eventName
                            });
                        }
                    );
                }
            );
        }
    );
});

// ========================================
// GET REGISTRATIONS FOR AN EVENT
// GET /api/events/:id/registrations
// ========================================

app.get("/api/events/:id/registrations", function (req, res) {
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
            message: "Invalid event ID."
        });
    }

    const sql = `
        SELECT
            registration_id,
            student_name,
            roll_number,
            email,
            department,
            registered_at
        FROM event_registrations
        WHERE event_id = ?
        ORDER BY registered_at DESC
    `;

    db.query(sql, [eventId], function (error, results) {
        if (error) {
            return handleDatabaseError(res, error);
        }

        res.json(results);
    });
});

// ========================================
// EXPORT EVENT ATTENDEES AS CSV
// GET /api/events/:id/registrations/export/csv
// ========================================

app.get(
    "/api/events/:id/registrations/export/csv",
    function (req, res) {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                message: "Invalid event ID."
            });
        }

        db.query(
            "SELECT event_name FROM events WHERE event_id = ?",
            [eventId],
            function (err, eventRows) {
                if (err) return handleDatabaseError(res, err);

                if (eventRows.length === 0) {
                    return res.status(404).json({
                        message: "Event not found."
                    });
                }

                const eventName = eventRows[0].event_name;

                const sql = `
                    SELECT
                        registration_id,
                        student_name,
                        roll_number,
                        email,
                        department,
                        DATE_FORMAT(
                            registered_at,
                            '%Y-%m-%d %H:%i'
                        ) AS registered_at
                    FROM event_registrations
                    WHERE event_id = ?
                    ORDER BY registered_at ASC
                `;

                db.query(sql, [eventId], function (error, results) {
                    if (error) {
                        return handleDatabaseError(res, error);
                    }

                    const headers = [
                        "Reg ID",
                        "Student Name",
                        "Roll Number",
                        "Email Address",
                        "Department",
                        "Registration Time"
                    ];

                    const escapeCSV = (str) =>
                        `"${String(str ?? "").replace(/"/g, '""')}"`;

                    const rows = results.map(row => [
                        row.registration_id,
                        escapeCSV(row.student_name),
                        escapeCSV(row.roll_number),
                        escapeCSV(row.email),
                        escapeCSV(row.department),
                        escapeCSV(row.registered_at)
                    ].join(","));

                    const csvContent =
                        "\uFEFF" +
                        [headers.join(","), ...rows].join("\r\n");

                    const safeName = eventName
                        .replace(/[^a-zA-Z0-9_-]/g, "_")
                        .slice(0, 30);

                    res.setHeader(
                        "Content-Type",
                        "text/csv; charset=utf-8"
                    );

                    res.setHeader(
                        "Content-Disposition",
                        `attachment; filename="attendees_${safeName}.csv"`
                    );

                    res.send(csvContent);
                });
            }
        );
    }
);

// ========================================
// GET AGGREGATE SYSTEM STATISTICS
// GET /api/stats
// ========================================

app.get("/api/stats", function (req, res) {
    const sql = `
        SELECT
            COUNT(DISTINCT e.event_id) AS total_events,
            SUM(
                CASE
                    WHEN e.event_status = 'Upcoming' THEN 1
                    ELSE 0
                END
            ) AS upcoming_events,
            SUM(
                CASE
                    WHEN e.event_status = 'Ongoing' THEN 1
                    ELSE 0
                END
            ) AS ongoing_events,
            SUM(
                CASE
                    WHEN e.event_status = 'Completed' THEN 1
                    ELSE 0
                END
            ) AS completed_events,
            SUM(
                CASE
                    WHEN e.event_status = 'Cancelled' THEN 1
                    ELSE 0
                END
            ) AS cancelled_events,
            COUNT(r.registration_id) AS total_registrations
        FROM events e
        LEFT JOIN event_registrations r
            ON e.event_id = r.event_id
    `;

    db.query(sql, function (err, results) {
        if (err) return handleDatabaseError(res, err);

        const categorySql = `
            SELECT
                event_type,
                COUNT(*) AS count
            FROM events
            GROUP BY event_type
            ORDER BY count DESC
        `;

        db.query(categorySql, function (catErr, catResults) {
            if (catErr) {
                return handleDatabaseError(res, catErr);
            }

            res.json({
                overview: results[0] || {},
                categories: catResults || []
            });
        });
    });
});

// ========================================
// SEED DEMO EVENTS IF EMPTY
// POST /api/admin/seed
// ========================================

app.post("/api/admin/seed", function (req, res) {
    db.query(
        "SELECT COUNT(*) AS count FROM events",
        function (err, results) {
            if (err) return handleDatabaseError(res, err);

            if (results[0].count > 0) {
                return res.json({
                    success: false,
                    message:
                        "Database already contains events. Seed aborted to prevent duplicate records."
                });
            }

            const seedEvents = `
                INSERT INTO events (
                    event_name,
                    event_type,
                    event_date,
                    event_time,
                    event_venue,
                    organizer,
                    description,
                    event_status
                )
                VALUES
                (
                    'Navya Hackathon 2026',
                    'Competition',
                    DATE_ADD(CURDATE(), INTERVAL 5 DAY),
                    '09:30:00',
                    'Central Computing Center, Lab 3',
                    'Department of Computer Science',
                    'A 24-hour coding competition focused on AI, Web3, and smart campus IoT solutions.',
                    'Upcoming'
                ),
                (
                    'National Robotics Workshop',
                    'Workshop',
                    DATE_ADD(CURDATE(), INTERVAL 12 DAY),
                    '10:00:00',
                    'Mechanical Seminar Hall',
                    'Robotics & Automation Club',
                    'Hands-on practical session covering Arduino, sensor integration, and autonomous rover control.',
                    'Upcoming'
                ),
                (
                    'Tarang Annual Cultural Fest',
                    'Cultural',
                    DATE_ADD(CURDATE(), INTERVAL 20 DAY),
                    '16:00:00',
                    'College Open Air Auditorium',
                    'Student Cultural Council',
                    'A vibrant celebration of music, dance, dramatic arts, and campus talent with guest performances.',
                    'Upcoming'
                ),
                (
                    'AI & Cloud Computing Summit',
                    'Seminar',
                    DATE_ADD(CURDATE(), INTERVAL 2 DAY),
                    '11:00:00',
                    'Main Auditorium, Room 101',
                    'CSE & IT Departments',
                    'Keynote talks by industry experts on generative AI, cloud scalability, and modern career paths.',
                    'Upcoming'
                ),
                (
                    'Inter-Department Cricket Cup',
                    'Sports',
                    DATE_SUB(CURDATE(), INTERVAL 8 DAY),
                    '08:30:00',
                    'College Sports Ground',
                    'Physical Education Dept',
                    'Annual inter-departmental cricket championship with awards and certificates.',
                    'Completed'
                ),
                (
                    'Full-Stack Web Development Bootcamp',
                    'Workshop',
                    DATE_SUB(CURDATE(), INTERVAL 15 DAY),
                    '14:00:00',
                    'Seminar Hall B',
                    'Coding Club',
                    'Intensive front-end and back-end development session building real-world dynamic web applications.',
                    'Completed'
                )
            `;

            db.query(seedEvents, function (seedErr) {
                if (seedErr) {
                    return handleDatabaseError(res, seedErr);
                }

                res.json({
                    success: true,
                    message: "Demo events created successfully!"
                });
            });
        }
    );
});

// ========================================
// START THE SERVER
// ========================================

app.listen(PORT, function () {
    console.log(
        `Navya Event Management System is running at http://localhost:${PORT}`
    );
});
