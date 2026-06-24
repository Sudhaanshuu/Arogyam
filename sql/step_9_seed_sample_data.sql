-- Step 9: Seed Sample Data (Optional)
-- This file contains sample data to help you test the application
-- Run this AFTER creating all tables and setting up authentication

-- Note: You'll need to replace the UUID values with actual user IDs from your auth.users table
-- or create test users first through the Supabase Auth interface

-- Sample medicines data
INSERT INTO public.medicines (name, description, category, manufacturer, price, available, stock_quantity, dosage_form, strength, requires_prescription) VALUES
('Ashwagandha Capsules', 'Natural stress relief and energy booster', 'Ayurvedic', 'Himalaya', 299.00, true, 100, 'Capsule', '500mg', false),
('Triphala Churna', 'Digestive health and detoxification', 'Ayurvedic', 'Dabur', 149.00, true, 150, 'Powder', '100g', false),
('Chyawanprash', 'Immunity booster with 40+ herbs', 'Ayurvedic', 'Patanjali', 399.00, true, 80, 'Paste', '500g', false),
('Giloy Juice', 'Natural immunity enhancer', 'Ayurvedic', 'Baidyanath', 199.00, true, 120, 'Liquid', '500ml', false),
('Brahmi Tablets', 'Memory and cognitive function support', 'Ayurvedic', 'Himalaya', 249.00, true, 90, 'Tablet', '250mg', false),
('Tulsi Drops', 'Respiratory health and immunity', 'Ayurvedic', 'Organic India', 179.00, true, 110, 'Liquid', '30ml', false),
('Neem Capsules', 'Skin health and blood purification', 'Ayurvedic', 'Himalaya', 189.00, true, 95, 'Capsule', '300mg', false),
('Arjuna Tablets', 'Heart health support', 'Ayurvedic', 'Divya', 229.00, true, 70, 'Tablet', '500mg', false),
('Amla Juice', 'Rich in Vitamin C, antioxidant', 'Ayurvedic', 'Patanjali', 159.00, true, 130, 'Liquid', '500ml', false),
('Shilajit Resin', 'Energy and stamina enhancer', 'Ayurvedic', 'Himalaya', 699.00, true, 50, 'Resin', '20g', false),
('Karela Juice', 'Blood sugar management', 'Ayurvedic', 'Baidyanath', 189.00, true, 85, 'Liquid', '500ml', false),
('Haridra Capsules', 'Anti-inflammatory turmeric supplement', 'Ayurvedic', 'Organic India', 269.00, true, 100, 'Capsule', '400mg', false)
ON CONFLICT DO NOTHING;

-- Sample available doctors data
INSERT INTO public.available_doctors (name, specialty, experience, rating, city, available, consultation_fee) VALUES
('Dr. Sarah Johnson', 'General Medicine', 8, 4.8, 'Available Online', true, 500.00),
('Dr. Michael Chen', 'Cardiology', 12, 4.9, 'Available Online', true, 800.00),
('Dr. Emily Davis', 'Dermatology', 6, 4.7, 'Available Online', true, 600.00),
('Dr. Robert Wilson', 'Pediatrics', 15, 4.9, 'Available Online', true, 550.00),
('Dr. Lisa Anderson', 'Psychiatry', 10, 4.6, 'Available Online', true, 700.00),
('Dr. James Martinez', 'Orthopedics', 14, 4.8, 'Available Online', true, 750.00),
('Dr. Priya Sharma', 'Ayurveda', 9, 4.9, 'Available Online', true, 450.00),
('Dr. Rajesh Kumar', 'Ayurveda', 20, 5.0, 'Available Online', true, 600.00),
('Dr. Anita Verma', 'Gynecology', 11, 4.7, 'Available Online', true, 650.00),
('Dr. Amit Patel', 'Neurology', 13, 4.8, 'Available Online', true, 900.00)
ON CONFLICT DO NOTHING;

-- Sample news articles
INSERT INTO public.news (title, content, excerpt, category, author_name, published, views_count, published_at) VALUES
(
    'Benefits of Ayurvedic Medicine in Modern Healthcare',
    'Ayurvedic medicine, one of the world''s oldest holistic healing systems, continues to play a vital role in modern healthcare. Recent studies have shown significant benefits of traditional Ayurvedic practices when integrated with contemporary medicine...',
    'Discover how ancient Ayurvedic wisdom is being integrated with modern medical practices for better health outcomes.',
    'Ayurveda',
    'Dr. Rajesh Kumar',
    true,
    1250,
    NOW() - INTERVAL '2 days'
),
(
    'Understanding Immunity: Natural Ways to Boost Your Defense',
    'In today''s world, maintaining a strong immune system is more important than ever. This article explores natural, evidence-based approaches to enhancing your body''s defense mechanisms through nutrition, lifestyle, and traditional practices...',
    'Learn about natural methods to strengthen your immune system through proper nutrition and lifestyle choices.',
    'Health Tips',
    'Dr. Priya Sharma',
    true,
    980,
    NOW() - INTERVAL '5 days'
),
(
    'Telemedicine Revolution: Healthcare at Your Fingertips',
    'The healthcare landscape has transformed dramatically with the advent of telemedicine. Patients can now consult with healthcare professionals from the comfort of their homes, making healthcare more accessible and convenient...',
    'Explore how telemedicine is making quality healthcare accessible to everyone, everywhere.',
    'Technology',
    'Admin',
    true,
    1560,
    NOW() - INTERVAL '1 week'
),
(
    'Stress Management Through Ayurvedic Practices',
    'Chronic stress has become a modern epidemic. Ayurvedic practices offer time-tested solutions for managing stress naturally through herbs, meditation, yoga, and lifestyle modifications...',
    'Ancient Ayurvedic wisdom provides effective solutions for managing modern-day stress.',
    'Mental Health',
    'Dr. Lisa Anderson',
    true,
    875,
    NOW() - INTERVAL '3 days'
),
(
    'Nutrition and Heart Health: An Evidence-Based Approach',
    'Heart disease remains a leading cause of mortality worldwide. This comprehensive guide explores the relationship between nutrition and cardiovascular health, backed by latest research...',
    'Understand the crucial link between your diet and heart health with evidence-based recommendations.',
    'Cardiology',
    'Dr. Michael Chen',
    true,
    1120,
    NOW() - INTERVAL '6 days'
)
ON CONFLICT DO NOTHING;

-- Note about creating test user accounts:
-- You need to create test user accounts through Supabase Auth Dashboard or your signup flow
-- Then you can manually insert doctor_profiles, appointments, etc. using those user IDs

-- Example of how to insert doctor profile after creating a user:
-- First create user through Supabase Auth, then:
-- INSERT INTO public.doctor_profiles (user_id, specialty, experience_years, qualification, license_number, bio, is_verified)
-- VALUES (
--     'YOUR_USER_UUID_HERE',
--     'Ayurveda',
--     10,
--     'BAMS, MD (Ayurveda)',
--     'AYU-12345',
--     'Experienced Ayurvedic practitioner specializing in holistic wellness and chronic disease management.',
--     true
-- );

COMMENT ON TABLE public.medicines IS 'Sample medicines have been inserted. You can add more through your admin panel.';
COMMENT ON TABLE public.available_doctors IS 'Sample doctors have been inserted. Real doctor profiles will be created through doctor registration.';
COMMENT ON TABLE public.news IS 'Sample news articles have been inserted. You can manage news through your admin panel.';
