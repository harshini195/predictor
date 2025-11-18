// ==============================
//   FINAL CLEAN APP.JS
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
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";

import StudentAuth from "./components/StudentAuth";
import PredictorForm from "./components/PredictorForm";
import Navbar from "./components/Navbar";
import StudentDashboard from "./components/StudentDashboard";
import StudyPlan from "./components/StudyPlan";
import FacultyDashboard from "./components/FacultyDashboard";
import FacultyPredictForm from "./components/FacultyPredictForm";
import InsightsPage from "./components/InsightsPage";

// -------------------------------
// PROTECTED ROUTE (ROLE BASED)
// -------------------------------
function ProtectedRoute({ user, role, children }) {
  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

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

  // Load saved user on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("loggedStudent");
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  // Login handler
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("loggedStudent", JSON.stringify(userData));
  };

  // Logout handler
  const handleLogout = () => {
    if (user) {
      const key = `history_${user.email}`;
      localStorage.removeItem(key);
    }
    localStorage.removeItem("loggedStudent");
    setUser(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {!loading && (
          <AppContent user={user} handleLogin={handleLogin} handleLogout={handleLogout} />
        )}
      </Router>
    </ThemeProvider>
  );
}

// ==============================
// CONTENT WRAPPER
// ==============================
function AppContent({ user, handleLogin, handleLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* NAVBAR except on /login */}
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
          {/* LOGIN PAGE */}
          <Route
            path="/login"
            element={
              <StudentAuth
                onLogin={(userData) => {
                  handleLogin(userData);

                  if (userData.role === "faculty") {
                    navigate("/faculty-dashboard");
                  } else {
                    navigate("/dashboard");
                  }
                }}
              />
            }
          />

          {/* =================== STUDENT ROUTES =================== */}

          {/* Default route → Student Predictor */}
          <Route
            path="/"
            element={
              <ProtectedRoute user={user} role="student">
                <PredictorForm />
              </ProtectedRoute>
            }
          />

          {/* Student dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user} role="student">
                <StudentDashboard user={user} />
              </ProtectedRoute>
            }
          />

          {/* Student predictor */}
          <Route
            path="/predict"
            element={
              <ProtectedRoute user={user} role="student">
                <PredictorForm />
              </ProtectedRoute>
            }
          />

          {/* Study Plan */}
          <Route
            path="/study-plan"
            element={
              <ProtectedRoute user={user} role="student">
                <StudyPlan />
              </ProtectedRoute>
            }
          />

          {/* Insights */}
          <Route
            path="/insights"
            element={
              <ProtectedRoute user={user} role="student">
                <InsightsPage />
              </ProtectedRoute>
            }
          />

          {/* =================== FACULTY ROUTES =================== */}

          {/* Faculty dashboard */}
          <Route
            path="/faculty-dashboard"
            element={
              <ProtectedRoute user={user} role="faculty">
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Faculty predictor */}
          <Route
            path="/faculty/predict"
            element={
              <ProtectedRoute user={user} role="faculty">
                <FacultyPredictForm />
              </ProtectedRoute>
            }
          />

          {/* ANY OTHER ROUTE */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </>
  );
}
