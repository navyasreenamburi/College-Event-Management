# Navya College Event Management System

A modern, full-stack campus event management application built with **Node.js**, **Express**, **MySQL**, and **Vanilla Web Technologies** (HTML5, modern CSS3 with glassmorphism, responsive drawer navigation, and clean ES6+ JavaScript).

---

## 🌟 Key Features

* **Interactive Dashboard:** Live event counters, quick action panels, recent event activity, and a **real-time countdown timer** ticking down to the next upcoming campus event.
* **Event Directory & Management:** Complete CRUD system to create, browse, edit, and delete college activities with instant multi-field search and status filtering (Upcoming, Ongoing, Completed, Cancelled).
* **Student RSVP & Registration:** Students can RSVP to upcoming college events with their name, roll number, email, and department; registrations are tracked in real-time.
* **Export to CSV:** One-click download of all campus events in Excel-compatible UTF-8 CSV format for easy reporting and archiving.
* **Event Calendar:** Date-organized timeline view of scheduled campus programs.
* **Reports & Analytics:** Visual percentage breakdown and progress bars showing the distribution of campus activities.
* **Administrator Security:** Protected administrative operations with configurable credentials and session management.
* **Fully Responsive:** Custom mobile navigation topbar with animated drawer menu for smartphones and tablets.
* **Automated Unit Testing:** Built-in test suite verifying data validation and formatting logic.

---

## 🛠️ Technology Stack

* **Backend:** Node.js, Express.js
* **Database:** MySQL (using `mysql2` connection pooling)
* **Configuration:** `dotenv` environment variable management
* **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Design System with responsive breakpoints and glassmorphism), ES6+ JavaScript
* **Testing:** Node.js native test runner (`node:test`, `node:assert`)

---

## 📋 Prerequisites

* **Node.js** v18.0.0 or higher
* **MySQL** Server 8.0 or compatible (e.g. MariaDB / XAMPP)

---

## 🚀 Getting Started

### 1. Clone or Open the Workspace

```bash
cd d:/NavyaCollegeEventManagement
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. Start your local MySQL service.
2. Import the database schema from `schema.sql`:

```bash
mysql -u root -p < schema.sql
```

*(Or open your MySQL client, such as MySQL Workbench or phpMyAdmin, and run the queries inside `schema.sql`)*

### 4. Configure Environment Variables

Create a `.env` file in the project root (or copy from `.env.example`):

```ini
# Server Port
PORT=3000

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=navya_event_management

# Administrator Access Password
ADMIN_PASSWORD=admin12345678
```

### 5. Run the Application

```bash
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Running Unit Tests

Run the native unit test suite:

```bash
npm test
```

This validates all event schemas, input formatting, date/time parsers, and registration checks.

---

## 📂 Project Structure

```
NavyaCollegeEventManagement/
├── .env.example              # Template environment variables
├── .env                      # Local configuration (git-ignored)
├── package.json              # Project dependencies and npm scripts
├── schema.sql                # MySQL database schema (events & registrations)
├── app.js                    # Express application and RESTful API endpoints
├── lib/
│   └── event-validation.js   # Event & registration validation module
├── test/
│   └── event-validation.test.js # Unit tests for validation logic
├── public/
│   ├── index.html            # Main dashboard & live countdown
│   ├── events.html           # Event directory with search & CSV export
│   ├── add-event.html        # Add / Edit event form
│   ├── calendar.html         # Date-wise event schedule
│   ├── reports.html          # Statistics and analytics
│   ├── about.html            # Campus info & contact details
│   ├── admin-login.html      # Administrator sign-in
│   ├── script.js             # Client-side logic & API integration
│   ├── style.css             # Design tokens, responsive styles & animations
│   └── images/               # Campus assets and logos
└── README.md                 # Project documentation
```

---

## 🔐 Administrator Access

* Default setup password: `admin12345678`
* Access can be customized at any time by updating `ADMIN_PASSWORD` in your `.env` file.
