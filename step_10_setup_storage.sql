-- Step 10: Setup Supabase Storage Buckets and Policies
-- IMPORTANT: Storage buckets MUST be created through the Supabase Dashboard UI
-- This SQL file only contains the policies to run AFTER creating buckets manually

-- ============================================
-- STEP 10A: CREATE BUCKETS (Manual - Use Dashboard)
-- ============================================
-- Go to: Supabase Dashboard > Storage > "New bucket" button
-- 
-- Create these 6 buckets:
-- 
-- PUBLIC BUCKETS (check "Public bucket" option):
-- 1. doctor-profiles
-- 2. user-profiles  
-- 3. medicine-images
-- 4. news-images
--
-- PRIVATE BUCKETS (uncheck "Public bucket" option):
-- 5. prescriptions
-- 6. medical-reports
--
-- After creating all buckets manually, run the SQL below for policies
-- ============================================

-- Storage Policies for doctor-profiles bucket
CREATE POLICY "Anyone can view doctor profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'doctor-profiles');

CREATE POLICY "Doctors can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'doctor-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Doctors can update own profile image"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'doctor-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Doctors can delete own profile image"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'doctor-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policies for user-profiles bucket
CREATE POLICY "Anyone can view user profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policies for medicine-images bucket
CREATE POLICY "Anyone can view medicine images"
ON storage.objects FOR SELECT
USING (bucket_id = 'medicine-images');

-- Admin only policies for medicine images (you may need to add admin role check)
CREATE POLICY "Authenticated users can upload medicine images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'medicine-images' 
    AND auth.role() = 'authenticated'
);

-- Storage Policies for prescriptions bucket (private)
CREATE POLICY "Users can view own prescriptions"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Doctors can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'prescriptions' 
    AND auth.role() = 'authenticated'
);

-- Storage Policies for medical-reports bucket (private)
CREATE POLICY "Users can view own medical reports"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'medical-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own medical reports"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'medical-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own medical reports"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'medical-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage Policies for news-images bucket
CREATE POLICY "Anyone can view news images"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

CREATE POLICY "Authenticated users can upload news images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'news-images' 
    AND auth.role() = 'authenticated'
);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your storage buckets and policies are now configured.
-- You can start uploading files through your application.
