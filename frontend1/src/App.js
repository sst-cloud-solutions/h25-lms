// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// === Public Pages ===
import Login from './pages/login';
import Register from './pages/signup';

import DashboardHome from './pages/dashboard';
import Learning from './pages/learning';
import ChatLearning from './pages/chatbot';
import Tests from './pages/tests';
import Results from './pages/result';
import Profile from './pages/profile';

// PROTECTED ROUTE
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// PUBLIC ONLY ROUTE
const PublicOnlyRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* PROTECTED ROUTES */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route index element={<DashboardHome />} />
          <Route path="learn" element={<Learning />} />
          <Route path="chat" element={<ChatLearning />} />
          <Route path="tests" element={<Tests />} />
          <Route path="results" element={<Results />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
