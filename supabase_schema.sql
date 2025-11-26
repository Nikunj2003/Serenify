-- ==============================================================================
-- Serenify - Complete Database Schema
-- AI-Powered Mental Health Companion
-- ==============================================================================

-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- User Profiles (extends auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  medical_summary TEXT, -- Summary of condition for quick access
  persona_summary TEXT, -- AI-generated user persona based on activity and mood
  theme_preference TEXT DEFAULT 'system', -- Phase 1: Theme preference
  onboarding_tour_completed BOOLEAN DEFAULT false, -- Phase 1: Onboarding tour
  privacy_settings JSONB DEFAULT '{"share_journal": true, "share_mood": true, "share_activities": true}'::jsonb, -- Phase 14: Privacy
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- -----------------------------------------------------------------------------
-- Embeddings (for RAG - Retrieval Augmented Generation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini embedding dimension is 768
  type TEXT NOT NULL, -- 'document', 'condition', 'chat', 'journal'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for embeddings
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own embeddings" ON embeddings;
CREATE POLICY "Users can view their own embeddings"
ON embeddings FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own embeddings" ON embeddings;
CREATE POLICY "Users can insert their own embeddings"
ON embeddings FOR INSERT
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own embeddings" ON embeddings;
CREATE POLICY "Users can update their own embeddings"
ON embeddings FOR UPDATE
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own embeddings" ON embeddings;
CREATE POLICY "Users can delete their own embeddings"
ON embeddings FOR DELETE
USING ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- Journal Entries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mood TEXT, -- Auto-detected or user-selected
  sentiment_score FLOAT, -- AI analysis result
  tags TEXT[], -- Phase 3: Smart tags
  is_favorite BOOLEAN DEFAULT false, -- Phase 3: Favorites
  is_private BOOLEAN DEFAULT false, -- Phase 3: Private entries
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for journal entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own journal entries" ON journal_entries;
CREATE POLICY "Users can view their own journal entries"
ON journal_entries FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own journal entries" ON journal_entries;
CREATE POLICY "Users can insert their own journal entries"
ON journal_entries FOR INSERT
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own journal entries" ON journal_entries;
CREATE POLICY "Users can update their own journal entries"
ON journal_entries FOR UPDATE
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own journal entries" ON journal_entries;
CREATE POLICY "Users can delete their own journal entries"
ON journal_entries FOR DELETE
USING ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- Mood Logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL, -- 'great', 'good', 'okay', 'difficult', 'struggling'
  note TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10), -- Phase 2: Multi-dimensional
  anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 10), -- Phase 2: Multi-dimensional
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10), -- Phase 2: Multi-dimensional
  triggers TEXT[], -- Phase 2: Mood triggers
  context_note TEXT, -- Phase 2: Mood context
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for mood logs
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood logs" ON mood_logs;
CREATE POLICY "Users can view their own mood logs"
ON mood_logs FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own mood logs" ON mood_logs;
CREATE POLICY "Users can insert their own mood logs"
ON mood_logs FOR INSERT
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own mood logs" ON mood_logs;
CREATE POLICY "Users can update their own mood logs"
ON mood_logs FOR UPDATE
USING ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- Mood Goals
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mood_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_mood TEXT, -- Made nullable for flexible goal types
  goal_type TEXT, -- 'frequency', 'reduction', etc.
  target_value JSONB, -- Flexible JSON structure for different goal types
  target_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS for mood_goals
ALTER TABLE mood_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own goals" ON mood_goals;
CREATE POLICY "Users can manage their own goals" 
ON mood_goals FOR ALL 
USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Chat Sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT, -- Phase 4: Session titles
  tags TEXT[], -- Phase 4: Session tags
  is_archived BOOLEAN DEFAULT false, -- Phase 4: Archive sessions
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for chat sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view their own chat sessions"
ON chat_sessions FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can insert their own chat sessions"
ON chat_sessions FOR INSERT
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update their own chat sessions"
ON chat_sessions FOR UPDATE
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete their own chat sessions"
ON chat_sessions FOR DELETE
USING ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- Chat Messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL, -- 'user' or 'ai'
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false, -- Phase 4: Pin important messages
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat messages" ON chat_messages;
CREATE POLICY "Users can view their own chat messages"
ON chat_messages FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chat_messages;
CREATE POLICY "Users can insert their own chat messages"
ON chat_messages FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- Wellness Sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'meditation', 'breathing', 'yoga', 'mindfulness'
  duration_minutes INTEGER NOT NULL,
  audio_url TEXT,
  instructions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- User Activities (for tracking wellness activities)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- e.g., 'meditation', 'breathing', 'journaling'
  duration_seconds INT,
  session_id UUID REFERENCES wellness_sessions(id), -- Phase 3: Link to wellness sessions
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
CREATE POLICY "Users can view their own activities"
ON user_activities FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
CREATE POLICY "Users can insert their own activities"
ON user_activities FOR INSERT
WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;
CREATE POLICY "Users can delete their own activities"
ON user_activities FOR DELETE
USING ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- Achievements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name or emoji
  condition_type TEXT NOT NULL, -- 'streak', 'count', 'score'
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements"
ON user_achievements FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements"
ON user_achievements FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Phase 1: Global search indexes
CREATE INDEX IF NOT EXISTS idx_journal_content_search ON journal_entries USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_mood_logs_search ON mood_logs USING gin(to_tsvector('english', COALESCE(note, '')));

