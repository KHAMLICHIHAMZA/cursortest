import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import Fines from './pages/Fines';
import Maintenance from './pages/Maintenance';
import Planning from './pages/Planning';
import Layout from './components/Layout';
import { getStoredUser } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Vérifier que l'utilisateur n'est pas SUPER_ADMIN
  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="clients" element={<Clients />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="fines" element={<Fines />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="planning" element={<Planning />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;






