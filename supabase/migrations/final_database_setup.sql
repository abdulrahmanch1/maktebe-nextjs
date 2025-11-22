-- ============================================
-- COMPLETE DATABASE SETUP - SAFE FOR EXISTING DB
-- مكتبة دار القرَاء - إعداد شامل وآمن
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='profiles') THEN
    -- Table exists, add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='role') THEN
      ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='profilepicture') THEN
      ALTER TABLE profiles ADD COLUMN profilepicture TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='updated_at') THEN
      ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============================================
-- 2. BOOKS TABLE
-- ============================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='books') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='books' AND column_name='uploaded_by') THEN
      ALTER TABLE books ADD COLUMN uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='books' AND column_name='updated_at') THEN
      ALTER TABLE books ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='books' AND column_name='status') THEN
      ALTER TABLE books ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON books(uploaded_by);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved books are viewable by everyone" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Admins can delete any book" ON books;

CREATE POLICY "Approved books are viewable by everyone"
  ON books FOR SELECT TO authenticated, anon
  USING (status = 'approved' OR uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can insert books"
  ON books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete any book"
  ON books FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 3. COMMENTS TABLE
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='comments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='comments' AND column_name='updated_at') THEN
      ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_book ON comments(book_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 4. FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_book ON favorites(book_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 5. READING LIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reading_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'to_read' CHECK (status IN ('to_read', 'reading', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_list_user ON reading_list(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_book ON reading_list(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_status ON reading_list(status);

ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can insert to their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can update their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can delete from their own reading list" ON reading_list;

CREATE POLICY "Users can view their own reading list"
  ON reading_list FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own reading list"
  ON reading_list FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading list"
  ON reading_list FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own reading list"
  ON reading_list FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 6. SUGGESTED BOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS suggested_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  category TEXT,
  suggested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggested_books_status ON suggested_books(status);
CREATE INDEX IF NOT EXISTS idx_suggested_books_user ON suggested_books(suggested_by);

ALTER TABLE suggested_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own suggestions" ON suggested_books;
DROP POLICY IF EXISTS "Authenticated users can insert suggestions" ON suggested_books;
DROP POLICY IF EXISTS "Admins can update suggestions" ON suggested_books;
DROP POLICY IF EXISTS "Admins can delete suggestions" ON suggested_books;

CREATE POLICY "Users can view their own suggestions"
  ON suggested_books FOR SELECT TO authenticated
  USING (auth.uid() = suggested_by OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Authenticated users can insert suggestions"
  ON suggested_books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can update suggestions"
  ON suggested_books FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete suggestions"
  ON suggested_books FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 7. ANALYTICS EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  page_path TEXT,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_book ON analytics_events(book_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can delete analytics events" ON analytics_events;

CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Admins can view analytics events"
  ON analytics_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete analytics events"
  ON analytics_events FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_reading_list_updated_at ON reading_list;
DROP TRIGGER IF EXISTS update_suggested_books_updated_at ON suggested_books;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_list_updated_at
  BEFORE UPDATE ON reading_list FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggested_books_updated_at
  BEFORE UPDATE ON suggested_books FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETED ✅
-- ============================================
