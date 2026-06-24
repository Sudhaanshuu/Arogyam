-- Step 8: Create Database Functions and Stored Procedures
-- Useful functions for complex queries and business logic

-- Function to search medicines with optional filters
CREATE OR REPLACE FUNCTION public.search_medicines(
    p_query TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    price DECIMAL,
    available BOOLEAN,
    image_url TEXT,
    stock_quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.description,
        m.category,
        m.price,
        m.available,
        m.image_url,
        m.stock_quantity
    FROM public.medicines m
    WHERE 
        m.available = TRUE
        AND (p_query IS NULL OR m.name ILIKE '%' || p_query || '%')
        AND (p_category IS NULL OR m.category = p_category)
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available doctors with filters
CREATE OR REPLACE FUNCTION public.get_available_doctors(
    p_specialty TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_day_of_week INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    specialty TEXT,
    experience INTEGER,
    rating DECIMAL,
    city TEXT,
    consultation_fee DECIMAL,
    available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        ad.id,
        ad.name,
        ad.specialty,
        ad.experience,
        ad.rating,
        ad.city,
        ad.consultation_fee,
        ad.available
    FROM public.available_doctors ad
    WHERE 
        ad.available = TRUE
        AND (p_specialty IS NULL OR ad.specialty = p_specialty)
        AND (p_city IS NULL OR ad.city = p_city)
    ORDER BY ad.rating DESC, ad.experience DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate appointment statistics for a doctor
CREATE OR REPLACE FUNCTION public.get_doctor_stats(p_doctor_id UUID)
RETURNS TABLE (
    total_appointments INTEGER,
    completed_appointments INTEGER,
    cancelled_appointments INTEGER,
    upcoming_appointments INTEGER,
    average_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER AS total_appointments,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_appointments,
        COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER AS cancelled_appointments,
        COUNT(*) FILTER (WHERE status = 'confirmed' AND appointment_date > NOW())::INTEGER AS upcoming_appointments,
        (SELECT rating FROM public.doctor_profiles WHERE user_id = p_doctor_id)
    FROM public.appointments
    WHERE doctor_id = p_doctor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get patient appointment history with doctor details
CREATE OR REPLACE FUNCTION public.get_patient_appointment_history(p_patient_id UUID)
RETURNS TABLE (
    appointment_id UUID,
    doctor_name TEXT,
    doctor_specialty TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    duration_minutes INTEGER,
    video_session_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS appointment_id,
        COALESCE(dp.specialty || ' Specialist', 'Doctor') AS doctor_name,
        dp.specialty AS doctor_specialty,
        a.appointment_date,
        a.status,
        a.duration_minutes,
        a.video_session_id
    FROM public.appointments a
    LEFT JOIN public.doctor_profiles dp ON a.doctor_id = dp.user_id
    WHERE a.patient_id = p_patient_id
    ORDER BY a.appointment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a time slot is available for booking
CREATE OR REPLACE FUNCTION public.is_time_slot_available(
    p_doctor_id UUID,
    p_appointment_date TIMESTAMP WITH TIME ZONE,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_conflict_count INTEGER;
BEGIN
    v_end_time := p_appointment_date + (p_duration_minutes || ' minutes')::INTERVAL;
    
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE 
        doctor_id = p_doctor_id
        AND status NOT IN ('cancelled', 'completed')
        AND (
            (appointment_date <= p_appointment_date AND 
             appointment_date + (duration_minutes || ' minutes')::INTERVAL > p_appointment_date)
            OR
            (appointment_date < v_end_time AND 
             appointment_date + (duration_minutes || ' minutes')::INTERVAL >= v_end_time)
            OR
            (appointment_date >= p_appointment_date AND 
             appointment_date + (duration_minutes || ' minutes')::INTERVAL <= v_end_time)
        );
    
    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update doctor rating after appointment completion
CREATE OR REPLACE FUNCTION public.update_doctor_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating DECIMAL;
    v_total_reviews INTEGER;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Calculate new average rating (simplified - you may want to add actual rating system)
        SELECT 
            COALESCE(AVG(4.5), 4.5),
            COUNT(*)
        INTO v_avg_rating, v_total_reviews
        FROM public.appointments
        WHERE doctor_id = NEW.doctor_id AND status = 'completed';
        
        UPDATE public.doctor_profiles
        SET 
            rating = v_avg_rating,
            total_reviews = v_total_reviews,
            updated_at = NOW()
        WHERE user_id = NEW.doctor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating doctor rating
DROP TRIGGER IF EXISTS trigger_update_doctor_rating ON public.appointments;
CREATE TRIGGER trigger_update_doctor_rating
    AFTER UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_doctor_rating();

-- Function to create notification when new message is received
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_name TEXT;
BEGIN
    -- Determine recipient
    IF NEW.is_from_doctor THEN
        v_recipient_id := NEW.user_id;
    ELSE
        v_recipient_id := NEW.doctor_id;
    END IF;
    
    -- Get sender name
    SELECT COALESCE(full_name, email)
    INTO v_sender_name
    FROM public.users
    WHERE id = CASE WHEN NEW.is_from_doctor THEN NEW.doctor_id ELSE NEW.user_id END;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
        v_recipient_id,
        'New Message',
        'You have a new message from ' || COALESCE(v_sender_name, 'a user'),
        'message',
        '/messages'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new message notifications
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_message();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.search_medicines TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_doctors TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_appointment_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_time_slot_available TO authenticated;
