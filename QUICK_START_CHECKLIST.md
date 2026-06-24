# ✅ Arogyam Supabase Setup - Quick Start Checklist

Use this checklist to ensure you've completed all setup steps correctly.

## 📋 Pre-Setup

- [ ] Created a Supabase account at https://supabase.com
- [ ] Created a new Supabase project
- [ ] Noted down your Project URL
- [ ] Noted down your Anon (public) Key
- [ ] **Important:** Never use or share your Service Role Key in the frontend!

---

## 🔧 Environment Configuration

- [ ] Created `.env` file in project root
- [ ] Added `VITE_SUPABASE_URL=your_project_url`
- [ ] Added `VITE_SUPABASE_ANON_KEY=your_anon_key`
- [ ] Verified `.env` is in `.gitignore` (should already be there)

---

## 💾 Database Migration (Run SQL files in order)

### Step 1: Extensions
- [ ] Opened Supabase SQL Editor
- [ ] Ran `step_1_enable_extensions.sql`
- [ ] Verified no errors

### Step 2: Users Tables
- [ ] Ran `step_2_create_users_table.sql`
- [ ] Checked Table Editor - should see `users`, `profiles`, `user_preferences`

### Step 3: Doctor Tables
- [ ] Ran `step_3_create_doctor_tables.sql`
- [ ] Checked Table Editor - should see `doctor_profiles`, `available_doctors`, `doctor_availability`

### Step 4: Appointment Tables
- [ ] Ran `step_4_create_appointment_tables.sql`
- [ ] Checked Table Editor - should see `appointments`, `video_call_sessions`, `video_sessions`, `consultation_notes`, `prescriptions`

### Step 5: Messaging Tables
- [ ] Ran `step_5_create_messaging_tables.sql`
- [ ] Checked Table Editor - should see `messages`, `notifications`

### Step 6: Medicine Tables
- [ ] Ran `step_6_create_medicine_tables.sql`
- [ ] Checked Table Editor - should see `medicines`, `medicine_orders`

### Step 7: News Table
- [ ] Ran `step_7_create_news_table.sql`
- [ ] Checked Table Editor - should see `news`

### Step 8: Functions
- [ ] Ran `step_8_create_functions.sql`
- [ ] Checked Database > Functions - should see 5 functions listed

### Step 9: Sample Data (Optional but Recommended)
- [ ] Ran `step_9_seed_sample_data.sql`
- [ ] Verified `medicines` table has 12 rows
- [ ] Verified `available_doctors` table has 10 rows
- [ ] Verified `news` table has 5 rows

### Step 10: Storage Buckets
- [ ] Ran `step_10_setup_storage.sql` OR created buckets manually
- [ ] Went to Storage in Supabase Dashboard
- [ ] Verified these buckets exist:
  - [ ] doctor-profiles (public)
  - [ ] user-profiles (public)
  - [ ] medicine-images (public)
  - [ ] prescriptions (private)
  - [ ] medical-reports (private)
  - [ ] news-images (public)

---

## 🔐 Authentication Setup

