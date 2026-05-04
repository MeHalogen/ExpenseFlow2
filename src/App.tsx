import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddEntryPage  from './pages/AddEntryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BottomNav     from './components/BottomNav';
import { useExpenses } from './hooks/useExpenses';

export default function App() {
  const store = useExpenses();

  return (
    <div className="flex flex-col h-full bg-ink overflow-hidden">
      {/* Page area — grows, scrolls inside pages */}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"          element={<DashboardPage  {...store} />} />
          <Route path="/add"       element={<AddEntryPage   refresh={store.refresh} />} />
          <Route path="/analytics" element={<AnalyticsPage  expenses={store.expenses} loading={store.loading} />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
