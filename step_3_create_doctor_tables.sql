-- Step 3: Create Doctor-Related Tables
-- Tables for doctor profiles, availability, and related data

-- Doctor profiles table (main doctor information)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    specialty TEXT NOT NULL,
    sub_specialty TEXT,
    experience_years INTEGER DEFAULT 0,
    qualification TEXT,
    license_number TEXT UNIQUE,
    bio TEXT,
    languages TEXT[],
    consultation_fee DECIMAL(10, 2),
    rating DECIMAL(3, 2) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    clinic_name TEXT,
    clinic_address TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Available doctors view table (simplified doctor info for listings)
CREATE TABLE IF NOT EXISTS public.available_doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    experience INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 4.5,
    image_url TEXT,
    city TEXT,
    available BOOLEAN DEFAULT TRUE,
    consultation_fee DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor availability schedule
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(doctor_id, day_of_week, start_time)
);

-- Enable Row Level Security
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_profiles
CREATE POLICY "Anyone can view verified doctor profiles"
    ON public.doctor_profiles FOR SELECT
    USING (is_verified = TRUE);

CREATE POLICY "Doctors can view own profile"
    ON public.doctor_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update own profile"
    ON public.doctor_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert own profile"
    ON public.doctor_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for available_doctors
CREATE POLICY "Anyone can view available doctors"
    ON public.available_doctors FOR SELECT
    USING (available = TRUE);

-- RLS Policies for doctor_availability
CREATE POLICY "Anyone can view doctor availability"
    ON public.doctor_availability FOR SELECT
    USING (is_available = TRUE);

CREATE POLICY "Doctors can manage own availability"
    ON public.doctor_availability FOR ALL
    USING (auth.uid() = doctor_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON public.doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON public.doctor_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verified ON public.doctor_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_available_doctors_specialty ON public.available_doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_available_doctors_city ON public.available_doctors(city);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON public.doctor_availability(day_of_week);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_doctor_profiles
    BEFORE UPDATE ON public.doctor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_available_doctors
    BEFORE UPDATE ON public.available_doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_doctor_availability
    BEFORE UPDATE ON public.doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
