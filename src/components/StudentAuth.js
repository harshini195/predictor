<<<<<<< HEAD
import React, { useState } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import authBg from '../images/bg_5.jpg';
=======
import React, { useState } from "react";
import SchoolIcon from "@mui/icons-material/School";
import authBg from "../images/bg_5.png";
>>>>>>> 618287cb87e0ccadaec87fa42172fd9a85782994
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Container,
    Tabs,
    Tab,
    Alert,
    InputAdornment,
    IconButton,
    Grid,
    CircularProgress,
    Fade,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Person,
    Email,
    Lock,
    Badge,
} from "@mui/icons-material";
import axios from "axios";

const API = "http://127.0.0.1:5001";   // Backend SQLite API

function TabPanel({ children, value, index }) {
    return value === index && <Box sx={{ p: 3 }}>{children}</Box>;
}

export default function StudentAuth({ onLogin }) {
    const [userType, setUserType] = useState("");
    const [tabValue, setTabValue] = useState(0);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        usn: "",
        department: "",
        Semester: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleInput = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    // ----------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------
    const validate = () => {
        let e = {};

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            e.email = "Valid email required";
        }

        if (!formData.password) e.password = "Password required";

        if (tabValue === 1) {
            if (!formData.name.trim()) e.name = "Full name required";

            if (!formData.confirmPassword)
                e.confirmPassword = "Please confirm password";
            else if (formData.password !== formData.confirmPassword)
                e.confirmPassword = "Passwords do not match";

            if (userType === "student") {
                if (!formData.usn.trim()) e.usn = "USN required";
                if (!formData.Semester.trim()) e.Semester = "Semester required";
                if (!formData.department.trim())
                    e.department = "Department required";
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ----------------------------------------------------
    // SUBMIT HANDLER (LOGIN + SIGNUP)
    // ----------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setErrors({});

        try {
            // ---------------------------
            // LOGIN
            // ---------------------------
            if (tabValue === 0) {
                const res = await axios.post(`${API}/login`, {
                    email: formData.email.toLowerCase(),
                    password: formData.password,
                });

                const user = res.data;

                // Store auth info
                localStorage.setItem("authToken", user.token);
                localStorage.setItem("authUser", JSON.stringify(user));

                setSuccess(true);
                setLoading(false);

                onLogin(user);
            }

            // ---------------------------
            // SIGNUP
            // ---------------------------
            else {
                const payload = {
                    name: formData.name,
                    email: formData.email.toLowerCase(),
                    password: formData.password,
                    role: userType,
                    usn: userType === "student" ? formData.usn : null,
                    department: userType === "student" ? formData.department : null,
                    Semester: userType === "student" ? formData.Semester : null,
                };

                const res = await axios.post(`${API}/signup`, payload);

                const user = res.data;

                localStorage.setItem("authToken", user.token);
                localStorage.setItem("authUser", JSON.stringify(user));

                setSuccess(true);
                setLoading(false);

                onLogin(user);
            }
        } catch (err) {
            setLoading(false);
            setErrors({
                general:
                    err.response?.data?.error || "Server error — please try again.",
            });
        }
    };

    // ----------------------------------------------------
    // UI
    // ----------------------------------------------------
    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundImage: `url(${authBg})`,
                backgroundSize: "cover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4} alignItems="center">
                    {/* LEFT */}
                    <Grid item xs={12} md={6}>
                        <Fade in timeout={800}>
<<<<<<< HEAD
                            <Box sx={{ color: "white", textAlign: { xs: "center", md: "left" } }}>
=======
                            <Box sx={{ color: "black" }}>
>>>>>>> 618287cb87e0ccadaec87fa42172fd9a85782994
                                <SchoolIcon sx={{ fontSize: 70, mb: 1 }} />
                                <Typography variant="h3" fontWeight="bold">
                                    AI Student Performance Predictor
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 1, opacity: 0.8 }}>
                                    Predict, analyse, and improve academic success.
                                </Typography>
                            </Box>
                        </Fade>
                    </Grid>

                    {/* RIGHT */}
                    <Grid item xs={12} md={6}>
                        <Fade in timeout={1000}>
                            <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
                                {/* ROLE SELECTION */}
                                {!userType && (
                                    <Box
                                        sx={{
                                            p: 6,
                                            textAlign: "center",
                                            background: "white",
                                            borderRadius: 5,
                                            boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
                                            minHeight: 30,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                mb: 4,
                                                fontWeight: 700,
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            Choose your role
                                        </Typography>

                                        <Box sx={{ display: "flex", gap: 4 }}>
                                            {/* STUDENT BUTTON */}
                                            <Button
                                                variant="contained"
                                                sx={{
                                                    px: 8,
                                                    py: 5,
                                                    fontSize: "1.2rem",
                                                    borderRadius: 4,
                                                    background: "linear-gradient(135deg, #4E73DF, #1CC7D0)",
                                                    boxShadow: "0px 4px 16px rgba(0,0,0,0.2)",
                                                    "&:hover": {
                                                        background: "linear-gradient(135deg, #3B5DC4, #17AFC0)",
                                                        boxShadow: "0px 6px 22px rgba(0,0,0,0.25)",
                                                    },
                                                }}
                                                onClick={() => setUserType("student")}
                                            >
                                                STUDENT
                                            </Button>

                                            {/* FACULTY BUTTON */}
                                            <Button
                                                variant="contained"
                                                sx={{
                                                    px: 8,
                                                    py: 5,
                                                    fontSize: "1.2rem",
                                                    borderRadius: 4,
                                                    background: "linear-gradient(135deg, #4E73DF, #1CC7D0)",
                                                    boxShadow: "0px 4px 16px rgba(0,0,0,0.2)",
                                                    "&:hover": {
                                                        background: "linear-gradient(135deg, #3B5DC4, #17AFC0)",
                                                        boxShadow: "0px 6px 22px rgba(0,0,0,0.25)",
                                                    },
                                                }}
                                                onClick={() => setUserType("faculty")}
                                            >
                                                FACULTY
                                            </Button>
                                        </Box>
                                    </Box>
                                )}


                                {/* FORM SECTION */}
                                {userType && (
                                    <>
                                        {/* Header */}
                                        <Box
                                            sx={{
                                                background: "linear-gradient(135deg,#4E73DF,#1CC7D0)",
                                                p: 3,
                                                color: "white",
                                                textAlign: "center",
                                            }}
                                        >
                                            <Typography variant="h5" fontWeight={600}>
                                                {tabValue === 0 ? "Login" : "Create Account"} ({userType})
                                            </Typography>
                                        </Box>

                                        {/* Tabs */}
                                        <Tabs
                                            value={tabValue}
                                            onChange={(e, v) => setTabValue(v)}
                                            variant="fullWidth"
                                        >
                                            <Tab label="Log In" />
                                            <Tab label="Sign Up" />
                                        </Tabs>

                                        {/* Errors */}
                                        {errors.general && (
                                            <Alert severity="error" sx={{ m: 2 }}>
                                                {errors.general}
                                            </Alert>
                                        )}
                                        {success && (
                                            <Alert severity="success" sx={{ m: 2 }}>
                                                Success!
                                            </Alert>
                                        )}

                                        {/* LOGIN TAB */}
                                        <TabPanel value={tabValue} index={0}>
                                            <form onSubmit={handleSubmit}>
                                                <TextField
                                                    fullWidth
                                                    label="Email"
                                                    onChange={handleInput("email")}
                                                    sx={{ mb: 2 }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Password"
                                                    type={showPassword ? "text" : "password"}
                                                    onChange={handleInput("password")}
                                                    sx={{ mb: 2 }}
                                                />

                                                <Button
                                                    fullWidth
                                                    type="submit"
                                                    variant="contained"
                                                    disabled={loading}
                                                >
                                                    {loading ? <CircularProgress size={24} /> : "Log In"}
                                                </Button>
                                            </form>
                                        </TabPanel>

                                        {/* SIGNUP TAB */}
                                        <TabPanel value={tabValue} index={1}>
                                            <form onSubmit={handleSubmit}>
                                                <TextField
                                                    fullWidth
                                                    label="Full Name"
                                                    onChange={handleInput("name")}
                                                    sx={{ mb: 2 }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Email"
                                                    onChange={handleInput("email")}
                                                    sx={{ mb: 2 }}
                                                />

                                                {/* Student-only fields */}
                                                {userType === "student" && (
                                                    <>
                                                        <TextField
                                                            fullWidth
                                                            label="USN"
                                                            onChange={handleInput("usn")}
                                                            sx={{ mb: 2 }}
                                                        />
                                                        <TextField
                                                            fullWidth
                                                            label="Department"
                                                            onChange={handleInput("department")}
                                                            sx={{ mb: 2 }}
                                                        />
                                                        <TextField
                                                            fullWidth
                                                            label="Semester"
                                                            onChange={handleInput("Semester")}
                                                            sx={{ mb: 2 }}
                                                        />
                                                    </>
                                                )}

                                                <TextField
                                                    fullWidth
                                                    label="Password"
                                                    type={showPassword ? "text" : "password"}
                                                    onChange={handleInput("password")}
                                                    sx={{ mb: 2 }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Confirm Password"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    onChange={handleInput("confirmPassword")}
                                                    sx={{ mb: 2 }}
                                                />

                                                <Button
                                                    fullWidth
                                                    type="submit"
                                                    variant="contained"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <CircularProgress size={24} />
                                                    ) : (
                                                        "Create Account"
                                                    )}
                                                </Button>
                                            </form>
                                        </TabPanel>
                                    </>
                                )}
                            </Paper>
                        </Fade>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
