import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import InterviewRoom from './pages/InterviewRoom';
import EvaluationResults from './pages/EvaluationResults';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <DashboardRouter />
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/interview/:interviewId"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <InterviewRoom />
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/results/:interviewId"
            element={
              <PrivateRoute>
                <>
                  <Navbar />
                  <EvaluationResults />
                </>
              </PrivateRoute>
            }
          />

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Dashboard Router - route based on user role
function DashboardRouter() {
  const { user } = React.useContext(require('./context/AuthContext').AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'manager') {
    return <ManagerDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
}

export default App;
