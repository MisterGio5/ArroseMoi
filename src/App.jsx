import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HouseProvider } from './contexts/HouseContext';
import { PlantProvider } from './contexts/PlantContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { PlantDetail } from './pages/PlantDetail';
import { Stats } from './pages/Stats';
import { Houses } from './pages/Houses';
import { HouseDetail } from './pages/HouseDetail';
import { JoinHouse } from './pages/JoinHouse';
import { Reminders } from './pages/Reminders';
import { Calendar } from './pages/Calendar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HouseProvider>
          <PlantProvider>
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
          </PlantProvider>
        </HouseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
