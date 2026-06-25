import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import SeasonsPage from './pages/SeasonsPage';
import SeasonDetailPage from './pages/SeasonDetailPage';
import CropVarietyPage from './pages/CropVarietyPage';
import CycleDetailPage from './pages/CycleDetailPage';
import NewSalePage from './pages/NewSalePage';
import ComingSoon from './pages/ComingSoon';
import GeneralPurpose from './pages/GeneralPurpose';
import FarmMap from './pages/FarmMap';
// Legacy pages — still reachable at their old URLs, not in primary nav
import Dashboard from './pages/Dashboard';
import CropCycleManagement from './pages/CropCycleManagement';
import TaskDetailPage from './pages/TaskDetailPage';

const Shell = ({ children }) => (
  <PrivateRoute>
    <AppShell>{children}</AppShell>
  </PrivateRoute>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* ── Primary nav destinations ───────────────────────────────── */}
          <Route path="/seasons"                                            element={<Shell><SeasonsPage /></Shell>} />
          <Route path="/season/:season/:crop_year"                          element={<Shell><SeasonDetailPage /></Shell>} />
          <Route path="/season/:season/:crop_year/crop/:crop_name"          element={<Shell><CropVarietyPage /></Shell>} />
          <Route path="/cycle/:crop_cycle_id"                               element={<Shell><CycleDetailPage /></Shell>} />
          <Route path="/cycle/:crop_cycle_id/sales/new"                    element={<Shell><NewSalePage /></Shell>} />
          <Route path="/cycle/:crop_cycle_id/sales/:sale_id/edit"         element={<Shell><NewSalePage /></Shell>} />
          <Route path="/fields"                                             element={<Shell><ComingSoon /></Shell>} />
          <Route path="/general-purpose"          element={<Shell><GeneralPurpose /></Shell>} />
          <Route path="/farm-map"                 element={<Shell><FarmMap /></Shell>} />

          {/* ── Legacy routes (preserve existing deep links) ───────────── */}
          <Route path="/dashboard"                element={<Shell><Dashboard /></Shell>} />
          <Route path="/crop-cycle-management"    element={<Shell><CropCycleManagement /></Shell>} />
          <Route path="/crop-cycles/:cycleId/tasks/:taskId"
                                                  element={<Shell><TaskDetailPage /></Shell>} />

          {/* Default → seasons */}
          <Route path="/" element={<Navigate to="/seasons" replace />} />
          <Route path="*" element={<Navigate to="/seasons" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
