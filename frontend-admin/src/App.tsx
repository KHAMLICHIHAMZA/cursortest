import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Agencies from './pages/Agencies';
import Users from './pages/Users';
import Planning from './pages/Planning';
import Analytics from './pages/Analytics';
import Subscriptions from './pages/Subscriptions';
import CompanyHealth from './pages/CompanyHealth';
import Layout from './components/Layout';
import { getStoredUser } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="agencies" element={<Agencies />} />
          <Route path="users" element={<Users />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="company-health" element={<CompanyHealth />} />
          <Route path="company-health/:companyId" element={<CompanyHealth />} />
          <Route path="planning" element={<Planning />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;






