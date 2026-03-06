import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './utils/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CropCycleManagement from './pages/CropCycleManagement';
import TaskDetailPage from './pages/TaskDetailPage';
import GeneralPurpose from './pages/GeneralPurpose';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/crop-cycle-management"
            element={
              <PrivateRoute>
                <Layout>
                  <CropCycleManagement />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Task Detail Page Route */}
          <Route
            path="/crop-cycles/:cycleId/tasks/:taskId"
            element={
              <PrivateRoute>
                <Layout>
                  <TaskDetailPage />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* General Expense AFTER Crop Cycle */}
          <Route
            path="/general-purpose"
            element={
              <PrivateRoute>
                <Layout>
                  <GeneralPurpose />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
