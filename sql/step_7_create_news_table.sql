-- Step 7: Create News and Content Tables
-- Table for health news and articles

-- News/Articles table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    image_url TEXT,
    source TEXT,
    source_url TEXT,
    tags TEXT[],
    published BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news
CREATE POLICY "Anyone can view published news"
    ON public.news FOR SELECT
    USING (published = TRUE);

CREATE POLICY "Authors can view own news"
    ON public.news FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can create news"
    ON public.news FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own news"
    ON public.news FOR UPDATE
    USING (auth.uid() = author_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(published);
CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON public.news(author_id);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_news_title_gin ON public.news USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_news_content_gin ON public.news USING GIN (to_tsvector('english', content));

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_news
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
