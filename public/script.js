"use strict";

/* =========================================
   NAVYA COLLEGE EVENT MANAGEMENT SYSTEM
   Frontend JavaScript — Premium Edition
   ========================================= */

const API_URL = "/api/events";

let allEvents = [];
let countdownInterval = null;

/* ---------- General Helper Functions ---------- */

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function formatDate(dateValue) {
    if (!dateValue) return "Not specified";

    const date = new Date(String(dateValue).slice(0, 10) + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTime(timeValue) {
    if (!timeValue) return "Not specified";

    const time = String(timeValue);
    const match = time.match(/^(\d{1,2}):(\d{2})/);

    if (!match) return time;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

/* ---------- Admin Session Management ---------- */

const ADMIN_STORAGE_KEY = "navya_college_admin_session";

function isAdminLoggedIn() {
    try {
        const session = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (!session) return false;
        const parsed = JSON.parse(session);
        // Valid for 7 days
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        return parsed && parsed.token && (Date.now() - parsed.time < maxAge);
    } catch {
        return false;
    }
}

function setAdminSession(token) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({
        token: token || "active",
        time: Date.now()
    }));
    updateAdminUI();
}

function clearAdminSession() {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    updateAdminUI();
}

function updateAdminUI() {
    const isLoggedIn = isAdminLoggedIn();

    // Update session indicator in sidebar
    const adminLink = document.querySelector('a[data-admin-nav]');
    if (adminLink) {
        if (isLoggedIn) {
            adminLink.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin (Active)
            `;
            adminLink.style.color = "#34d399";
        } else {
            adminLink.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Admin Sign In
            `;
            adminLink.style.color = "";
        }
    }

    // Update admin login page elements if present
    const sessionStatus = getElement("sessionStatus");
    const logoutButton = getElement("logoutButton");
    const adminLoginForm = getElement("adminLoginForm");

    if (sessionStatus && document.body.dataset.page === "admin-login") {
        if (isLoggedIn) {
            sessionStatus.textContent = "You are currently signed in with administrator privileges.";
            sessionStatus.className = "message success";
            sessionStatus.style.display = "block";
            if (logoutButton) logoutButton.hidden = false;
        } else {
            sessionStatus.textContent = "";
            sessionStatus.style.display = "none";
            if (logoutButton) logoutButton.hidden = true;
        }
    }
}

/* ---------- Toast Notification System ---------- */

function showToast(title, message, type = "success") {
    let container = document.getElementById("toastContainer");

    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let iconSvg = "";
    if (type === "success") {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === "error") {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-body">
            <div class="toast-title">${escapeHTML(title)}</div>
            <div class="toast-text">${escapeHTML(message)}</div>
        </div>
        <button class="toast-close" type="button" aria-label="Close notification">&times;</button>
        <div class="toast-timer"></div>
    `;

    container.appendChild(toast);

    function closeToast() {
        toast.classList.add("hiding");
        setTimeout(function () {
            toast.remove();
        }, 260);
    }

    const closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) closeBtn.addEventListener("click", closeToast);

    setTimeout(closeToast, 3800);
}

function showMessage(message, type = "success") {
    const messageElement = getElement("message");

    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = "message " + type;
        messageElement.style.display = "block";
    }

    const title = type === "success" ? "Success" : type === "error" ? "Notice" : "Information";
    showToast(title, message, type);
}

function clearMessage() {
    const messageElement = getElement("message");

    if (!messageElement) return;

    messageElement.textContent = "";
    messageElement.className = "message";
    messageElement.style.display = "none";
}

/* ---------- Smooth Number Counter Animation ---------- */

function animateNumber(element, target, duration = 850) {
    if (!element) return;
    const targetNum = Number(target) || 0;
    if (targetNum === 0) {
        element.textContent = "0";
        return;
    }

    const startTime = performance.now();
    const startVal = 0;

    function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * (targetNum - startVal) + startVal);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            element.textContent = targetNum;
        }
    }

    requestAnimationFrame(frame);
}

function normalizeStatus(status) {
    const value = String(status || "Upcoming").trim().toLowerCase();

    if (value === "completed") return "Completed";
    if (value === "ongoing") return "Ongoing";
    if (value === "cancelled" || value === "canceled") return "Cancelled";

    return "Upcoming";
}

function getEventId(event) {
    return event.event_id ?? event.id;
}

/* ---------- API Functions ---------- */

async function fetchEvents() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("Unable to load events from the server.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected event list.");
    }

    return data;
}

async function refreshEvents() {
    try {
        allEvents = await fetchEvents();

        renderDashboard();
        renderNextEventCountdown();
        renderEventsTable();
        renderCalendar();
        renderReports();

    } catch (error) {
        console.error("Event loading error:", error);

        const page = document.body.dataset.page;

        if (page === "events") {
            const body = getElement("eventsTableBody");

            if (body) {
                body.innerHTML = `
                    <tr>
                        <td colspan="10" class="empty-state">
                            Could not load events. Check your server
                            and database connection, then refresh.
                        </td>
                    </tr>
                `;
            }
        }

        if (page === "dashboard") {
            const list = getElement("dashboardEvents");

            if (list) {
                list.innerHTML = `
                    <p class="muted">
                        Unable to load events. Please check the server.
                    </p>
                `;
            }
        }

        if (page === "calendar") {
            const list = getElement("calendarEvents");

            if (list) {
                list.innerHTML = `
                    <p class="muted">
                        Unable to load calendar events. Please try again.
                    </p>
                `;
            }
        }

        if (page === "reports") {
            const summary = getElement("reportSummary");

            if (summary) {
                summary.innerHTML = `
                    <p class="muted">
                        Unable to load report data. Please check the server.
                    </p>
                `;
            }
        }

        showMessage(
            "Unable to load events. Check that Node.js and MySQL are running.",
            "error"
        );
    }
}

/* ---------- Next Upcoming Event Countdown ---------- */

function renderNextEventCountdown() {
    const container = getElement("nextEventSection");
    if (!container) return;

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Find upcoming events sorted by date & time
    const upcomingList = allEvents
        .filter(e => {
            const st = normalizeStatus(e.event_status);
            return (st === "Upcoming" || st === "Ongoing") && String(e.event_date) >= todayStr;
        })
        .sort((a, b) => {
            const dtA = `${a.event_date}T${a.event_time || "00:00:00"}`;
            const dtB = `${b.event_date}T${b.event_time || "00:00:00"}`;
            return dtA.localeCompare(dtB);
        });

    if (upcomingList.length === 0) {
        container.style.display = "none";
        return;
    }

    const targetEvent = upcomingList[0];
    const targetDateStr = `${targetEvent.event_date}T${targetEvent.event_time ? targetEvent.event_time.slice(0, 5) + ":00" : "09:00:00"}`;
    const targetTime = new Date(targetDateStr).getTime();

    container.style.display = "block";
    container.innerHTML = `
        <div class="countdown-widget">
            <div class="countdown-content">
                <span class="eyebrow" style="color:#a5b4fc;">NEXT CAMPUS EVENT</span>
                <h3>${escapeHTML(targetEvent.event_name)}</h3>
                <p>
                    📅 ${escapeHTML(formatDate(targetEvent.event_date))} ·
                    ⏰ ${escapeHTML(formatTime(targetEvent.event_time))} ·
                    📍 ${escapeHTML(targetEvent.event_venue || "Campus")}
                </p>
            </div>
            <div class="countdown-timer">
                <div class="countdown-box">
                    <span class="countdown-num" id="cdDays">00</span>
                    <span class="countdown-lbl">Days</span>
                </div>
                <div class="countdown-box">
                    <span class="countdown-num" id="cdHours">00</span>
                    <span class="countdown-lbl">Hours</span>
                </div>
                <div class="countdown-box">
                    <span class="countdown-num" id="cdMinutes">00</span>
                    <span class="countdown-lbl">Mins</span>
                </div>
                <div class="countdown-box">
                    <span class="countdown-num" id="cdSeconds">00</span>
                    <span class="countdown-lbl">Secs</span>
                </div>
            </div>
        </div>
    `;

    function updateTimer() {
        const diff = targetTime - Date.now();

        if (diff <= 0) {
            const box = container.querySelector(".countdown-timer");
            if (box) {
                box.innerHTML = `<span class="badge success" style="font-size:14px;padding:8px 14px;">Happening Today!</span>`;
            }
            if (countdownInterval) clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const elDays = getElement("cdDays");
        const elHours = getElement("cdHours");
        const elMins = getElement("cdMinutes");
        const elSecs = getElement("cdSeconds");

        if (elDays) elDays.textContent = String(days).padStart(2, "0");
        if (elHours) elHours.textContent = String(hours).padStart(2, "0");
        if (elMins) elMins.textContent = String(minutes).padStart(2, "0");
        if (elSecs) elSecs.textContent = String(seconds).padStart(2, "0");
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

/* ---------- Dashboard ---------- */

function renderStatistics() {
    const total = allEvents.length;

    const upcoming = allEvents.filter(function (event) {
        return normalizeStatus(event.event_status) === "Upcoming";
    }).length;

    const completed = allEvents.filter(function (event) {
        return normalizeStatus(event.event_status) === "Completed";
    }).length;

    animateNumber(getElement("totalEvents"), total);
    animateNumber(getElement("upcomingEvents"), upcoming);
    animateNumber(getElement("completedEvents"), completed);
}

function renderDashboard() {
    renderStatistics();

    const container = getElement("dashboardEvents");

    if (!container) return;

    const sortedEvents = [...allEvents].sort(function (a, b) {
        return String(b.created_at || b.event_date || "")
            .localeCompare(String(a.created_at || a.event_date || ""));
    });

    const recentEvents = sortedEvents.slice(0, 5);

    if (recentEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No events yet</h3>
                <p>Add your first college event to see it here.</p>
                <a class="button primary" href="add-event.html">
                    Create First Event
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = recentEvents.map(function (event, index) {
        const status = normalizeStatus(event.event_status);

        return `
            <article class="dashboard-event" style="animation: fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${index * 0.05}s;">
                <div class="dashboard-event-date">
                    <span>${escapeHTML(formatDate(event.event_date))}</span>
                </div>

                <div class="dashboard-event-details">
                    <h3>${escapeHTML(event.event_name)}</h3>
                    <p class="muted">
                        ${escapeHTML(event.event_venue || "Venue not specified")}
                        ·
                        ${escapeHTML(event.organizer || "Organizer not specified")}
                    </p>
                </div>

                <span class="status-badge ${status.toLowerCase()}">
                    ${escapeHTML(status)}
                </span>
            </article>
        `;
    }).join("");
}

/* ---------- All Events Table ---------- */

function renderEventsTable() {
    const tableBody = getElement("eventsTableBody");

    if (!tableBody) return;

    const searchInput = getElement("searchInput");
    const statusFilter = getElement("statusFilter");

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedStatus = statusFilter
        ? statusFilter.value.toLowerCase()
        : "";

    const filteredEvents = allEvents.filter(function (event) {
        const searchableText = [
            event.event_name,
            event.event_type,
            event.event_venue,
            event.organizer,
            event.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);
        const status = normalizeStatus(event.event_status).toLowerCase();
        const matchesStatus = !selectedStatus || status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredEvents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    No matching events found.
                </td>
            </tr>
        `;
        return;
    }

    const admin = isAdminLoggedIn();

    tableBody.innerHTML = filteredEvents.map(function (event, index) {
        const id = getEventId(event);
        const serialNo = index + 1;
        const status = normalizeStatus(event.event_status);
        const rsvpCount = Number(event.registration_count) || 0;
        const canRegister = status === "Upcoming" || status === "Ongoing";

        return `
            <tr style="animation: fadeSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${Math.min(index * 0.035, 0.35)}s;">
                <td style="font-weight:700;color:var(--muted);">${serialNo}</td>

                <td>
                    <strong>${escapeHTML(event.event_name)}</strong>
                </td>

                <td>${escapeHTML(event.event_type || "General")}</td>

                <td>${escapeHTML(formatDate(event.event_date))}</td>

                <td>${escapeHTML(formatTime(event.event_time))}</td>

                <td>${escapeHTML(event.event_venue || "Not specified")}</td>

                <td>${escapeHTML(event.organizer || "Not specified")}</td>

                <td>
                    <span class="status-badge ${status.toLowerCase()}">
                        ${escapeHTML(status)}
                    </span>
                </td>

                <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="badge info" style="font-size:11px;" title="${rsvpCount} students registered">
                            ${rsvpCount}
                        </span>
                        ${canRegister ? `
                            <button
                                class="button small primary"
                                type="button"
                                data-action="rsvp"
                                data-id="${escapeHTML(id)}"
                                data-name="${escapeHTML(event.event_name)}"
                                style="padding:3px 8px;font-size:11px;"
                            >
                                Register
                            </button>
                        ` : '<span style="color:var(--muted);font-size:11px;">Closed</span>'}
                    </div>
                </td>

                <td>
                    <div class="table-actions">
                        <button
                            class="button small secondary"
                            type="button"
                            data-action="edit"
                            data-id="${escapeHTML(id)}"
                            title="${admin ? 'Edit event' : 'Admin login required'}"
                        >
                            Edit
                        </button>

                        <button
                            class="button small danger"
                            type="button"
                            data-action="delete"
                            data-id="${escapeHTML(id)}"
                            title="${admin ? 'Delete event' : 'Admin login required'}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function setupEventFilters() {
    const searchInput = getElement("searchInput");
    const statusFilter = getElement("statusFilter");

    if (searchInput) {
        searchInput.addEventListener("input", renderEventsTable);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderEventsTable);
    }

    const tableBody = getElement("eventsTableBody");

    if (tableBody) {
        tableBody.addEventListener("click", async function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const id = button.dataset.id;
            const action = button.dataset.action;

            if (action === "rsvp") {
                const eventName = button.dataset.name || "Event";
                openRegistrationModal(id, eventName);
                return;
            }

            // Edit & Delete actions
            if (action === "edit" || action === "delete") {
                if (!isAdminLoggedIn()) {
                    showToast(
                        "Admin Access Required",
                        "Please sign in with administrator credentials to edit or delete events.",
                        "error"
                    );
                    setTimeout(() => {
                        window.location.href = "admin-login.html";
                    }, 1200);
                    return;
                }

                if (action === "edit") {
                    window.location.href = "add-event.html?edit=" + encodeURIComponent(id);
                }

                if (action === "delete") {
                    await deleteEvent(id);
                }
            }
        });
    }
}

/* ---------- Student RSVP / Event Registration Modal ---------- */

function openRegistrationModal(eventId, eventName) {
    let backdrop = getElement("rsvpModalBackdrop");
    if (backdrop) backdrop.remove();

    backdrop = document.createElement("div");
    backdrop.id = "rsvpModalBackdrop";
    backdrop.className = "modal-backdrop";

    backdrop.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <span class="eyebrow" style="margin-bottom:2px;display:block;">STUDENT RSVP</span>
                    <h3>Register for Event</h3>
                </div>
                <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Close dialog">&times;</button>
            </div>
            <form id="rsvpForm" class="modal-body">
                <p style="margin-bottom:16px;font-size:13px;color:var(--text-2);">
                    Registering for: <strong style="color:var(--primary);">${escapeHTML(eventName)}</strong>
                </p>
                <label>
                    Full Name *
                    <input type="text" name="student_name" placeholder="e.g. Priya Sharma" maxlength="120" required>
                </label>
                <label>
                    Roll Number / Student ID *
                    <input type="text" name="roll_number" placeholder="e.g. 2201A0501" maxlength="50" required>
                </label>
                <label>
                    College Email *
                    <input type="email" name="email" placeholder="e.g. student@navyacollege.ac.in" maxlength="120" required>
                </label>
                <label>
                    Department *
                    <select name="department" required>
                        <option value="">Select your department</option>
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Management Studies">Management Studies</option>
                        <option value="Other">Other</option>
                    </select>
                </label>
                <p id="rsvpMessage" class="message" style="display:none;"></p>
                <div class="modal-actions">
                    <button type="button" class="button secondary" id="modalCancelBtn">Cancel</button>
                    <button type="submit" class="button primary">Confirm Registration</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(backdrop);

    function closeModal() {
        backdrop.remove();
    }

    getElement("modalCloseBtn").addEventListener("click", closeModal);
    getElement("modalCancelBtn").addEventListener("click", closeModal);

    backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) closeModal();
    });

    const form = getElement("rsvpForm");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const rsvpMsg = getElement("rsvpMessage");
        rsvpMsg.style.display = "none";

        const formData = new FormData(form);
        const payload = {
            student_name: formData.get("student_name").trim(),
            roll_number: formData.get("roll_number").trim(),
            email: formData.get("email").trim(),
            department: formData.get("department").trim()
        };

        try {
            const resp = await fetch(`${API_URL}/${encodeURIComponent(eventId)}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await resp.json().catch(() => ({}));

            if (!resp.ok) {
                throw new Error(result.message || "Unable to complete registration.");
            }

            closeModal();
            showToast("Registration Confirmed!", `You are registered for ${eventName}`, "success");
            await refreshEvents();

        } catch (err) {
            rsvpMsg.textContent = err.message;
            rsvpMsg.className = "message error";
            rsvpMsg.style.display = "block";
        }
    });
}

