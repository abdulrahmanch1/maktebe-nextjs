-- ==============================================================================
-- COMPLETE DATABASE SCHEMA - مكتبة دار القرَاء
-- Merged from multiple migration files
-- Includes: Core Schema, Notes, Security (RLS), and Functions
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE SCHEMA (from 01_schema.sql)
-- ============================================

-- 1.1 PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  profilepicture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 BOOKS
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  category TEXT,
  year INTEGER,
  cover TEXT,
  pdf TEXT,
  readcount INTEGER DEFAULT 0,
  favoritecount INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON books(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_is_featured ON books(is_featured) WHERE is_featured = TRUE;

-- 1.3 COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_book ON comments(book_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- 1.4 COMMENT LIKES
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- 1.5 FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_book ON favorites(book_id);

-- 1.6 READING LIST
CREATE TABLE IF NOT EXISTS reading_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'to_read' CHECK (status IN ('to_read', 'reading', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_list_user ON reading_list(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_book ON reading_list(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_status ON reading_list(status);

-- 1.7 SUGGESTED BOOKS
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

-- 1.8 CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_user ON contact_messages(user_id);

-- 1.9 MESSAGE THREADS
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_threads_user_id ON message_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_status ON message_threads(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_updated ON message_threads(updated_at DESC);

-- 1.10 THREAD MESSAGES
CREATE TABLE IF NOT EXISTS thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_created_at ON thread_messages(created_at);

-- 1.11 ANALYTICS EVENTS
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

-- 1.12 AUTHORS
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  bio TEXT,
  social_life TEXT,
  image_url TEXT,
  role TEXT CHECK (role IN ('scholar', 'narrator', 'sheikh', 'author', 'other')),
  keywords TEXT[],
  achievements TEXT,
  birth_date TEXT,
  death_date TEXT,
  birth_place TEXT,
  residence_place TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure authors columns exist (idempotent check)
DO $$
BEGIN
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS social_life TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('scholar', 'narrator', 'sheikh', 'author', 'other'));
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS keywords TEXT[];
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS achievements TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS birth_date TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS death_date TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS birth_place TEXT;
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS residence_place TEXT;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_authors_role ON authors(role);

-- 1.13 BROADCASTS
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at DESC);

-- 1.14 FUNCTIONS AND TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_message_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_reading_list_updated_at ON reading_list;
DROP TRIGGER IF EXISTS update_suggested_books_updated_at ON suggested_books;
DROP TRIGGER IF EXISTS update_message_threads_updated_at ON message_threads;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reading_list_updated_at BEFORE UPDATE ON reading_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suggested_books_updated_at BEFORE UPDATE ON suggested_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads FOR EACH ROW EXECUTE FUNCTION update_message_thread_timestamp();

DROP TRIGGER IF EXISTS update_authors_updated_at ON authors;
CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.15 STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('author-images', 'author-images', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 2. NOTES SYSTEM (from 20241212_create_notes.sql)
-- ============================================

-- 2.1 Book Notes
create table if not exists book_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  book_id uuid references books(id) not null,
  note text not null,
  color text default 'yellow',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.2 Page Notes
create table if not exists page_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  book_id uuid references books(id) not null,
  page_number integer not null,
  note text not null,
  color text default 'yellow',
  req_x float, -- Optional x coordinate (percentage 0-100)
  req_y float, -- Optional y coordinate (percentage 0-100)
  width float default 200,
  height float default 150,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.3 Notes RLS
alter table book_notes enable row level security;
alter table page_notes enable row level security;

-- Policies for book_notes
DROP POLICY IF EXISTS "Users can view their own book notes" ON book_notes;
CREATE POLICY "Users can view their own book notes" ON book_notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own book notes" ON book_notes;
CREATE POLICY "Users can insert their own book notes" ON book_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own book notes" ON book_notes;
CREATE POLICY "Users can update their own book notes" ON book_notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own book notes" ON book_notes;
CREATE POLICY "Users can delete their own book notes" ON book_notes FOR DELETE USING (auth.uid() = user_id);

-- Policies for page_notes
DROP POLICY IF EXISTS "Users can view their own page notes" ON page_notes;
CREATE POLICY "Users can view their own page notes" ON page_notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own page notes" ON page_notes;
CREATE POLICY "Users can insert their own page notes" ON page_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own page notes" ON page_notes;
CREATE POLICY "Users can update their own page notes" ON page_notes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own page notes" ON page_notes;
CREATE POLICY "Users can delete their own page notes" ON page_notes FOR DELETE USING (auth.uid() = user_id);

-- 2.4 Fix for Missing Dimensions (Idempotent Check)
DO $$
BEGIN
    ALTER TABLE page_notes ADD COLUMN IF NOT EXISTS width float DEFAULT 200;
    ALTER TABLE page_notes ADD COLUMN IF NOT EXISTS height float DEFAULT 150;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;


-- ============================================
-- 3. SECURITY & RLS (from 02_security.sql)
-- ============================================

-- 3.1 Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 3.2 Books RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Approved books are viewable by everyone" ON books;
CREATE POLICY "Approved books are viewable by everyone" ON books FOR SELECT TO authenticated, anon USING (status = 'approved' OR uploaded_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
CREATE POLICY "Authenticated users can insert books" ON books FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
DROP POLICY IF EXISTS "Users can update their own books" ON books;
CREATE POLICY "Users can update their own books" ON books FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete any book" ON books;
CREATE POLICY "Admins can delete any book" ON books FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.3 Comments RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.4 Comment Likes RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all comment likes" ON comment_likes;
CREATE POLICY "Users can view all comment likes" ON comment_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert their own likes" ON comment_likes;
CREATE POLICY "Users can insert their own likes" ON comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own likes" ON comment_likes;
CREATE POLICY "Users can delete their own likes" ON comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.5 Favorites RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites" ON favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
CREATE POLICY "Users can insert their own favorites" ON favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites" ON favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.6 Reading List RLS
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own reading list" ON reading_list;
CREATE POLICY "Users can view their own reading list" ON reading_list FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert to their own reading list" ON reading_list;
CREATE POLICY "Users can insert to their own reading list" ON reading_list FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own reading list" ON reading_list;
CREATE POLICY "Users can update their own reading list" ON reading_list FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete from their own reading list" ON reading_list;
CREATE POLICY "Users can delete from their own reading list" ON reading_list FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3.7 Suggested Books RLS
ALTER TABLE suggested_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own suggestions" ON suggested_books;
CREATE POLICY "Users can view their own suggestions" ON suggested_books FOR SELECT TO authenticated USING (auth.uid() = suggested_by OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Authenticated users can insert suggestions" ON suggested_books;
CREATE POLICY "Authenticated users can insert suggestions" ON suggested_books FOR INSERT TO authenticated WITH CHECK (auth.uid() = suggested_by);
DROP POLICY IF EXISTS "Admins can update suggestions" ON suggested_books;
CREATE POLICY "Admins can update suggestions" ON suggested_books FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete suggestions" ON suggested_books;
CREATE POLICY "Admins can delete suggestions" ON suggested_books FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.8 Contact Messages RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own messages" ON contact_messages;
CREATE POLICY "Users can view their own messages" ON contact_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON contact_messages FOR INSERT TO authenticated, anon WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all messages" ON contact_messages;
CREATE POLICY "Admins can view all messages" ON contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.9 Message Threads RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own threads" ON message_threads;
CREATE POLICY "Users can view own threads" ON message_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own threads" ON message_threads;
CREATE POLICY "Users can create own threads" ON message_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all threads" ON message_threads;
CREATE POLICY "Admins can view all threads" ON message_threads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can insert threads" ON message_threads;
CREATE POLICY "Admins can insert threads" ON message_threads FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can update threads" ON message_threads;
CREATE POLICY "Admins can update threads" ON message_threads FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.10 Thread Messages RLS
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON thread_messages;
CREATE POLICY "Users can view messages in own threads" ON thread_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM message_threads WHERE message_threads.id = thread_messages.thread_id AND message_threads.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert messages in own threads" ON thread_messages;
CREATE POLICY "Users can insert messages in own threads" ON thread_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM message_threads WHERE message_threads.id = thread_messages.thread_id AND message_threads.user_id = auth.uid()) AND sender_type = 'user' AND sender_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view all messages" ON thread_messages;
CREATE POLICY "Admins can view all messages" ON thread_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can insert messages" ON thread_messages;
CREATE POLICY "Admins can insert messages" ON thread_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') AND sender_type = 'admin');

-- 3.11 Analytics Events RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON analytics_events FOR INSERT TO authenticated, anon WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
CREATE POLICY "Admins can view analytics events" ON analytics_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete analytics events" ON analytics_events;
CREATE POLICY "Admins can delete analytics events" ON analytics_events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.12 Authors RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authors are viewable by everyone" ON authors;
CREATE POLICY "Authors are viewable by everyone" ON authors FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Admins can insert authors" ON authors;
CREATE POLICY "Admins can insert authors" ON authors FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can update authors" ON authors;
CREATE POLICY "Admins can update authors" ON authors FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete authors" ON authors;
CREATE POLICY "Admins can delete authors" ON authors FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.13 Broadcasts RLS
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Broadcasts are viewable by everyone" ON broadcasts;
CREATE POLICY "Broadcasts are viewable by everyone" ON broadcasts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can create broadcasts" ON broadcasts;
CREATE POLICY "Admins can create broadcasts" ON broadcasts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete broadcasts" ON broadcasts;
CREATE POLICY "Admins can delete broadcasts" ON broadcasts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3.14 Storage RLS
-- 2.5 Page Drawings (Freehand)
CREATE TABLE IF NOT EXISTS page_drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  book_id UUID REFERENCES books(id) NOT NULL,
  page_number INTEGER NOT NULL,
  strokes JSONB NOT NULL, -- Array of stroke objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE page_drawings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own drawings" ON page_drawings;
CREATE POLICY "Users can view their own drawings" ON page_drawings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own drawings" ON page_drawings;
CREATE POLICY "Users can insert their own drawings" ON page_drawings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own drawings" ON page_drawings;
CREATE POLICY "Users can update their own drawings" ON page_drawings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own drawings" ON page_drawings;
CREATE POLICY "Users can delete their own drawings" ON page_drawings FOR DELETE USING (auth.uid() = user_id);

-- 2.6 Storage Policies (renumbered)
DROP POLICY IF EXISTS "Author images are public" ON storage.objects;
CREATE POLICY "Author images are public" ON storage.objects FOR SELECT USING ( bucket_id = 'author-images' );
DROP POLICY IF EXISTS "Admins can upload author images" ON storage.objects;
CREATE POLICY "Admins can upload author images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'author-images' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can update author images" ON storage.objects;
CREATE POLICY "Admins can update author images" ON storage.objects FOR UPDATE USING (bucket_id = 'author-images' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "Admins can delete author images" ON storage.objects;
CREATE POLICY "Admins can delete author images" ON storage.objects FOR DELETE USING (bucket_id = 'author-images' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- ============================================
-- 4. UTILITY FUNCTIONS (from 20241212000000_get_random_authors.sql)
-- ============================================

create or replace function get_random_authors(limit_count int)
returns setof authors
language sql
as $$
  select *
  from authors
  order by random()
  limit limit_count;
$$;

-- ============================================
-- END OF COMPLETE SCHEMA
-- ============================================
