# Arogyam Database Schema Reference

## Quick Reference Guide for All Tables

### 👤 User Management

#### **users**
Primary user profile table linked to Supabase Auth
```
- id (UUID, PK, FK to auth.users)
- full_name (TEXT)
- email (TEXT, UNIQUE)
- phone (TEXT)
- city (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **profiles**
Alternative profile structure (fallback)
```
- id (UUID, PK, FK to auth.users)
- name (TEXT)
- email (TEXT, UNIQUE)
- phone (TEXT)
- city (TEXT)
- is_admin (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **user_preferences**
User settings and preferences
```
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- email_notifications (BOOLEAN)
- sms_notifications (BOOLEAN)
- language (TEXT)
- theme (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

### 👨‍⚕️ Doctor Management

#### **doctor_profiles**
Complete doctor information
```
- id (UUID, PK)
- user_id (UUID, FK to auth.users, UNIQUE)
- specialty (TEXT) *required
- sub_specialty (TEXT)
- experience_years (INTEGER)
- qualification (TEXT)
- license_number (TEXT, UNIQUE)
- bio (TEXT)
- languages (TEXT[])
- consultation_fee (DECIMAL)
- rating (DECIMAL, 0-5)
- total_reviews (INTEGER)
- is_available (BOOLEAN)
- is_verified (BOOLEAN)
- clinic_name (TEXT)
- clinic_address (TEXT)
- image_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **available_doctors**
Simplified doctor listings for public view
```
- id (UUID, PK)
- name (TEXT) *required
- specialty (TEXT) *required
- experience (INTEGER)
- rating (DECIMAL)
- image_url (TEXT)
- city (TEXT)
- available (BOOLEAN)
- consultation_fee (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **doctor_availability**
Doctor schedule management
```
- id (UUID, PK)
- doctor_id (UUID, FK to auth.users)
- day_of_week (INTEGER, 0-6)
- start_time (TIME)
- end_time (TIME)
- is_available (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(doctor_id, day_of_week, start_time)
```

---

### 📅 Appointments & Consultations

#### **appointments**
Main appointment records
```
- id (UUID, PK)
- patient_id (UUID, FK to auth.users) *required
- doctor_id (UUID, FK to auth.users) *required
- appointment_date (TIMESTAMP) *required
- duration_minutes (INTEGER, default 30)
- status (TEXT: pending|confirmed|completed|cancelled|rescheduled)
- video_session_id (TEXT)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **video_call_sessions**
Video consultation sessions
```
- id (UUID, PK)
- room_id (TEXT, UNIQUE) *required
- appointment_id (UUID, FK to appointments)
- host_id (UUID, FK to auth.users)
- status (TEXT: waiting|active|ended)
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)
- duration_seconds (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **video_sessions**
Alternative video session structure
```
- id (TEXT, PK)
- appointment_id (UUID, FK to appointments)
- status (TEXT: active|ended)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **appointment_video_calls**
Junction table linking appointments to video calls
```
- id (UUID, PK)
- appointment_id (UUID, FK to appointments)
- video_call_session_id (UUID, FK to video_call_sessions)
- created_at (TIMESTAMP)
- UNIQUE(appointment_id, video_call_session_id)
```

#### **consultation_notes**
Doctor's notes from consultations
```
- id (UUID, PK)
- appointment_id (UUID, FK to appointments)
- doctor_id (UUID, FK to auth.users) *required
- patient_id (UUID, FK to auth.users) *required
- diagnosis (TEXT)
- symptoms (TEXT)
- treatment_plan (TEXT)
- follow_up_date (DATE)
- is_confidential (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **prescriptions**
Digital prescription records
```
- id (UUID, PK)
- appointment_id (UUID, FK to appointments)
- doctor_id (UUID, FK to auth.users) *required
- patient_id (UUID, FK to auth.users) *required
- medications (JSONB) *required
- instructions (TEXT)
- is_active (BOOLEAN)
- valid_until (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

### 💬 Communication

#### **messages**
Patient-doctor messaging
```
- id (UUID, PK)
- user_id (UUID, FK to auth.users) *required
- doctor_id (UUID, FK to auth.users) *required
- content (TEXT) *required
- is_from_doctor (BOOLEAN)
- is_read (BOOLEAN)
- attachment_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **notifications**
System notifications
```
- id (UUID, PK)
- user_id (UUID, FK to auth.users) *required
- title (TEXT) *required
- message (TEXT) *required
- type (TEXT: appointment|message|prescription|general|reminder)
- read (BOOLEAN)
- action_url (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

### 💊 Pharmacy & Medicines

#### **medicines**
Medicine catalog
```
- id (UUID, PK)
- name (TEXT) *required
- description (TEXT)
- category (TEXT)
- manufacturer (TEXT)
- price (DECIMAL) *required
- available (BOOLEAN)
- stock_quantity (INTEGER)
- image_url (TEXT)
- dosage_form (TEXT: tablet|capsule|syrup|etc)
- strength (TEXT)
- requires_prescription (BOOLEAN)
- active_ingredients (TEXT[])
- side_effects (TEXT)
- contraindications (TEXT)
- storage_instructions (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **medicine_orders**
Medicine order records
```
- id (UUID, PK)
- user_id (UUID, FK to auth.users) *required
- medicine_id (UUID, FK to medicines)
- prescription_id (UUID, FK to prescriptions)
- quantity (INTEGER) *required, > 0
- total_price (DECIMAL) *required
- status (TEXT: pending|confirmed|processing|shipped|delivered|cancelled)
- delivery_address (TEXT) *required
- tracking_number (TEXT)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

### 📰 Content Management

#### **news**
Health news and articles
```
- id (UUID, PK)
- title (TEXT) *required
- content (TEXT) *required
- excerpt (TEXT)
- category (TEXT)
- author_id (UUID, FK to auth.users)
- author_name (TEXT)
- image_url (TEXT)
- source (TEXT)
- source_url (TEXT)
- tags (TEXT[])
- published (BOOLEAN)
- views_count (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- published_at (TIMESTAMP)
```

---

## 🔐 Row Level Security (RLS) Summary

### Public Access (Anyone Can View)
- `medicines` (where available = true)
- `available_doctors` (where available = true)
- `news` (where published = true)
- `doctor_profiles` (where is_verified = true)
- `doctor_availability` (where is_available = true)

### User-Specific Access
- `users`, `profiles` - Own record only
- `user_preferences` - Own preferences only
- `appointments` - Patient or doctor on the appointment
- `messages` - Sender or recipient only
- `notifications` - Own notifications only
- `consultation_notes` - Doctor or patient involved
- `prescriptions` - Doctor or patient involved
- `medicine_orders` - Own orders only

### Doctor-Specific Access
- `doctor_profiles` - Can manage own profile
- `doctor_availability` - Can manage own schedule
- `consultation_notes` - Can create and update own notes
- `prescriptions` - Can create and update prescriptions

---

## 📊 Database Functions

### `search_medicines(p_query, p_category)`
Search medicines with optional filters
- **Parameters:** query text, category text (both optional)
- **Returns:** Filtered list of available medicines

### `get_available_doctors(p_specialty, p_city, p_day_of_week)`
Get filtered list of available doctors
- **Parameters:** specialty, city, day_of_week (all optional)
- **Returns:** Doctors matching criteria, sorted by rating

### `get_doctor_stats(p_doctor_id)`
Get appointment statistics for a doctor
- **Parameters:** doctor UUID
- **Returns:** Total, completed, cancelled, upcoming appointments + average rating

### `get_patient_appointment_history(p_patient_id)`
Get patient's appointment history with doctor details
- **Parameters:** patient UUID
- **Returns:** List of appointments with doctor info

### `is_time_slot_available(p_doctor_id, p_appointment_date, p_duration_minutes)`
Check if a time slot is available for booking
- **Parameters:** doctor UUID, timestamp, duration (default 30)
- **Returns:** Boolean (true if available)

---

## 🗂️ Storage Buckets

### Public Buckets
- **doctor-profiles** - Doctor profile pictures
- **user-profiles** - User profile pictures
- **medicine-images** - Medicine product images
- **news-images** - News article images

### Private Buckets
- **prescriptions** - Prescription documents (patient access only)
- **medical-reports** - Medical reports (patient access only)

---

## 🔄 Automatic Triggers

### `handle_updated_at()`
Automatically updates `updated_at` timestamp on all tables when records are modified.

### `update_doctor_rating()`
Automatically recalculates doctor rating when appointment status changes to 'completed'.

### `notify_new_message()`
Automatically creates a notification when a new message is sent.

---

## 📈 Indexes for Performance

### User Tables
- `idx_users_email` - Fast email lookups
- `idx_profiles_email` - Fast profile email lookups

### Doctor Tables
- `idx_doctor_profiles_specialty` - Search by specialty
- `idx_doctor_profiles_verified` - Filter verified doctors
- `idx_available_doctors_city` - Search by location

### Appointment Tables
- `idx_appointments_patient_id` - Patient appointment history
- `idx_appointments_doctor_id` - Doctor schedule
- `idx_appointments_date` - Date-based queries

### Medicine Tables
- `idx_medicines_name` - Fast name search
- `idx_medicines_name_gin` - Full-text search on names
- `idx_medicines_description_gin` - Full-text search on descriptions

### Message Tables
- `idx_messages_user_id` - User message history
- `idx_messages_doctor_id` - Doctor messages
- `idx_messages_created_at` - Chronological ordering

---

## 🎯 Common Query Patterns

### Get User's Upcoming Appointments
```sql
SELECT * FROM appointments
WHERE patient_id = 'USER_UUID'
AND appointment_date > NOW()
AND status = 'confirmed'
ORDER BY appointment_date ASC;
```

### Get Doctor's Today's Schedule
```sql
SELECT * FROM appointments
WHERE doctor_id = 'DOCTOR_UUID'
AND DATE(appointment_date) = CURRENT_DATE
ORDER BY appointment_date ASC;
```

### Search Available Doctors by Specialty
```sql
SELECT * FROM available_doctors
WHERE specialty ILIKE '%cardiology%'
AND available = true
ORDER BY rating DESC;
```

### Get Patient's Unread Messages
```sql
SELECT * FROM messages
WHERE user_id = 'USER_UUID'
AND is_from_doctor = true
AND is_read = false
ORDER BY created_at DESC;
```

### Search Medicines
```sql
SELECT * FROM medicines
WHERE name ILIKE '%ashwagandha%'
AND available = true
ORDER BY name;
```

---

## 🔧 Maintenance Commands

### Reset a Table (Clear all data)
```sql
TRUNCATE TABLE table_name CASCADE;
```

### Check Row Counts
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### View Active Policies
```sql
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

**Last Updated:** June 2026  
**Version:** 1.0  
**Application:** Arogyam Telemedicine Platform