/* ---------- Add and Edit Event Form ---------- */

function setupEventForm() {
    const form = getElement("eventForm");

    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");

    if (editId) {
        // Enforce admin access for editing
        if (!isAdminLoggedIn()) {
            showToast("Admin Access Required", "Please sign in as admin to edit this event.", "error");
            setTimeout(() => {
                window.location.href = "admin-login.html";
            }, 1200);
            return;
        }

        const heading = document.querySelector(".page-header h1");
        if (heading) heading.textContent = "Edit Event";

        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

        if (submitButton) {
            if (submitButton.tagName === "INPUT") {
                submitButton.value = "Update Event";
            } else {
                submitButton.textContent = "Update Event";
            }
        }

        loadEventForEditing(editId);
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearMessage();

        const formData = new FormData(form);
        const eventData = {};

        for (const [key, value] of formData.entries()) {
            eventData[key] = value.trim();
        }

        // Required fields
        const requiredFields = [
            "event_name",
            "event_type",
            "event_date",
            "event_venue"
        ];

        for (const field of requiredFields) {
            if (!eventData[field]) {
                showMessage(`Please complete the ${field.replace('_', ' ')} field.`, "error");
                const input = form.elements.namedItem(field);
                if (input) input.focus();
                return;
            }
        }

        try {
            const url = editId
                ? `${API_URL}/${encodeURIComponent(editId)}`
                : API_URL;

            const response = await fetch(url, {
                method: editId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(eventData)
            });

            const result = await response.json().catch(function () {
                return {};
            });

            if (!response.ok) {
                throw new Error(
                    result.message || result.error || "Unable to save the event."
                );
            }

            showMessage(
                editId
                    ? "Event updated successfully!"
                    : "Event added successfully!",
                "success"
            );

            form.reset();

            setTimeout(() => {
                window.location.href = "events.html";
            }, 1000);

        } catch (error) {
            console.error("Saving event failed:", error);

            showMessage(
                error.message || "Unable to save the event. Please try again.",
                "error"
            );
        }
    });
}

