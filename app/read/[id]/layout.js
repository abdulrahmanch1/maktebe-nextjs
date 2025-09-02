import { Providers } from '@/contexts/Providers';
import ThemeBodyStyle from '@/components/ThemeBodyStyle';
import '@/app/globals.css'; // Import global styles

export default function ReadLayout({ children }) {
  return (
    <Providers>
      <ThemeBodyStyle>
        {children}
      </ThemeBodyStyle>
    </Providers>
  );
}
