// ==============================
//   FINAL WORKING APP.JS (SAVE PREDICTION + DASHBOARD UPDATE)
// ==============================
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box
} from "@mui/material";

import axios from "axios";

import StudentAuth from "./components/StudentAuth";
import PredictorForm from "./components/PredictorForm";
import Navbar from "./components/Navbar";
import StudentDashboard from "./components/StudentDashboard";
import StudyPlan from "./components/StudyPlan";
import FacultyDashboard from "./components/FacultyDashboard";
import FacultyPredictForm from "./components/FacultyPredictForm";
import InsightsPage from "./components/InsightsPage";

// -------------------------------
// AXIOS TOKEN SETUP
// -------------------------------
axios.defaults.baseURL = "http://localhost:5001";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// -------------------------------
// PROTECTED ROUTE (ROLE BASED)
// -------------------------------
function ProtectedRoute({ user, role, children }) {
  const token = localStorage.getItem("authToken");

  if (!user || !token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}

// -------------------------------
// THEME
// -------------------------------
const theme = createTheme({
  palette: {
    primary: { main: "#1A237E" },
    background: { default: "#f5f5f5" },
  },
});

// ==============================
// MAIN APP
// ==============================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Prediction states — THESE FIX YOUR DASHBOARD
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Load user on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("loggedStudent");
    const savedToken = localStorage.getItem("authToken");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));

      const u = JSON.parse(savedUser);
      const key = `history_${u.email}`;

      const saved = JSON.parse(localStorage.getItem(key)) || [];
      setPredictionHistory(saved);
      setLatestPrediction(saved[0] || null);
    }

    setLoading(false);
  }, []);

  // ---------------------------
  // LOGIN
  // ---------------------------
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("loggedStudent", JSON.stringify(userData));

    const key = `history_${userData.email}`;
    const saved = JSON.parse(localStorage.getItem(key)) || [];

    setPredictionHistory(saved);
    setLatestPrediction(saved[0] || null);
  };

  // ---------------------------
  // LOGOUT
  // ---------------------------
  const handleLogout = () => {
    if (user) {
      const key = `history_${user.email}`;
      localStorage.removeItem(key);
    }

    localStorage.removeItem("loggedStudent");
    localStorage.removeItem("authToken");
    setUser(null);
  };

  // ---------------------------
  // 🔥 SAVE PREDICTION (used by PredictorForm)
  // ---------------------------
  const savePrediction = (pred) => {
    const u = JSON.parse(localStorage.getItem("loggedStudent"));
    if (!u) return;

    const key = `history_${u.email}`;
    const existing = JSON.parse(localStorage.getItem(key)) || [];

    const updated = [pred, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));

    setLatestPrediction(pred);
    setPredictionHistory(updated);
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {!loading && (
          <AppContent
            user={user}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            latestPrediction={latestPrediction}
            predictionHistory={predictionHistory}
            savePrediction={savePrediction}
          />
        )}
      </Router>
    </ThemeProvider>
  );
}

// ==============================
// CONTENT WRAPPER
// ==============================
function AppContent({
  user,
  handleLogin,
  handleLogout,
  latestPrediction,
  predictionHistory,
  savePrediction
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* NAVBAR except on login */}
      {location.pathname !== "/login" && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
          }}
        >
          <Navbar onLogout={handleLogout} user={user} />
        </Box>
      )}

      <Box sx={{ mt: location.pathname !== "/login" ? 8 : 0 }}>
        <Routes>

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <StudentAuth
                onLogin={(userData) => {
                  handleLogin(userData);
                  navigate(userData.role === "faculty" ? "/faculty-dashboard" : "/dashboard");
                }}
              />
            }
          />

          {/* ====================== STUDENT ROUTES ====================== */}

          <Route
            path="/"
            element={
              <ProtectedRoute user={user} role="student">
                <PredictorForm savePrediction={savePrediction} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/predict"
            element={
              <ProtectedRoute user={user} role="student">
                <PredictorForm savePrediction={savePrediction} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} role="student">
                <StudentDashboard
                  latestPrediction={latestPrediction}
                  predictionHistory={predictionHistory}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/study-plan"
            element={
              <ProtectedRoute user={user} role="student">
                <StudyPlan />
              </ProtectedRoute>
            }
          />

          <Route
            path="/insights"
            element={
              <ProtectedRoute user={user} role="student">
                <InsightsPage />
              </ProtectedRoute>
            }
          />

          {/* ====================== FACULTY ROUTES ====================== */}

          <Route
            path="/faculty-dashboard"
            element={
              <ProtectedRoute user={user} role="faculty">
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty/predict"
            element={
              <ProtectedRoute user={user} role="faculty">
                <FacultyPredictForm />
              </ProtectedRoute>
            }
          />

          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </>
  );
}