async function loadEventForEditing(id) {
    try {
        const events = await fetchEvents();

        const event = events.find(function (item) {
            return String(getEventId(item)) === String(id);
        });

        if (!event) {
            showMessage("The requested event could not be found.", "error");
            return;
        }

        const form = getElement("eventForm");

        const fields = [
            "event_name",
            "event_type",
            "event_date",
            "event_time",
            "event_venue",
            "organizer",
            "description",
            "event_status"
        ];

        fields.forEach(function (field) {
            const input = form.elements.namedItem(field);

            if (!input) return;

            let value = event[field] ?? "";

            if (field === "event_date" && value) {
                value = String(value).slice(0, 10);
            }

            if (field === "event_time" && value) {
                value = String(value).slice(0, 5);
            }

            if (field === "event_status") {
                value = normalizeStatus(value);
            }

            input.value = value;
        });

    } catch (error) {
        console.error("Loading event for editing failed:", error);

        showMessage(
            "Unable to load this event. Please check the server.",
            "error"
        );
    }
}

/* ---------- Delete Event ---------- */

async function deleteEvent(id) {
    if (!isAdminLoggedIn()) {
        showToast("Admin Access Required", "Please sign in as admin to delete events.", "error");
        setTimeout(() => {
            window.location.href = "admin-login.html";
        }, 1200);
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        const result = await response.json().catch(function () {
            return {};
        });

        if (!response.ok) {
            throw new Error(
                result.message || result.error || "Unable to delete event."
            );
        }

        showMessage("Event deleted successfully!", "success");
        await refreshEvents();

    } catch (error) {
        console.error("Deleting event failed:", error);

        showMessage(
            error.message || "Unable to delete the event.",
            "error"
        );
    }
}

