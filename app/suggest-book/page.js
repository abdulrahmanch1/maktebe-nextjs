import SuggestBookClient from './SuggestBookClient';
import './SuggestBookPage.css';

export const metadata = {
  title: 'اقترح كتاباً | مكتبة دار القرَاء',
  description: 'اقترح كتاباً جديداً لإضافته إلى مكتبة دار القرَاء.',
  alternates: {
    canonical: '/suggest-book',
  },
  robots: {
    index: false,
    follow: false,
  },
};

const SuggestBookPage = () => {
  return (
    <div className="suggest-book-page">
      <SuggestBookClient />
    </div>
  );
};

export default SuggestBookPage;
