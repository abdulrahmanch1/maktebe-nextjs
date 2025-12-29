-- Migration: Add featured book support
-- Created: 2025-12-28
-- Description: Add is_featured column to books table for "Book of the Week" feature

-- Add is_featured column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on featured books
CREATE INDEX IF NOT EXISTS idx_books_is_featured ON books(is_featured) WHERE is_featured = TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN books.is_featured IS 'Indicates if this book is featured as "Book of the Week"';

-- Function to ensure only one book is featured at a time
CREATE OR REPLACE FUNCTION ensure_single_featured_book()
RETURNS TRIGGER AS $$
BEGIN
  -- If the book is being set as featured, unfeatured all other books
  IF NEW.is_featured = TRUE THEN
    UPDATE books 
    SET is_featured = FALSE 
    WHERE id != NEW.id AND is_featured = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single featured book
DROP TRIGGER IF EXISTS trigger_ensure_single_featured_book ON books;
CREATE TRIGGER trigger_ensure_single_featured_book
  BEFORE INSERT OR UPDATE OF is_featured ON books
  FOR EACH ROW
  WHEN (NEW.is_featured = TRUE)
  EXECUTE FUNCTION ensure_single_featured_book();

-- Example: Set a book as featured (uncomment and replace with actual book ID)
-- UPDATE books SET is_featured = TRUE WHERE id = 'your-book-id-here';