/* ---------- Event Calendar ---------- */

function renderCalendar() {
    const container = getElement("calendarEvents");

    if (!container) return;

    const sortedEvents = [...allEvents].sort(function (a, b) {
        const dateA = String(a.event_date || "");
        const dateB = String(b.event_date || "");
        return dateA.localeCompare(dateB);
    });

    if (sortedEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No scheduled events</h3>
                <p>Your events will appear here after you create them.</p>
                <a class="button primary" href="add-event.html">
                    Schedule an Event
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = sortedEvents.map(function (event, index) {
        const status = normalizeStatus(event.event_status);
        const id = getEventId(event);
        const canRegister = status === "Upcoming" || status === "Ongoing";

        return `
            <article class="calendar-event" style="animation: fadeSlideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${Math.min(index * 0.05, 0.4)}s;">
                <div class="calendar-date">
                    <span class="calendar-day">
                        ${escapeHTML(
                            event.event_date
                                ? String(event.event_date).slice(8, 10)
                                : "--"
                        )}
                    </span>
                    <span>${escapeHTML(formatDate(event.event_date))}</span>
                </div>

                <div class="calendar-event-details">
                    <h3>${escapeHTML(event.event_name)}</h3>
                    <p>${escapeHTML(event.event_type || "General")}</p>
                    <p class="muted">
                        ${escapeHTML(formatTime(event.event_time))}
                        ·
                        ${escapeHTML(event.event_venue || "Venue not specified")}
                    </p>
                    <p class="muted">
                        Organizer: ${escapeHTML(event.organizer || "Not specified")}
                    </p>
                </div>

                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <span class="status-badge ${status.toLowerCase()}">
                        ${escapeHTML(status)}
                    </span>
                    ${canRegister ? `
                        <button
                            class="button small secondary"
                            type="button"
                            onclick="openRegistrationModal('${escapeHTML(id)}', '${escapeHTML(event.event_name).replace(/'/g, "\\'")}')"
                            style="padding:3px 10px;font-size:11.5px;"
                        >
                            RSVP
                        </button>
                    ` : ''}
                </div>
            </article>
        `;
    }).join("");
}