- [ ] Went to Authentication > Providers
- [ ] Enabled Email provider
- [ ] Configured Email Templates (optional but recommended)
- [ ] Added Site URL in Authentication > URL Configuration
- [ ] Added Redirect URLs (e.g., http://localhost:5173, your production URL)

---

## 🧪 Verification Tests

### Database Tables
- [ ] All 17 tables visible in Table Editor
- [ ] No error messages in any table
- [ ] RLS (Row Level Security) shield icon visible on all tables

### Functions
- [ ] 5 functions visible in Database > Functions:
  - [ ] search_medicines
  - [ ] get_available_doctors
  - [ ] get_doctor_stats
  - [ ] get_patient_appointment_history
  - [ ] is_time_slot_available

### Storage
- [ ] All 6 buckets created
- [ ] Public buckets have public access enabled
- [ ] Private buckets have RLS policies

---

## 🚀 Application Setup

- [ ] Ran `npm install` (or `yarn install`)
- [ ] Verified `package.json` has `@supabase/supabase-js` dependency
- [ ] Ran `npm run dev` to start development server
- [ ] Application loads without console errors related to Supabase

---

## ✅ First User Test

- [ ] Opened application in browser
- [ ] Navigated to Sign Up page
- [ ] Created a test user account
- [ ] Received verification email (check spam folder)
- [ ] Verified email and logged in successfully
- [ ] Profile page loads correctly
- [ ] Can view available doctors
- [ ] Can search medicines
- [ ] Can view news articles

---

## 👨‍⚕️ Doctor Registration Test

- [ ] Logged out from patient account
- [ ] Navigated to Doctor Registration page
- [ ] Filled out doctor registration form
- [ ] Successfully created doctor account
- [ ] Doctor profile created in `doctor_profiles` table
- [ ] Can view and edit doctor profile

---

## 📱 Feature Tests

### Appointments
- [ ] Can browse available doctors
- [ ] Can select a doctor
- [ ] Can choose date and time
- [ ] Can create an appointment
- [ ] Appointment appears in profile
- [ ] Can view appointment details

### Messaging
- [ ] Can access messaging page
- [ ] Can select a doctor to message
- [ ] Can send a message
- [ ] Message appears in chat
- [ ] Receives automated doctor response (demo mode)

### Medicine Search
- [ ] Can search for medicines
- [ ] Search results display correctly
- [ ] Can see medicine details
- [ ] Availability status shows correctly

### Video Consultation (Optional)
- [ ] Can join video call from appointment
- [ ] Video session ID generated
- [ ] Video call page loads

---

## 🐛 Troubleshooting Checklist

If something doesn't work:

- [ ] Checked browser console for errors
- [ ] Checked Supabase Logs (Database > Logs)
- [ ] Verified environment variables are correct
- [ ] Cleared browser cache and reloaded
- [ ] Checked that RLS policies are enabled
- [ ] Verified user is authenticated (logged in)
- [ ] Checked Network tab for failed requests
- [ ] Reviewed SQL error messages in Supabase

---

## 📚 Documentation References

- [ ] Read `SUPABASE_SETUP_INSTRUCTIONS.md` for detailed setup guide
- [ ] Reviewed `DATABASE_SCHEMA_REFERENCE.md` for table structures
- [ ] Bookmarked Supabase documentation: https://supabase.com/docs

---

## 🎯 Production Deployment Checklist

When ready to deploy:

- [ ] Created production Supabase project (separate from development)
- [ ] Ran all migration scripts on production database
- [ ] Updated production environment variables
- [ ] Configured production redirect URLs
- [ ] Set up custom email templates
- [ ] Enabled email rate limiting
- [ ] Configured SMTP settings (optional)
- [ ] Set up database backups schedule
- [ ] Enabled database point-in-time recovery
- [ ] Configured monitoring and alerts
- [ ] Reviewed and tightened RLS policies
- [ ] Disabled sample data (don't run step_9 in production)
- [ ] Set up proper error logging
- [ ] Tested all critical user flows

---

## 📊 Database Health Check

Run these queries in SQL Editor to verify:

### Count All Tables
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 17 tables
```

### Check Sample Data
```sql
SELECT 
  (SELECT COUNT(*) FROM medicines) as medicines_count,
  (SELECT COUNT(*) FROM available_doctors) as doctors_count,
  (SELECT COUNT(*) FROM news) as news_count;
-- Expected: 12, 10, 5 if sample data loaded
```

### Verify Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
-- Expected: 5+ functions
```

### Check Storage Buckets
```sql
SELECT id, name, public 
FROM storage.buckets;
-- Expected: 6 buckets
```

---

## ✨ Success Indicators

You're ready to develop when:

✅ All SQL files executed without errors  
✅ All 17 tables created successfully  
✅ All 6 storage buckets configured  
✅ Sample data loaded (12 medicines, 10 doctors, 5 news)  
✅ Can create user accounts  
✅ Can register as doctor  
✅ Can create appointments  
✅ Can send messages  
✅ Can search medicines  
✅ No console errors related to Supabase  
✅ RLS policies working correctly  

---

## 🆘 Need Help?

1. **Check the logs:** Supabase Dashboard > Database > Logs
2. **Review documentation:** All .md files in project root
3. **Browser console:** Look for detailed error messages
4. **Supabase support:** https://supabase.com/docs
5. **Community:** Supabase Discord or GitHub Discussions

---

## 📝 Notes

- Keep your service role key secret - never use it in frontend code
- Test thoroughly in development before deploying to production
- Regularly backup your database
- Monitor your Supabase usage to avoid exceeding free tier limits
- Consider upgrading to Pro plan for production applications

---

**Checklist Version:** 1.0  
**Last Updated:** June 2026  
**For:** Arogyam Telemedicine Application

🎉 **Once everything is checked, you're ready to build!**
