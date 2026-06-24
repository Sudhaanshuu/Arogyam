-- Step 4: Create Appointment and Video Call Tables
-- Tables for managing appointments and video consultations

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    video_session_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video call sessions table
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id TEXT UNIQUE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video sessions table (alternative structure used in app)
CREATE TABLE IF NOT EXISTS public.video_sessions (
    id TEXT PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for appointment video calls
CREATE TABLE IF NOT EXISTS public.appointment_video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    video_call_session_id UUID REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(appointment_id, video_call_session_id)
);

-- Consultation notes table
CREATE TABLE IF NOT EXISTS public.consultation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    treatment_plan TEXT,
    follow_up_date DATE,
    is_confidential BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    medications JSONB NOT NULL, -- Array of {name, dosage, frequency, duration}
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients can create appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- RLS Policies for video_call_sessions
CREATE POLICY "Users can view own video sessions"
    ON public.video_call_sessions FOR SELECT
    USING (auth.uid() = host_id OR EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE appointments.id = video_call_sessions.appointment_id 
        AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = auth.uid())
    ));

CREATE POLICY "Users can manage own video sessions"
    ON public.video_call_sessions FOR ALL
    USING (auth.uid() = host_id);

-- RLS Policies for video_sessions
CREATE POLICY "Users can view related video sessions"
    ON public.video_sessions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE appointments.video_session_id = video_sessions.id 
        AND (appointments.patient_id = auth.uid() OR appointments.doctor_id = auth.uid())
    ));

CREATE POLICY "Users can insert video sessions"
    ON public.video_sessions FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Users can update video sessions"
    ON public.video_sessions FOR UPDATE
    USING (TRUE);

-- RLS Policies for consultation_notes
CREATE POLICY "Doctors and patients can view own consultation notes"
    ON public.consultation_notes FOR SELECT
    USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Doctors can create consultation notes"
    ON public.consultation_notes FOR INSERT
    WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own consultation notes"
    ON public.consultation_notes FOR UPDATE
    USING (auth.uid() = doctor_id);

-- RLS Policies for prescriptions
CREATE POLICY "Doctors and patients can view prescriptions"
    ON public.prescriptions FOR SELECT
    USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Doctors can create prescriptions"
    ON public.prescriptions FOR INSERT
    WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own prescriptions"
    ON public.prescriptions FOR UPDATE
    USING (auth.uid() = doctor_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_room_id ON public.video_call_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_appointment_id ON public.video_call_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient_id ON public.consultation_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor_id ON public.consultation_notes(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_appointments
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_video_call_sessions
    BEFORE UPDATE ON public.video_call_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_video_sessions
    BEFORE UPDATE ON public.video_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_consultation_notes
    BEFORE UPDATE ON public.consultation_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_prescriptions
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
