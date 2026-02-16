import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HouseProvider } from './contexts/HouseContext';
import { PlantProvider } from './contexts/PlantContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { InstallPrompt } from './components/common/InstallPrompt';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const PlantDetail = lazy(() => import('./pages/PlantDetail').then(m => ({ default: m.PlantDetail })));
const Stats = lazy(() => import('./pages/Stats').then(m => ({ default: m.Stats })));
const Houses = lazy(() => import('./pages/Houses').then(m => ({ default: m.Houses })));
const HouseDetail = lazy(() => import('./pages/HouseDetail').then(m => ({ default: m.HouseDetail })));
const JoinHouse = lazy(() => import('./pages/JoinHouse').then(m => ({ default: m.JoinHouse })));
const Reminders = lazy(() => import('./pages/Reminders').then(m => ({ default: m.Reminders })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <HouseProvider>
            <PlantProvider>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/plant/:id"
                    element={
                      <ProtectedRoute>
                        <PlantDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reminders"
                    element={
                      <ProtectedRoute>
                        <Reminders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <Calendar />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stats"
                    element={
                      <ProtectedRoute>
                        <Stats />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/houses"
                    element={
                      <ProtectedRoute>
                        <Houses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/houses/:houseId"
                    element={
                      <ProtectedRoute>
                        <HouseDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/join/:code"
                    element={
                      <ProtectedRoute>
                        <JoinHouse />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
              <InstallPrompt />
            </PlantProvider>
          </HouseProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