/* ---------- Reports and Analysis ---------- */

function renderReports() {
    renderStatistics();

    const summary = getElement("reportSummary");

    if (!summary) return;

    const statuses = {
        Upcoming: 0,
        Ongoing: 0,
        Completed: 0,
        Cancelled: 0
    };

    allEvents.forEach(function (event) {
        const status = normalizeStatus(event.event_status);
        statuses[status]++;
    });

    const total = allEvents.length;

    function percentage(count) {
        return total === 0 ? 0 : Math.round((count / total) * 100);
    }

    const statusCards = Object.entries(statuses).map(function ([status, count], index) {
        const percent = percentage(count);

        return `
            <article class="report-status-card" style="animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: ${index * 0.08}s;">
                <div class="report-status-heading">
                    <span class="status-badge ${status.toLowerCase()}">
                        ${escapeHTML(status)}
                    </span>
                    <strong>${count}</strong>
                </div>

                <div class="progress-track">
                    <div
                        class="progress-fill ${status.toLowerCase()}"
                        style="width: ${percent}%;"
                    ></div>
                </div>

                <p class="muted">${percent}% of all recorded events</p>
            </article>
        `;
    }).join("");

    summary.innerHTML = `
        <div class="report-total" style="animation: fadeSlideUp 0.35s ease both;">
            <p class="muted">Total Recorded Events</p>
            <h3 id="reportTotalEvents">${total}</h3>
            <p>Based on the records currently stored in the database.</p>
        </div>

        <div class="report-status-grid">
            ${statusCards}
        </div>
    `;

    animateNumber(getElement("reportTotalEvents"), total);
}

