# Arogyam - Supabase Database Setup Instructions

This guide will help you set up the complete database schema for the Arogyam telemedicine application in Supabase.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created
3. Your Supabase project URL and anon key

## Environment Setup

1. Create or update your `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the actual values from your Supabase project dashboard.

## Database Setup Steps

Execute the SQL files in the following order in your Supabase SQL Editor:

### Step 1: Enable Extensions
**File:** `step_1_enable_extensions.sql`

This enables required PostgreSQL extensions for UUID generation and encryption.

### Step 2: Create Users Table
**File:** `step_2_create_users_table.sql`

Creates the following tables:
- `users` - Main user profile table
- `profiles` - Alternative profile structure (fallback)
- `user_preferences` - User settings and preferences

Includes Row Level Security (RLS) policies and triggers.

### Step 3: Create Doctor Tables
**File:** `step_3_create_doctor_tables.sql`

Creates the following tables:
- `doctor_profiles` - Complete doctor information
- `available_doctors` - Simplified doctor listings
- `doctor_availability` - Doctor schedule management

Includes RLS policies for doctor data access control.

### Step 4: Create Appointment Tables
**File:** `step_4_create_appointment_tables.sql`

Creates the following tables:
- `appointments` - Main appointment records
- `video_call_sessions` - Video consultation sessions
- `video_sessions` - Alternative video session structure
- `appointment_video_calls` - Junction table for appointments and video calls
- `consultation_notes` - Doctor's notes from consultations
- `prescriptions` - Digital prescription records

Includes comprehensive RLS policies for privacy and security.

### Step 5: Create Messaging Tables
**File:** `step_5_create_messaging_tables.sql`

Creates the following tables:
- `messages` - Patient-doctor messaging
- `notifications` - System notifications

Includes RLS policies for secure messaging.

### Step 6: Create Medicine Tables
**File:** `step_6_create_medicine_tables.sql`

Creates the following tables:
- `medicines` - Medicine catalog
- `medicine_orders` - Medicine order records

Includes full-text search indexes for medicine search functionality.

### Step 7: Create News Table
**File:** `step_7_create_news_table.sql`

Creates the following table:
- `news` - Health news and articles

Includes full-text search for content discovery.

### Step 8: Create Functions
**File:** `step_8_create_functions.sql`

Creates useful database functions:
- `search_medicines()` - Advanced medicine search
- `get_available_doctors()` - Filter available doctors
- `get_doctor_stats()` - Doctor performance statistics
- `get_patient_appointment_history()` - Patient appointment history
- `is_time_slot_available()` - Check appointment slot availability
- `update_doctor_rating()` - Auto-update doctor ratings
- `notify_new_message()` - Create notifications for new messages

### Step 9: Seed Sample Data (Optional)
**File:** `step_9_seed_sample_data.sql`

Populates the database with sample data:
- 12 sample medicines
- 10 sample doctors
- 5 sample news articles

**Note:** This is optional and recommended for testing purposes.

### Step 10: Setup Storage
**⚠️ IMPORTANT: Create buckets in Dashboard, NOT SQL Editor!**

Storage buckets **must** be created through the Supabase Dashboard UI, not via SQL.

**Instructions:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Create these 6 buckets:

**Public Buckets** (check "Public bucket" ✅):
- `doctor-profiles` - Doctor profile images
- `user-profiles` - User profile images
- `medicine-images` - Medicine product images
- `news-images` - News article images

**Private Buckets** (uncheck "Public bucket" ❌):
- `prescriptions` - Prescription documents
- `medical-reports` - Patient medical reports

**Detailed Guide:** See `STEP_10_STORAGE_GUIDE.md` for step-by-step instructions with screenshots guide.

**Quick Reference:** See `STORAGE_SETUP_QUICK_GUIDE.txt` for a quick checklist.

**Optional:** After creating buckets, you can run `step_10_setup_storage.sql` for additional storage policies (though the default policies should work fine).

## How to Run the SQL Files

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of each SQL file (in order)
5. Paste into the SQL Editor
6. Click **Run** to execute
7. Repeat for each file in sequence

## Verification

After running all SQL files, verify the setup:

1. Go to **Table Editor** in Supabase dashboard
2. You should see all the following tables:
   - users
   - profiles
   - user_preferences
   - doctor_profiles
   - available_doctors
   - doctor_availability
   - appointments
   - video_call_sessions
   - video_sessions
   - appointment_video_calls
   - consultation_notes
   - prescriptions
   - messages
   - notifications
   - medicines
   - medicine_orders
   - news

3. Check **Database** > **Functions** for stored procedures
4. Check **Storage** for created buckets

## Authentication Setup

The app uses Supabase Auth. Make sure to:

1. Enable Email authentication in **Authentication** > **Providers**
2. Configure Email templates in **Authentication** > **Email Templates**
3. Set up redirect URLs in **Authentication** > **URL Configuration**

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only view/edit their own data
- Doctors can manage their own profiles and availability
- Patients can only see their own appointments and medical records
- Public data (medicines, available doctors) is accessible to all authenticated users

## Common Issues and Solutions

### Issue: "permission denied for table"
**Solution:** Make sure RLS policies are created correctly. Re-run the step that creates the table.

### Issue: "function does not exist"
**Solution:** Make sure you ran step_1_enable_extensions.sql first.

### Issue: "duplicate key value violates unique constraint"
**Solution:** This is normal if you re-run seed data. Use `ON CONFLICT DO NOTHING` or clear data first.

### Issue: Storage policies not working
**Solution:** Check that the bucket names match exactly in both bucket creation and policy creation.

## Database Schema Overview

```
Users & Authentication
├── users (main profile)
├── profiles (fallback profile)
└── user_preferences

Doctors
├── doctor_profiles (complete info)
├── available_doctors (listings)
└── doctor_availability (schedule)

Appointments & Consultations
├── appointments
├── video_call_sessions
├── video_sessions
├── consultation_notes
└── prescriptions

Communication
├── messages
└── notifications

Pharmacy
├── medicines
└── medicine_orders

Content
└── news
```

## Security Best Practices

1. **Never expose your Supabase service_role key** - Use only the anon key in your frontend
2. **RLS Policies** - All sensitive tables have RLS enabled
3. **Storage Policies** - Private buckets (prescriptions, medical-reports) are restricted
4. **Authentication** - All operations require authenticated users
5. **API Keys** - Store in environment variables, never commit to version control

## Next Steps

1. Update your `.env` file with Supabase credentials
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Create test accounts through the signup flow
5. Register as a doctor to test the full workflow

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review the SQL files for table structures
3. Check browser console for detailed error messages
4. Verify RLS policies are correctly set

## Database Maintenance

### Backup
- Supabase automatically backs up your database
- You can also export your schema from the SQL Editor

### Monitoring
- Use **Database** > **Logs** to monitor queries
- Check **Database** > **Roles** for permissions
- Monitor **Storage** usage in Storage dashboard

## Helpful Supabase Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

---

**Note:** This schema is designed for the Arogyam telemedicine application. Customize as needed for your specific requirements.
