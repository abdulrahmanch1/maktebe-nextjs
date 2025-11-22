import { Suspense } from 'react';
import DashboardPage from './DashboardPage';

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPage />
    </Suspense>
  );
}
