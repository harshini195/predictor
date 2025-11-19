import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Fade,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import {
  School,
  Timer,
  Assessment,
  AssignmentTurnedIn,
  EmojiEvents,
  Insights,
} from "@mui/icons-material";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

export default function PredictorForm({ savePrediction }) {
  const navigate = useNavigate();
  const PIE_COLORS = ["#4e79a7", "#59a14f", "#f28e2b", "#e15759", "#76b7b2"];

  const [form, setForm] = useState({
    attendance: "",
    studyHours: "",
    internalTotal: "",
    assignments: "",
    participation: "",
  });

  const [marksMode, setMarksMode] = useState("total");
  const [subjectMarks, setSubjectMarks] = useState({
    sepm: "",
    cn: "",
    toc: "",
    cvcc: "",
    rm: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState("");
  const pieData = Object.keys(subjectMarks).map((key, i) => ({
    name: key.toUpperCase(),
    value: Number(subjectMarks[key]) || 0,
    color: PIE_COLORS[i],
  }));

  // Auto-update total marks
  useEffect(() => {
    if (marksMode === "individual") {
      const total = Object.values(subjectMarks)
        .map((v) => Number(v) || 0)
        .reduce((a, b) => a + b, 0);

      setForm((prev) => ({ ...prev, internalTotal: total }));
    }
  }, [subjectMarks, marksMode]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubjectMarksChange = (subj) => (e) => {
    const val = e.target.value;
    setSubjectMarks({
      ...subjectMarks,
      [subj]: val === "" ? "" : Math.max(0, Math.min(50, Number(val))),
    });
  };

  const validate = () => {
    if (
      form.attendance === "" ||
      form.studyHours === "" ||
      form.assignments === "" ||
      form.participation === ""
    )
      return false;

    if (marksMode === "total" && form.internalTotal === "") return false;

    if (marksMode === "individual") {
      if (Object.values(subjectMarks).some((v) => v === "")) return false;
    }

    return true;
  };

  // Main prediction
  const handlePredict = async () => {
    if (!validate()) {
      setError("Please fill all fields.");
      return;
    }

    setError("");
    setLoading(true);

    const token = localStorage.getItem("authToken");

    try {
      const totalMarks =
        marksMode === "total"
          ? Number(form.internalTotal)
          : Object.values(subjectMarks)
            .map((v) => Number(v))
            .reduce((a, b) => a + b, 0);

      const res = await axios.post(
        "http://localhost:5001/predict",
        {
          attendance: Number(form.attendance),
          studyHours: Number(form.studyHours),
          internalTotal: totalMarks,
          assignments: Number(form.assignments),
          participation: form.participation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(res.data.prediction);
      setConfidence((res.data.confidence * 100).toFixed(1));

      // 🔥 CALL THE FUNCTION TO SAVE THE PREDICTION IN App.js
      if (savePrediction) {
        savePrediction({
          date: new Date().toISOString(),
          prediction: res.data.prediction,
          confidence: res.data.confidence,
          inputs: { ...form, internalTotal: totalMarks },
          subjectMarks: marksMode === "individual" ? subjectMarks : undefined,
        });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError("Prediction failed. Check backend.");
      }
    }

    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Student Performance Predictor
      </Typography>

      <Grid container spacing={3}>

        {/* LEFT FORM */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Enter Student Details
            </Typography>

            <Grid container spacing={2}>
              {/* Attendance */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Attendance (%)"
                  type="number"
                  value={form.attendance}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      attendance: val === "" ? "" : Math.max(0, Math.min(100, Number(val))),
                    });
                  }}

                  InputProps={{ startAdornment: <School sx={{ mr: 1 }} /> }}
                />
              </Grid>

              {/* Study Hours */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Study Hours per day"
                  type="number"
                  value={form.studyHours}

                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      studyHours: val === "" ? "" : Math.max(0, Math.min(6, Number(val))),
                    });
                  }}


                  InputProps={{ startAdornment: <Timer sx={{ mr: 1 }} /> }}
                />
              </Grid>

              {/* Assignments */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Assignments Submitted (out of 6)"
                  type="number"
                  value={form.assignments}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      assignments: val === "" ? "" : Math.max(0, Math.min(6, Number(val))),
                    });
                  }}

                  InputProps={{ startAdornment: <AssignmentTurnedIn sx={{ mr: 1 }} /> }}
                />
              </Grid>

              {/* MARKS INPUT MODE */}
              <Grid item xs={12}>
                <RadioGroup
                  row
                  value={marksMode}
                  onChange={(e) => setMarksMode(e.target.value)}
                >
                  <FormControlLabel value="total" control={<Radio />} label="Total Marks" />
                  <FormControlLabel value="individual" control={<Radio />} label="Subject-wise Marks" />
                </RadioGroup>
              </Grid>

              {/* Total marks */}
              {marksMode === "total" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Total Internal Marks (out of 250)"
                    type="number"
                    value={form.internalTotal}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        internalTotal: val === "" ? "" : Math.max(0, Math.min(250, Number(val))),
                      });
                    }}

                    InputProps={{ startAdornment: <Assessment sx={{ mr: 1 }} /> }}
                  />
                </Grid>
              )}

              {/* Subject-wise marks */}
              {marksMode === "individual" &&
                [
                  { key: "sepm", label: "SEPM" },
                  { key: "cn", label: "CN" },
                  { key: "toc", label: "TOC" },
                  { key: "cvcc", label: "CV/CC" },
                  { key: "rm", label: "RM" },
                ].map((subj) => (
                  <Grid item xs={12} sm={6} key={subj.key}>
                    <TextField
                      fullWidth
                      label={subj.label}
                      type="number"
                      value={subjectMarks[subj.key]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubjectMarks({
                          ...subjectMarks,
                          [subj.key]: val === "" ? "" : Math.max(0, Math.min(50, Number(val))),
                        });
                      }}
                    />
                  </Grid>
                ))}

              {/* Participation */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Participation Level"
                  value={form.participation}
                  onChange={handleChange("participation")}
                  InputProps={{ startAdornment: <EmojiEvents sx={{ mr: 1 }} /> }}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </TextField>
              </Grid>

              {/* Error */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              {/* Predict Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 2 }}
                  disabled={loading}
                  onClick={handlePredict}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Predict Performance"}
                </Button>
              </Grid>

            </Grid>
          </Paper>
        </Grid>

        {/* RIGHT RESULT */}
        <Grid item xs={12} md={6}>

          {/* PASS / FAIL CARD ALWAYS SHOWS FIRST */}
          {result ? (
            <Fade in timeout={500}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  mb: 2,
                  background:
                    result === "Pass"
                      ? "linear-gradient(135deg,#4CAF50,#2E7D32)"
                      : "linear-gradient(135deg,#E53935,#B71C1C)",
                  color: "white",
                }}
              >
                <CardContent>
                  <Box sx={{ textAlign: "center" }}>
                    <Insights sx={{ fontSize: 60, mb: 1 }} />
                    <Typography variant="h4">Prediction: {result}</Typography>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Confidence: {confidence}%
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={confidence}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "rgba(255,255,255,0.3)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center", mb: 2 }}>
              <Typography color="text.secondary">Prediction will appear here</Typography>
            </Paper>
          )}

          {/* SUBJECT-WISE PIE CHART BELOW PASS/FAIL CARD */}
          {marksMode === "individual" && result && (
            <Fade in timeout={600}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "white",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                  Subject-wise Mark Distribution
                </Typography>

                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={90}
                      paddingAngle={4}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      labelLine={true}     // ← permanent labels
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Fade>
          )}
        </Grid>

      </Grid>
    </Box>
  );
}
