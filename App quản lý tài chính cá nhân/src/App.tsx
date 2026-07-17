import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import { Transactions, Budgets, Goals, Reminders, SettingsPage } from './pages/index.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes: sign-in / sign-up ── */}
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        {/* ── Protected routes: chỉ vào được khi đã đăng nhập ── */}
        <Route
          element={
            <>
              <SignedIn>
                <DashboardLayout />
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
            </>
          }
        >
          <Route path="/"              element={<Dashboard />} />
          <Route path="/transactions"  element={<Transactions />} />
          <Route path="/budgets"       element={<Budgets />} />
          <Route path="/insights"      element={<Insights />} />
          <Route path="/goals"         element={<Goals />} />
          <Route path="/reminders"     element={<Reminders />} />
          <Route path="/settings"      element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

