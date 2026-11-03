CREATE DATABASE IF NOT EXISTS navya_event_management;

USE navya_event_management;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(150) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NULL,
    event_venue VARCHAR(200) NOT NULL,
    organizer VARCHAR(150) NULL,
    description TEXT NULL,
    event_status VARCHAR(30) DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_name VARCHAR(120) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL,
    department VARCHAR(100) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- Sample Initial Events (Demo Seed Data)
INSERT IGNORE INTO events (event_id, event_name, event_type, event_date, event_time, event_venue, organizer, description, event_status) VALUES
(1, 'Navya Hackathon 2026', 'Competition', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:30:00', 'Central Computing Center, Lab 3', 'Department of Computer Science', 'A 24-hour coding competition focused on AI, Web3, and smart campus IoT solutions.', 'Upcoming'),
(2, 'National Robotics Workshop', 'Workshop', DATE_ADD(CURDATE(), INTERVAL 12 DAY), '10:00:00', 'Mechanical Seminar Hall', 'Robotics & Automation Club', 'Hands-on practical session covering Arduino, sensor integration, and autonomous rover control.', 'Upcoming'),
(3, 'Tarang Annual Cultural Fest', 'Cultural', DATE_ADD(CURDATE(), INTERVAL 20 DAY), '16:00:00', 'College Open Air Auditorium', 'Student Cultural Council', 'A vibrant celebration of music, dance, dramatic arts, and campus talent with guest performances.', 'Upcoming'),
(4, 'AI & Cloud Computing Summit', 'Seminar', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'Main Auditorium, Room 101', 'CSE & IT Departments', 'Keynote talks by industry experts on generative AI, cloud scalability, and modern career paths.', 'Upcoming'),
(5, 'Inter-Department Cricket Cup', 'Sports', DATE_SUB(CURDATE(), INTERVAL 8 DAY), '08:30:00', 'College Sports Ground', 'Physical Education Dept', 'Annual inter-departmental cricket championship with awards and certificates.', 'Completed'),
(6, 'Full-Stack Web Development Bootcamp', 'Workshop', DATE_SUB(CURDATE(), INTERVAL 15 DAY), '14:00:00', 'Seminar Hall B', 'Coding Club', 'Intensive front-end and back-end development session building real-world dynamic web applications.', 'Completed');

-- Sample Initial Registrations
INSERT IGNORE INTO event_registrations (registration_id, event_id, student_name, roll_number, email, department) VALUES
(1, 1, 'K. Sai Krishna', '2201A0501', 'saikrishna@navyacollege.ac.in', 'Computer Science & Engineering'),
(2, 1, 'Priya Sharma', '2201A0545', 'priya.sharma@navyacollege.ac.in', 'Computer Science & Engineering'),
(3, 1, 'M. Rohith Reddy', '2201A0412', 'rohith.reddy@navyacollege.ac.in', 'Electronics & Communication'),
(4, 2, 'Anusha Varma', '2301A0308', 'anusha.v@navyacollege.ac.in', 'Mechanical Engineering'),
(5, 4, 'B. Vikram Kumar', '2101A0567', 'vikram.k@navyacollege.ac.in', 'Information Technology');
