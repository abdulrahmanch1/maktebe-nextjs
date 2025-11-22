import FavoritesClient from './FavoritesClient';

export const metadata = {
  title: 'كتبي المفضلة | مكتبة دار القرَاء',
  description: 'تصفح قائمة كتبك المفضلة في مكتبة دار القرَاء. احتفظ بالكتب التي تحبها للرجوع إليها لاحقاً.',
  alternates: {
    canonical: '/favorites',
  },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