/* ---------- Live Campus Header Widget ---------- */

function initLiveHeaderWidget() {
    const headers = document.querySelectorAll(".page-header");
    headers.forEach(function (header) {
        if (header.querySelector(".header-live-widget")) return;

        const widget = document.createElement("div");
        widget.className = "header-live-widget";
        widget.innerHTML = `
            <span class="header-live-dot" title="Campus Connection Active"></span>
            <span class="header-live-time">Campus System Active</span>
            <span class="header-live-pill">Live</span>
        `;

        const actionBtn = header.querySelector(".button, div");
        if (actionBtn) {
            header.insertBefore(widget, actionBtn);
        } else {
            header.appendChild(widget);
        }
    });

    function updateClocks() {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short"
        });
        const timeStr = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
        const text = `${dateStr} · ${timeStr}`;

        document.querySelectorAll(".header-live-widget .header-live-time").forEach(function (el) {
            el.textContent = text;
        });
    }

    updateClocks();
    setInterval(updateClocks, 1000);
}

/* ---------- Mobile Drawer Navigation Setup ---------- */

function setupMobileNavigation() {
    if (!document.querySelector(".mobile-topbar")) {
        const topbar = document.createElement("div");
        topbar.className = "mobile-topbar";
        topbar.innerHTML = `
            <a class="brand" href="index.html">
                <img src="images/navya-emblem.png" alt="Navya Logo">
                <span>Navya <small>Events</small></span>
            </a>
            <button class="hamburger-btn" id="mobileMenuBtn" aria-label="Toggle navigation menu" type="button">
                <span></span>
                <span></span>
                <span></span>
            </button>
        `;
        document.body.prepend(topbar);

        const backdrop = document.createElement("div");
        backdrop.id = "sidebarBackdrop";
        backdrop.className = "sidebar-backdrop";
        document.body.appendChild(backdrop);

        const sidebar = document.querySelector(".sidebar");
        const menuBtn = document.getElementById("mobileMenuBtn");

        function toggleSidebar(open) {
            if (!sidebar) return;
            const willOpen = open !== undefined ? open : !sidebar.classList.contains("open");
            sidebar.classList.toggle("open", willOpen);
            backdrop.classList.toggle("active", willOpen);
        }

        if (menuBtn) {
            menuBtn.addEventListener("click", () => toggleSidebar());
        }

        backdrop.addEventListener("click", () => toggleSidebar(false));

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => toggleSidebar(false));
        });
    }
}

