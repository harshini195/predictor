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
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function PredictorForm({ onPrediction }) {
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

  /* --------------------------------------------------
     AUTO-SUM INDIVIDUAL MARKS → UPDATE TOTAL
  -----------------------------------------------------*/
  useEffect(() => {
    if (marksMode === "individual") {
      const total = Object.values(subjectMarks)
        .map((v) => Number(v) || 0)
        .reduce((a, b) => a + b, 0);

      setForm((prev) => ({ ...prev, internalTotal: total }));
    }
  }, [subjectMarks, marksMode]);

  /* --------------------------------------------------
     ONCHANGE HELPERS
  -----------------------------------------------------*/
  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubjectMarksChange = (subj) => (e) => {
    let v = e.target.value;
    if (v === "") {
      setSubjectMarks({ ...subjectMarks, [subj]: "" });
    } else {
      v = Math.max(0, Math.min(50, Number(v)));
      setSubjectMarks({ ...subjectMarks, [subj]: v });
    }
  };

  /* --------------------------------------------------
     VALIDATION
  -----------------------------------------------------*/
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

  /* --------------------------------------------------
     PREDICT FUNCTION
  -----------------------------------------------------*/
  const handlePredict = async () => {
    if (!validate()) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const totalMarks =
        marksMode === "total"
          ? Number(form.internalTotal)
          : Object.values(subjectMarks)
              .map((v) => Number(v) || 0)
              .reduce((a, b) => a + b, 0);

      const res = await axios.post("http://127.0.0.1:5001/predict", {
        attendance: Number(form.attendance),
        studyHours: Number(form.studyHours),
        internalTotal: totalMarks,
        assignments: Number(form.assignments),
        participation: form.participation,
      });

      setResult(res.data.prediction);
      setConfidence((res.data.confidence * 100).toFixed(1));

      onPrediction({
        date: new Date().toISOString(),
        prediction: res.data.prediction,
        confidence: res.data.confidence,
        inputs: { ...form, internalTotal: totalMarks },
        subjectMarks: marksMode === "individual" ? subjectMarks : undefined,
      });
    } catch (err) {
      console.log(err);
      setError("Prediction failed. Check backend.");
    }

    setLoading(false);
  };

  /* --------------------------------------------------
     UI
  -----------------------------------------------------*/
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Student Performance Predictor
      </Typography>

      <Grid container spacing={3}>
        {/* LEFT SIDE FORM */}
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attendance: Math.max(0, Math.min(100, Number(e.target.value))),
                    })
                  }
                  inputProps={{ min: 0, max: 100 }}
                  InputProps={{ startAdornment: <School sx={{ mr: 1 }} /> }}
                />
              </Grid>

              {/* Study hours */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Study Hours per day"
                  type="number"
                  value={form.studyHours}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      studyHours: Math.max(0, Math.min(6, Number(e.target.value))),
                    })
                  }
                  inputProps={{ min: 0, max: 6 }}
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assignments: Math.max(0, Math.min(6, Number(e.target.value))),
                    })
                  }
                  inputProps={{ min: 0, max: 6 }}
                  InputProps={{
                    startAdornment: <AssignmentTurnedIn sx={{ mr: 1 }} />,
                  }}
                />
              </Grid>

              {/* MARKS MODE */}
              <Grid item xs={12}>
                <RadioGroup
                  row
                  value={marksMode}
                  onChange={(e) => setMarksMode(e.target.value)}
                >
                  <FormControlLabel value="total" control={<Radio />} label="Enter Total Marks" />
                  <FormControlLabel value="individual" control={<Radio />} label="Enter Individual Subject Marks" />
                </RadioGroup>
              </Grid>

              {/* Total Marks */}
              {marksMode === "total" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Internal Marks (out of 250)"
                    value={form.internalTotal}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        internalTotal: Math.max(0, Math.min(250, Number(e.target.value))),
                      })
                    }
                    inputProps={{ min: 0, max: 250 }}
                    InputProps={{ startAdornment: <Assessment sx={{ mr: 1 }} /> }}
                  />
                </Grid>
              )}

              {/* Individual subject marks */}
              {marksMode === "individual" && (
                <>
                  {[
                    { key: "sepm", label: "SEPM" },
                    { key: "cn", label: "CN" },
                    { key: "toc", label: "TOC" },
                    { key: "cvcc", label: "CV/CC" },
                    { key: "rm", label: "RM" },
                  ].map((subj) => (
                    <Grid item xs={12} sm={6} key={subj.key}>
                      <TextField
                        fullWidth
                        type="number"
                        label={subj.label}
                        value={subjectMarks[subj.key]}
                        onChange={handleSubjectMarksChange(subj.key)}
                        inputProps={{ min: 0, max: 50 }}
                      />
                    </Grid>
                  ))}
                </>
              )}

              {/* Participation */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Participation Level"
                  value={form.participation}
                  onChange={handleChange("participation")}
                  InputProps={{
                    startAdornment: <EmojiEvents sx={{ mr: 1 }} />,
                  }}
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
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Predict Performance"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
{/* SUBJECT-WISE PIE CHART SECTION */}
{marksMode === "individual" && (
  <Box sx={{ mt: 5 }}>
    <Card sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Subject-wise Marks Breakdown
      </Typography>

      <Box sx={{ width: "100%", height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { name: "SEPM", value: Number(subjectMarks.sepm || 0) },
                { name: "CN", value: Number(subjectMarks.cn || 0) },
                { name: "TOC", value: Number(subjectMarks.toc || 0) },
                { name: "CV/CC", value: Number(subjectMarks.cvcc || 0) },
                { name: "RM", value: Number(subjectMarks.rm || 0) },
              ]}
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              dataKey="value"
            >
              {[
                "#4e79a7",
                "#f28e2b",
                "#e15759",
                "#76b7b2",
                "#59a14f",
              ].map((c, i) => (
                <Cell key={i} fill={c} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  </Box>
)}

        {/* RIGHT SIDE RESULT */}
        <Grid item xs={12} md={6}>
          {result ? (
            <Fade in timeout={500}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
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
                        "& .MuiLinearProgress-bar": { backgroundColor: "white" },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                Prediction will appear here
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      
    </Box>
  );
}
