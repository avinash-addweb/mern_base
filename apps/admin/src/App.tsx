import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import AdminLayout from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