/* ---------- Admin Login Page Handler ---------- */

function setupAdminAuth() {
    const loginForm = getElement("adminLoginForm");
    const logoutBtn = getElement("logoutButton");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            clearAdminSession();
            showToast("Signed Out", "You have signed out of administrator access.", "info");
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            clearMessage();

            const passwordInput = loginForm.elements.namedItem("password");
            const password = passwordInput ? passwordInput.value : "";

            if (!password) {
                showMessage("Please enter your administrator password.", "error");
                return;
            }

            try {
                const response = await fetch("/api/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Incorrect administrator password.");
                }

                setAdminSession(data.token);
                showToast("Welcome Administrator!", "Access granted. You can now create, edit and delete events.", "success");

                loginForm.reset();

                setTimeout(() => {
                    window.location.href = "events.html";
                }, 1200);

            } catch (err) {
                showMessage(err.message || "Login failed.", "error");
            }
        });
    }

    // Inject Admin nav link in sidebars if missing
    document.querySelectorAll(".sidebar-nav").forEach(navContainer => {
        if (!navContainer.querySelector("a[data-admin-nav]")) {
            const adminSection = document.createElement("div");
            adminSection.innerHTML = `
                <p class="nav-section-label" style="margin-top:14px;">Administrator</p>
                <nav class="navigation">
                    <a class="nav-link ${document.body.dataset.page === 'admin-login' ? 'active' : ''}" href="admin-login.html" data-admin-nav="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Admin Access
                    </a>
                </nav>
            `;
            navContainer.appendChild(adminSection);
        }
    });

    updateAdminUI();
}

/* ---------- Copy To Clipboard Helper ---------- */

function setupCopyButtons() {
    document.addEventListener("click", async function (event) {
        const btn = event.target.closest(".copy-pill-btn");
        if (!btn) return;

        const textToCopy = btn.dataset.copy;
        if (!textToCopy) return;

        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalHTML = btn.innerHTML;
            btn.classList.add("copied");
            btn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Copied!</span>
            `;

            showToast("Copied to Clipboard", textToCopy, "success");

            setTimeout(function () {
                btn.classList.remove("copied");
                btn.innerHTML = originalHTML;
            }, 2000);
        } catch (err) {
            console.error("Clipboard copy failed:", err);
            showToast("Copied", textToCopy, "info");
        }
    });
}

/* ---------- Initialize Website ---------- */

document.addEventListener("DOMContentLoaded", function () {
    setupMobileNavigation();
    initLiveHeaderWidget();
    setupAdminAuth();
    setupCopyButtons();
    setupEventFilters();
    setupEventForm();
    refreshEvents();
});
