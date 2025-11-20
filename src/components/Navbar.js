import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const nav = useNavigate();

  const user = JSON.parse(localStorage.getItem("loggedStudent"));
  const token = localStorage.getItem("authToken");

  // Profile Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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

        {/* Website Title */}
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
            {/* Faculty Nav */}
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

            {/* Student Nav */}
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

            {/* 🔹 PROFILE BUTTON (avatar + dropdown menu) */}
            <IconButton onClick={handleProfileClick} sx={{ ml: 1 }}>
              <Avatar sx={{ bgcolor: "#4E73DF" }}>
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem disabled><strong>{user.name}</strong></MenuItem>
              <MenuItem disabled>USN: {user.usn || "N/A"}</MenuItem>
              <MenuItem disabled>Email: {user.email}</MenuItem>
              <MenuItem disabled>Dept: {user.department || "N/A"}</MenuItem>
              <MenuItem disabled>Sem: {user.semester || "N/A"}</MenuItem>

              <MenuItem onClick={() => { handleMenuClose(); nav("/profile"); }}>
                View Full Profile
              </MenuItem>

              <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }}>
                Logout
              </MenuItem>
            </Menu>
          </>
        )}

        {/* If not logged in */}
        {!user && (
          <Button color="inherit" onClick={() => nav("/login")}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
