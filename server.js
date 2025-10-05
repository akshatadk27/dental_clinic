// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static(__dirname)); // serve all files (index.html, admin.html, etc.)

// Homepage route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Optional admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});





// --- DATABASE CONNECTION SETUP ---
// IMPORTANT: Replace these details with your own PostgreSQL credentials
const pool = new Pool({
    user: 'dental_user',
    host: 'dpg-d3h7cb0gjchc73a9gbv0-a',
    database: 'dental_clinic_cj4n',
    password: '21xLWtWfyqtA4vQVOvkq8rbmE0tvKGRR',
    port: 5432,
});


// --- API ENDPOINTS (ROUTES) ---

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
        console.error(err.message);
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
        console.error(err.message);
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
        console.error(err.message);
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
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// NEW: Delete an appointment by its ID
app.delete('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the appointment_id from the URL

        // The SQL command to delete a specific row
        const deleteAppointment = await pool.query(
            "DELETE FROM appointments WHERE appointment_id = $1",
            [id]
        );

        // Check if a row was actually deleted
        if (deleteAppointment.rowCount === 0) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        res.json({ msg: 'Appointment deleted successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all appointments for a specific mobile number (Patient History)
app.get('/appointments/history/:mobile', async (req, res) => {
    try {
        const { mobile } = req.params;
        const patientHistory = await pool.query(
            "SELECT * FROM appointments WHERE patient_mobile = $1 ORDER BY appointment_date DESC",
            [mobile]
        );
        res.json(patientHistory.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Dental clinic backend server is running on http://localhost:${PORT}`);
});