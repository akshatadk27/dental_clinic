// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
// Render will provide the PORT through an environment variable.
const port = process.env.PORT || 10000;

// Middleware to enable CORS and to help the server understand JSON from your website
app.use(cors());
app.use(express.json());

// --- SERVE THE FRONTEND FILES ---
// This correctly tells the server that your HTML files are in the main (root) directory.
app.use(express.static(path.join(__dirname)));

// --- DATABASE CONNECTION SETUP (THIS IS THE FIX) ---
// This code correctly and securely reads the DATABASE_URL from Render's environment,
// ignoring any old, hardcoded passwords.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});


// --- API ENDPOINTS (No changes needed in this section) ---

// Get all appointments for a specific date
app.get('/appointments/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const allAppointments = await pool.query(
            "SELECT * FROM appointments WHERE appointment_date = $1 ORDER BY slot ASC",
            [date]
        );
        res.json(allAppointments.rows);
    } catch (err) {
        console.error("Error fetching appointments:", err.message);
        res.status(500).send("Server Error");
    }
});

// Get a single appointment by its ID
app.get('/appointment/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await pool.query(
            "SELECT * FROM appointments WHERE appointment_id = $1",
            [id]
        );
        if (appointment.rows.length === 0) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }
        res.json(appointment.rows[0]);
    } catch (err) {
        console.error("Error fetching single appointment:", err.message);
        res.status(500).send("Server Error");
    }
});

// Create a new appointment
app.post('/appointments', async (req, res) => {
    try {
        const { id, serviceId, date, doctorId, slot, patientName, patientEmail, patientMobile } = req.body;
        const newAppointment = await pool.query(
            `INSERT INTO appointments (appointment_id, service_id, appointment_date, doctor_id, slot, patient_name, patient_email, patient_mobile, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Scheduled')
             RETURNING *`,
            [id, serviceId, date, doctorId, slot, patientName, patientEmail, patientMobile]
        );
        res.status(201).json(newAppointment.rows[0]);
    } catch (err) {
        console.error("Error creating appointment:", err.message);
        res.status(500).send("Server Error");
    }
});

// Mark an appointment as 'Completed'
app.put('/appointments/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const updateAppointment = await pool.query(
            "UPDATE appointments SET status = 'Completed' WHERE appointment_id = $1 RETURNING *",
            [id]
        );
        if (updateAppointment.rows.length === 0) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }
        res.json({ msg: 'Appointment updated successfully', appointment: updateAppointment.rows[0] });
    } catch (err) {
        console.error("Error completing appointment:", err.message);
        res.status(500).send("Server Error");
    }
});

// Delete an appointment
app.delete('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteAppointment = await pool.query(
            "DELETE FROM appointments WHERE appointment_id = $1",
            [id]
        );
        if (deleteAppointment.rowCount === 0) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }
        res.json({ msg: 'Appointment deleted successfully' });
    } catch (err) {
        console.error("Error deleting appointment:", err.message);
        res.status(500).send("Server Error");
    }
});

// Get patient history
app.get('/appointments/history/:mobile', async (req, res) => {
    try {
        const { mobile } = req.params;
        const patientHistory = await pool.query(
            "SELECT * FROM appointments WHERE patient_mobile = $1 ORDER BY appointment_date DESC",
            [mobile]
        );
        res.json(patientHistory.rows);
    } catch (err) {
        console.error("Error fetching patient history:", err.message);
        res.status(500).send("Server Error");
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Dental clinic backend server is running on port ${port}`);
});
