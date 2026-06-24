-- Step 6: Create Medicine and Pharmacy Tables
-- Tables for medicine catalog and orders

-- Medicines catalog table
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    manufacturer TEXT,
    price DECIMAL(10, 2) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    dosage_form TEXT, -- tablet, capsule, syrup, etc.
    strength TEXT, -- e.g., "500mg", "10ml"
    requires_prescription BOOLEAN DEFAULT FALSE,
    active_ingredients TEXT[],
    side_effects TEXT,
    contraindications TEXT,
    storage_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicine orders table
CREATE TABLE IF NOT EXISTS public.medicine_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    medicine_id UUID REFERENCES public.medicines(id) ON DELETE SET NULL,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    delivery_address TEXT NOT NULL,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicines
CREATE POLICY "Anyone can view available medicines"
    ON public.medicines FOR SELECT
    USING (available = TRUE);

-- RLS Policies for medicine_orders
CREATE POLICY "Users can view own medicine orders"
    ON public.medicine_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create medicine orders"
    ON public.medicine_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medicine orders"
    ON public.medicine_orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON public.medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_available ON public.medicines(available);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_user_id ON public.medicine_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_medicine_id ON public.medicine_orders(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_status ON public.medicine_orders(status);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_created_at ON public.medicine_orders(created_at);

-- Create full-text search index for medicine names
CREATE INDEX IF NOT EXISTS idx_medicines_name_gin ON public.medicines USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_medicines_description_gin ON public.medicines USING GIN (to_tsvector('english', description));

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_medicines
    BEFORE UPDATE ON public.medicines
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_medicine_orders
    BEFORE UPDATE ON public.medicine_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
