CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    appointment_id VARCHAR(255) UNIQUE NOT NULL,
    service_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    slot VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255),
    patient_mobile VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

Select * from appointments;