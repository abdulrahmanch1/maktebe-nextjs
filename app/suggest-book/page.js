import SuggestBookClient from './SuggestBookClient';
import './SuggestBookPage.css';

export const metadata = {
  title: 'اقترح كتاباً - مكتبة',
  description: 'اقترح كتاباً جديداً لإضافته إلى المكتبة.',
};

const SuggestBookPage = () => {
  return (
    <div className="suggest-book-page">
      <SuggestBookClient />
    </div>
  );
};

export default SuggestBookPage;