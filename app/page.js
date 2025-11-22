import { createClient } from '@/utils/supabase/server';
import HomePageClient from './HomePageClient';
import './HomePage.css'; // Assuming styles are needed for the server component wrapper
import { BOOKS_PAGE_SIZE } from '@/constants';

export const metadata = {
  title: 'مكتبة دار القرَاء | تصفح وقراءة آلاف الكتب العربية مجاناً',
  description: 'مكتبة دار القرَاء هي وجهتك الأولى لقراءة وتحميل آلاف الكتب والروايات العربية في جميع المجالات. اكتشف كتباً جديدة وتصفح أحدث الإصدارات واستمتع بتجربة قراءة فريدة.',
  keywords: 'مكتبة كتب, كتب عربية, قراءة كتب, تحميل كتب, كتب إلكترونية, روايات عربية, قصص, أدب عربي, كتب دينية, كتب تاريخية, كتب علمية, مكتبة إلكترونية, كتب مجانية, قراءات, ثقافة, معرفة, دار القرَاء',
  alternates: {
    canonical: '/',
  },
};

// Revalidate every hour
export const revalidate = 3600;

const HomePage = async () => {
  const supabase = await createClient();

  // Fetch approved books directly from the database on the server
  const { data: books, error, count } = await supabase
    .from('books')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .range(0, Math.max(BOOKS_PAGE_SIZE - 1, 0));

  if (error) {
    console.error('Error fetching books for homepage:', error);
    // Render an error state or fallback
    return (
      <div className="homepage-container">
        <h1 className="homepage-title">البحث عن الكتب</h1>
        <div style={{ textAlign: "center" }}>حدث خطأ أثناء تحميل الكتب. يرجى المحاولة مرة أخرى لاحقاً.</div>
      </div>
    );
  }

  return (
    <HomePageClient
      initialBooks={books || []}
      initialTotalCount={typeof count === 'number' ? count : (books?.length || 0)}
    />
  );
};

export default HomePage;