-- Phase 2: Mood triggers index
CREATE INDEX IF NOT EXISTS idx_mood_triggers ON mood_logs USING gin(triggers);

-- Phase 3: Journal tags and favorites indexes
CREATE INDEX IF NOT EXISTS idx_journal_tags ON journal_entries USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_journal_favorite ON journal_entries(user_id, is_favorite) WHERE is_favorite = true;

-- Phase 4: Chat tags and pinned messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_tags ON chat_sessions USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_pinned_messages ON chat_messages(session_id, is_pinned) WHERE is_pinned = true;

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Function to search for documents using embeddings
CREATE OR REPLACE FUNCTION match_embeddings (
  query_embedding vector(768),
  match_threshold FLOAT,
  match_count INT,
  filter_type TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  type TEXT,
  metadata JSONB
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) AS similarity,
    embeddings.type,
    embeddings.metadata
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  AND (filter_type IS NULL OR embeddings.type = filter_type)
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to handle new user creation (automatically create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, privacy_settings)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    '{"share_journal": true, "share_mood": true, "share_activities": true}'::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- STORAGE
-- ==============================================================================

-- Storage setup for 'documents' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for 'documents' bucket
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'documents' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING ( bucket_id = 'documents' AND auth.uid() = owner );

-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- Seed wellness sessions
INSERT INTO wellness_sessions (name, type, duration_minutes, instructions)
VALUES 
('Morning Mindfulness', 'meditation', 5, '{"steps": ["Sit comfortably", "Close your eyes", "Focus on your breath", "Scan your body for tension", "Set an intention for the day"]}'),
('Stress Relief Breathing', 'breathing', 3, '{"steps": ["Inhale for 4 seconds", "Hold for 7 seconds", "Exhale for 8 seconds", "Repeat 4 times"]}'),
('Sleep Preparation', 'meditation', 10, '{"steps": ["Lie down comfortably", "Dim the lights", "Focus on relaxing each muscle group", "Let go of the day''s thoughts"]}'),
('Quick Anxiety Reset', 'breathing', 2, '{"steps": ["Take a deep breath in", "Sigh it out loudly", "Shake out your hands", "Ground yourself in the present moment"]}'),
('Body Scan Meditation', 'meditation', 10, '{"steps": ["Lie down in a comfortable position.", "Close your eyes and take a few deep breaths.", "Bring your attention to your toes. Notice any sensations.", "Slowly move your attention up through your feet, ankles, and legs.", "Notice any tension and let it go as you breathe out.", "Continue scanning up through your torso, arms, and neck.", "Relax your jaw and forehead.", "Rest in this state of relaxation for a few moments."]}'),
('Box Breathing', 'breathing', 5, '{"steps": ["Sit upright in a comfortable chair.", "Breathe in through your nose for a count of 4.", "Hold your breath for a count of 4.", "Exhale through your mouth for a count of 4.", "Hold your breath for a count of 4.", "Repeat this cycle for the duration of the session."]}'),
('Gratitude Reflection', 'mindfulness', 5, '{"steps": ["Find a quiet place to sit.", "Close your eyes and take three deep breaths.", "Think of one person you are grateful for and why.", "Think of one thing about your health you are grateful for.", "Think of one simple pleasure you enjoyed today.", "Allow the feeling of gratitude to fill your chest.", "Open your eyes when you are ready."]}'),
('5-4-3-2-1 Grounding', 'mindfulness', 3, '{"steps": ["Look around and name 5 things you can see.", "Name 4 things you can feel (e.g., fabric, chair).", "Name 3 things you can hear.", "Name 2 things you can smell.", "Name 1 thing you can taste.", "Take a deep breath to finish."]}'),
('Morning Energy Stretch', 'yoga', 7, '{"steps": ["Stand with feet hip-width apart.", "Reach your arms up high and stretch.", "Fold forward at the hips, keeping knees slightly bent.", "Roll up slowly to standing.", "Do 5 shoulder rolls backwards.", "Do 5 shoulder rolls forwards.", "Twist your torso gently from side to side.", "Shake out your arms and legs."]}'),
('Sleepy Time Yoga', 'yoga', 10, '{"steps": ["Sit on the floor with legs crossed.", "Fold forward gently, resting hands on the floor.", "Hold for 5 breaths.", "Lie on your back and hug your knees to your chest.", "Rock gently side to side.", "Extend legs up a wall or rest them on a chair.", "Close your eyes and breathe deeply.", "Relax into the floor."]}')
ON CONFLICT DO NOTHING;

-- Seed initial achievements
INSERT INTO achievements (name, description, icon, condition_type, condition_value)
VALUES
('First Step', 'Complete your first daily check-in', '🌱', 'count', 1),
('Consistency is Key', 'Reach a 3-day streak', '🔥', 'streak', 3),
('Week Warrior', 'Reach a 7-day streak', '🏆', 'streak', 7),
('Journalist', 'Write 5 journal entries', '✍️', 'count', 5),
('Zen Master', 'Complete 3 wellness sessions', '🧘', 'count', 3)
ON CONFLICT DO NOTHING;
