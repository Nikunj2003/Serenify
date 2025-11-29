-- Create daily_insights table to cache AI responses
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  last_mood_log_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own daily insights" ON daily_insights;
CREATE POLICY "Users can view their own daily insights"
ON daily_insights FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own daily insights" ON daily_insights;
CREATE POLICY "Users can insert their own daily insights"
ON daily_insights FOR INSERT
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own daily insights" ON daily_insights;
CREATE POLICY "Users can update their own daily insights"
ON daily_insights FOR UPDATE
USING ( auth.uid() = user_id );
