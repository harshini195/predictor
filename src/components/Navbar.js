import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const nav = useNavigate();

  // Read the logged user from localStorage
  const user = JSON.parse(localStorage.getItem("loggedStudent"));

  const goHome = () => {
    if (!user) return nav("/login");       // Not logged in → go to login
    if (user.role === "faculty") return nav("/faculty-dashboard");
    return nav("/dashboard");
  };

  return (
    <AppBar position="static" sx={{ background: "#1A237E" }}>
      <Toolbar>

        {/* Logo / Title */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={goHome}
        >
          Student Performance Predictor
        </Typography>

        {/* If user is faculty */}
        {user?.role === "faculty" && (
          <>
            <Button color="inherit" onClick={() => nav("/faculty-dashboard")}>
              Dashboard
            </Button>

            <Button color="inherit" onClick={() => nav("/faculty/predict")}>
              Faculty Predict
            </Button>
          </>
        )}

        {/* If user is student */}
        {user?.role === "student" && (
          <>
            <Button color="inherit" onClick={() => nav("/dashboard")}>
              Dashboard
            </Button>

            <Button color="inherit" onClick={() => nav("/predict")}>
              Predict
            </Button>
          </>
        )}

        {/* Logout */}
        <Button color="inherit" onClick={onLogout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
}
