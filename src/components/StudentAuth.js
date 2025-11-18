import React, { useState } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import authBg from '../images/bg_5.png';
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
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person,
    Email,
    Lock,
    Badge,
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
    return (
        value === index && <Box sx={{ p: 3 }}>{children}</Box>
    );
}

export default function StudentAuth({ onLogin }) {
    const [userType, setUserType] = useState(""); // initially empty
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
        year: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleInput = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const validate = () => {
        let e = {};

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
            e.email = "Valid email required";

        if (!formData.password)
            e.password = "Password required";
        else if (tabValue === 1 && formData.password.length < 6)
            e.password = "Password must be at least 6 characters";

        if (tabValue === 1) {
            if (!formData.name.trim())
                e.name = "Full name required";

            if (!formData.department.trim())
                e.department = "Department required";

            if (!formData.confirmPassword)
                e.confirmPassword = "Please confirm your password";
            else if (formData.password !== formData.confirmPassword)
                e.confirmPassword = "Passwords do not match";

            if (userType === "student") {
                if (!formData.usn.trim())
                    e.usn = "USN / Roll Number required";

                if (!formData.year.trim())
                    e.year = "Academic year required";
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        setTimeout(() => {
            const key = userType === "faculty" ? "facultyPredictorUsers" : "studentPredictorUsers";
            let users = JSON.parse(localStorage.getItem(key)) || [];

            if (tabValue === 0) {
                // LOGIN
                const user = users.find(u => u.email === formData.email);

                if (!user) {
                    setErrors({ general: "User not found!" });
                    setLoading(false);
                    return;
                }
                if (user.password !== formData.password) {
                    setErrors({ general: "Incorrect password" });
                    setLoading(false);
                    return;
                }

                setSuccess(true);
                setTimeout(() => {
                    setLoading(false);
                    onLogin({
                        ...user,
                        role: userType,   // ADD ROLE HERE
                    });
                }, 1000);

            } else {
                // SIGN UP
                const exists = users.some(u => u.email === formData.email);
                if (exists) {
                    setErrors({ general: "User already exists" });
                    setLoading(false);
                    return;
                }
                const newUser = {
                    id: Date.now(),
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    department: formData.department,
                    createdAt: new Date().toISOString(),
                    role: userType,  // <-- IMPORTANT
                };

                if (userType === "student") {
                    newUser.usn = formData.usn;
                    newUser.year = formData.year;

                    // Add to global REAL student list (faculty will use this)
                    let globalStudents = JSON.parse(localStorage.getItem("registeredStudents")) || [];

                    // Prevent duplicates
                    const existsInGlobal = globalStudents.some(s => s.email === newUser.email);
                    if (!existsInGlobal) {
                        globalStudents.push({
                            id: newUser.id,
                            name: newUser.name,
                            email: newUser.email,
                            usn: newUser.usn,
                            department: newUser.department,
                            year: newUser.year,
                            role: "student",
                            createdAt: newUser.createdAt,
                        });
                        localStorage.setItem("registeredStudents", JSON.stringify(globalStudents));
                    }
                }

                // Save to respective user DB
                users.push(newUser);
                localStorage.setItem(key, JSON.stringify(users));

                setSuccess(true);
                setTimeout(() => {
                    setLoading(false);
                    onLogin(newUser);
                }, 1000);

            }
        }, 1200);
    };

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

                    {/* LEFT PANEL */}
                    <Grid item xs={12} md={6}>
                        <Fade in timeout={800}>
                            <Box sx={{ color: "black", textAlign: { xs: "center", md: "left" } }}>
                                <SchoolIcon sx={{ fontSize: 70, mb: 1 }} />
                                <Typography variant="h3" fontWeight="bold">
                                    AI Student Performance Predictor
                                </Typography>
                                <Typography variant="h6" sx={{ mt: 1, opacity: 0.8 }}>
                                    Predict, improve and track academic success with intelligent insights.
                                </Typography>
                            </Box>
                        </Fade>
                    </Grid>

                    {/* RIGHT PANEL */}
                    <Grid item xs={12} md={6}>
                        <Fade in timeout={1000}>
                            <Paper sx={{ overflow: "hidden", borderRadius: 4 }}>

                                {/* User type selection (first step) */}
                                {!userType && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minHeight: 320,
                                            p: 4,
                                            background: "transparent",   // removed white box
                                            borderRadius: 0,
                                            boxShadow: "none",           // removed shadow
                                            mb: 4,
                                            border: "none",              // removed blue outline
                                        }}
                                    >
                                        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                                            Choose your role
                                        </Typography>

                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                            Select whether you are a student or faculty to continue.
                                        </Typography>

                                        <Box sx={{ display: "flex", gap: 4 }}>
                                            {/* STUDENT BUTTON */}
                                            <Button
                                                variant="contained"
                                                size="large"
                                                sx={{
                                                    px: 7,
                                                    py: 3,
                                                    borderRadius: 3,
                                                    fontSize: 20,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    background: "linear-gradient(135deg, #1976d2, #1CC7D0)",
                                                    color: "#fff",
                                                }}
                                                onClick={() => setUserType("student")}
                                                startIcon={<SchoolIcon sx={{ fontSize: 36 }} />}
                                            >
                                                Student
                                            </Button>

                                            {/* FACULTY BUTTON */}
                                            <Button
                                                variant="contained"
                                                size="large"
                                                sx={{
                                                    px: 7,
                                                    py: 3,
                                                    borderRadius: 3,
                                                    fontSize: 20,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    background: "linear-gradient(135deg, #4E73DF, #1CC7D0)",
                                                    color: "#fff",
                                                }}
                                                onClick={() => setUserType("faculty")}
                                                startIcon={<Badge sx={{ fontSize: 36 }} />}
                                            >
                                                Faculty
                                            </Button>
                                        </Box>
                                    </Box>
                                )}

                                {/* Only show form after type is selected */}
                                {userType && (
                                    <>
                                        {/* Header */}
                                        <Box
                                            sx={{
                                                background: "linear-gradient(135deg, #4E73DF, #1CC7D0)",
                                                color: "white",
                                                p: 3,
                                                textAlign: "center",
                                            }}
                                        >
                                            <Typography variant="h5" fontWeight="bold">
                                                {tabValue === 0 ? `Welcome Back! (${userType.charAt(0).toUpperCase() + userType.slice(1)})` : `Create Your ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account`}
                                            </Typography>
                                            <Typography variant="body2">
                                                {tabValue === 0
                                                    ? "Login to access predictions and insights"
                                                    : "Sign up to get started"}
                                            </Typography>
                                        </Box>

                                        {/* Tabs */}
                                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                                            <Tab label="Log In" />
                                            <Tab label="Sign Up" />
                                        </Tabs>

                                        {errors.general && (
                                            <Alert severity="error" sx={{ m: 2 }}>
                                                {errors.general}
                                            </Alert>
                                        )}

                                        {success && (
                                            <Alert severity="success" sx={{ m: 2 }}>
                                                {tabValue === 0 ? "Logging in..." : "Account created successfully!"}
                                            </Alert>
                                        )}

                                        {/* LOGIN */}
                                        <TabPanel value={tabValue} index={0}>
                                            <form onSubmit={handleSubmit}>

                                                <TextField
                                                    fullWidth
                                                    label="Email Address"
                                                    value={formData.email}
                                                    onChange={handleInput("email")}
                                                    error={!!errors.email}
                                                    helperText={errors.email}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Email />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.password}
                                                    onChange={handleInput("password")}
                                                    error={!!errors.password}
                                                    helperText={errors.password}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Lock />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />

                                                <Button
                                                    fullWidth
                                                    type="submit"
                                                    variant="contained"
                                                    sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
                                                    disabled={loading}
                                                >
                                                    {loading ? <CircularProgress size={24} /> : "Log In"}
                                                </Button>

                                            </form>
                                        </TabPanel>

                                        {/* SIGN UP */}
                                        <TabPanel value={tabValue} index={1}>
                                            <form onSubmit={handleSubmit}>

                                                <TextField
                                                    fullWidth
                                                    label="Full Name"
                                                    value={formData.name}
                                                    onChange={handleInput("name")}
                                                    error={!!errors.name}
                                                    helperText={errors.name}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Person />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Email Address"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={handleInput("email")}
                                                    error={!!errors.email}
                                                    helperText={errors.email}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Email />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                {/* Only for students */}
                                                {userType === "student" && (
                                                    <TextField
                                                        fullWidth
                                                        label="USN / Roll Number"
                                                        value={formData.usn}
                                                        onChange={handleInput("usn")}
                                                        error={!!errors.usn}
                                                        helperText={errors.usn}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Badge />
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{ mb: 2 }}
                                                    />
                                                )}

                                                <TextField
                                                    fullWidth
                                                    label="Department"
                                                    value={formData.department}
                                                    onChange={handleInput("department")}
                                                    error={!!errors.department}
                                                    helperText={errors.department}
                                                    sx={{ mb: 2 }}
                                                />

                                                {/* Only for students */}
                                                {userType === "student" && (
                                                    <TextField
                                                        fullWidth
                                                        label="Year / Semester"
                                                        value={formData.year}
                                                        onChange={handleInput("year")}
                                                        error={!!errors.year}
                                                        helperText={errors.year}
                                                        sx={{ mb: 2 }}
                                                    />
                                                )}

                                                <TextField
                                                    fullWidth
                                                    label="Password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.password}
                                                    onChange={handleInput("password")}
                                                    error={!!errors.password}
                                                    helperText={errors.password}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Lock />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{ mb: 2 }}
                                                />

                                                <TextField
                                                    fullWidth
                                                    label="Confirm Password"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={formData.confirmPassword}
                                                    onChange={handleInput("confirmPassword")}
                                                    error={!!errors.confirmPassword}
                                                    helperText={errors.confirmPassword}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Lock />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />

                                                <Button
                                                    fullWidth
                                                    type="submit"
                                                    variant="contained"
                                                    sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
                                                    disabled={loading}
                                                >
                                                    {loading ? <CircularProgress size={24} /> : "Create Account"}
                                                </Button>

                                            </form>
                                        </TabPanel>

                                        <Box sx={{ textAlign: "center", py: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                By continuing, you agree to our Terms & Privacy Policy.
                                            </Typography>
                                        </Box>
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
