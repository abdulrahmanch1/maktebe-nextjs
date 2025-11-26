-- ============================================
-- SECURITY POLICIES (RLS) - مكتبة دار القرَاء
-- All Row Level Security Policies
-- ============================================

-- ============================================
-- 1. PROFILES TABLE POLICIES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- 2. BOOKS TABLE POLICIES
-- ============================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved books are viewable by everyone" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Admins can delete any book" ON books;

CREATE POLICY "Approved books are viewable by everyone"
  ON books FOR SELECT
  TO authenticated, anon
  USING (status = 'approved' OR uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete any book"
  ON books FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 3. COMMENTS TABLE POLICIES
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 4. COMMENT LIKES TABLE POLICIES
-- ============================================

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON comment_likes;

CREATE POLICY "Users can view all comment likes"
  ON comment_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 5. FAVORITES TABLE POLICIES
-- ============================================

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 6. READING LIST TABLE POLICIES
-- ============================================

ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can insert to their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can update their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can delete from their own reading list" ON reading_list;

CREATE POLICY "Users can view their own reading list"
  ON reading_list FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own reading list"
  ON reading_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading list"
  ON reading_list FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own reading list"
  ON reading_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 7. SUGGESTED BOOKS TABLE POLICIES
-- ============================================

ALTER TABLE suggested_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own suggestions" ON suggested_books;
DROP POLICY IF EXISTS "Authenticated users can insert suggestions" ON suggested_books;
DROP POLICY IF EXISTS "Admins can update suggestions" ON suggested_books;
DROP POLICY IF EXISTS "Admins can delete suggestions" ON suggested_books;

CREATE POLICY "Users can view their own suggestions"
  ON suggested_books FOR SELECT
  TO authenticated
  USING (auth.uid() = suggested_by OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Authenticated users can insert suggestions"
  ON suggested_books FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can update suggestions"
  ON suggested_books FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete suggestions"
  ON suggested_books FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 8. CONTACT MESSAGES TABLE POLICIES (Legacy)
-- ============================================

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON contact_messages;

CREATE POLICY "Users can view their own messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 9. MESSAGE THREADS TABLE POLICIES (New Chat System)
-- ============================================

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own threads" ON message_threads;
DROP POLICY IF EXISTS "Users can create own threads" ON message_threads;
DROP POLICY IF EXISTS "Admins can view all threads" ON message_threads;
DROP POLICY IF EXISTS "Admins can update threads" ON message_threads;

CREATE POLICY "Users can view own threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update threads"
  ON message_threads FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- 10. THREAD MESSAGES TABLE POLICIES (New Chat System)
-- ============================================

ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in own threads" ON thread_messages;
DROP POLICY IF EXISTS "Users can insert messages in own threads" ON thread_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON thread_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON thread_messages;

CREATE POLICY "Users can view messages in own threads"
  ON thread_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = thread_messages.thread_id
    AND message_threads.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in own threads"
  ON thread_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = thread_messages.thread_id
      AND message_threads.user_id = auth.uid()
    )
    AND sender_type = 'user'
    AND sender_id = auth.uid()
  );

CREATE POLICY "Admins can view all messages"
  ON thread_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can insert messages"
  ON thread_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    AND sender_type = 'admin'
  );

-- ============================================
-- 11. ANALYTICS EVENTS TABLE POLICIES
-- ============================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can delete analytics events" ON analytics_events;

CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can delete analytics events"
  ON analytics_events FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ============================================
-- SECURITY POLICIES COMPLETED ✅
-- ============================================
