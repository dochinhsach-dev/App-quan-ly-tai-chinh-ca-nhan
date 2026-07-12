import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import { Transactions, Budgets, Goals, Reminders, SettingsPage } from './pages/index.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets"      element={<Budgets />} />
          <Route path="/insights"     element={<Insights />} />
          <Route path="/goals"        element={<Goals />} />
          <Route path="/reminders"    element={<Reminders />} />
          <Route path="/settings"     element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
