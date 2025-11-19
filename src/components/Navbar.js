import React from "react";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const nav = useNavigate();

  // Read logged user from localStorage
  const user = JSON.parse(localStorage.getItem("loggedStudent"));
  const token = localStorage.getItem("authToken");

  const goHome = () => {
    if (!user || !token) return nav("/login");

    if (user.role === "faculty") return nav("/faculty-dashboard");
    return nav("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedStudent");
    localStorage.removeItem("authToken");
    if (onLogout) onLogout();
    nav("/login");
  };

  return (
    <AppBar position="static" sx={{ background: "#1A237E" }}>
      <Toolbar>

        {/* App Name */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={goHome}
        >
          Student Performance Predictor
        </Typography>

        {/* If logged in */}
        {user && token && (
          <>
            {/* Faculty Navigation */}
            {user.role === "faculty" && (
              <>
                <Button color="inherit" onClick={() => nav("/faculty-dashboard")}>
                  Dashboard
                </Button>
                <Button color="inherit" onClick={() => nav("/faculty/predict")}>
                  Faculty Predict
                </Button>
              </>
            )}

            {/* Student Navigation */}
            {user.role === "student" && (
              <>
                <Button color="inherit" onClick={() => nav("/dashboard")}>
                  Dashboard
                </Button>
                <Button color="inherit" onClick={() => nav("/predict")}>
                  Predict
                </Button>
              </>
            )}

            {/* Display Email */}
            <Typography sx={{ mx: 2, fontSize: 14, opacity: 0.8 }}>
              {user.email}
            </Typography>

            {/* Logout Button */}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}

        {/* If NOT logged in */}
        {!user && (
          <Button color="inherit" onClick={() => nav("/login")}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
