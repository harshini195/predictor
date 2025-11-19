// src/components/FacultyPredictForm.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Slider,
  Button,
  Card,
  CardContent,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Stack,
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

export default function FacultyPredictForm({ onResult }) {
  const navigate = useNavigate();

  // Slider inputs
  const [attendance, setAttendance] = useState(75);
  const [studyHours, setStudyHours] = useState(2);
  const [internalTotal, setInternalTotal] = useState(150);
  const [assignments, setAssignments] = useState(3);
  const [participation, setParticipation] = useState("Medium");

  // Output
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState("");

  // Marks
  const attendanceMarks = [
    { value: 0, label: "0%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "100%" },
  ];

  const studyHoursMarks = [
    { value: 0, label: "0h" },
    { value: 2, label: "2h" },
    { value: 4, label: "4h" },
    { value: 6, label: "6h" },
  ];

  const assignmentsMarks = [
    { value: 0, label: "0" },
    { value: 2, label: "2" },
    { value: 4, label: "4" },
    { value: 6, label: "6" },
  ];

  const internalMarksMarks = [
    { value: 0, label: "0" },
    { value: 125, label: "125" },
    { value: 250, label: "250" },
  ];

  // -----------------------
  // SUBMIT (with JWT auth)
  // -----------------------
  const handleSubmit = async () => {
    setError("");
    setPrediction(null);
    setConfidence(null);

    const payload = {
      attendance: Number(attendance),
      studyHours: Number(studyHours),
      internalTotal: Number(internalTotal),
      assignments: Number(assignments),
      participation,
    };

    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");

      const res = await axios.post(
        "http://localhost:5001/faculty/predict",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const pred = res.data.prediction;
      const conf = res.data.confidence;

      setPrediction(pred);
      setConfidence(conf);

      if (onResult) {
        onResult({
          ...payload,
          prediction: pred,
          confidence: conf,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Faculty predict error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired or unauthorized. Please login again.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError("Prediction failed — check backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const progressColor = (pred) =>
    pred === "Pass" ? "success.main" : "error.main";

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Faculty — Ad-hoc Performance Predictor
      </Typography>

      <Grid container spacing={3}>
        {/* Left Input Panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={3}>
              {/* Attendance */}
              <Box>
                <Typography sx={{ mb: 1, display: "flex", gap: 1 }}>
                  <School /> Attendance (%)
                </Typography>
                <Slider
                  value={attendance}
                  onChange={(_, v) => setAttendance(v)}
                  min={0}
                  max={100}
                  marks={attendanceMarks}
                  valueLabelDisplay="on"
                />
              </Box>

              {/* Study Hours */}
              <Box>
                <Typography sx={{ mb: 1, display: "flex", gap: 1 }}>
                  <Timer /> Study Hours / day
                </Typography>
                <Slider
                  value={studyHours}
                  onChange={(_, v) => setStudyHours(v)}
                  min={0}
                  max={6}
                  step={0.1}
                  marks={studyHoursMarks}
                  valueLabelDisplay="on"
                />
              </Box>

              {/* Internal Marks */}
              <Box>
                <Typography sx={{ mb: 1, display: "flex", gap: 1 }}>
                  <Assessment /> Internal Marks (out of 250)
                </Typography>
                <Slider
                  value={internalTotal}
                  onChange={(_, v) => setInternalTotal(v)}
                  min={0}
                  max={250}
                  marks={internalMarksMarks}
                  valueLabelDisplay="on"
                />
              </Box>

              {/* Assignments */}
              <Box>
                <Typography sx={{ mb: 1, display: "flex", gap: 1 }}>
                  <AssignmentTurnedIn /> Assignments Submitted
                </Typography>
                <Slider
                  value={assignments}
                  onChange={(_, v) => setAssignments(v)}
                  min={0}
                  max={6}
                  step={1}
                  marks={assignmentsMarks}
                  valueLabelDisplay="on"
                />
              </Box>

              {/* Participation */}
              <Box>
                <Typography sx={{ mb: 1, display: "flex", gap: 1 }}>
                  <EmojiEvents /> Participation
                </Typography>
                <RadioGroup
                  row
                  value={participation}
                  onChange={(e) => setParticipation(e.target.value)}
                >
                  <FormControlLabel value="Low" control={<Radio />} label="Low" />
                  <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                  <FormControlLabel value="High" control={<Radio />} label="High" />
                </RadioGroup>
              </Box>

              {error && <Alert severity="error">{error}</Alert>}

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Predicting..." : "Predict"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setAttendance(75);
                    setStudyHours(2);
                    setInternalTotal(150);
                    setAssignments(3);
                    setParticipation("Medium");
                    setPrediction(null);
                    setConfidence(null);
                    setError("");
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Output Panel */}
        <Grid item xs={12} md={6}>
          {prediction ? (
            <Card sx={{ p: 2 }}>
              <CardContent>
                <Box sx={{ textAlign: "center" }}>
                  <Insights sx={{ fontSize: 50, mb: 1 }} />

                  <Typography variant="h5">
                    Prediction: <b>{prediction}</b>
                  </Typography>

                  <Typography variant="h6" sx={{ mt: 1 }}>
                    Confidence: {Math.round(confidence * 100)}%
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={confidence * 100}
                    sx={{
                      mt: 2,
                      height: 12,
                      borderRadius: 2,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: progressColor(prediction),
                      },
                    }}
                  />

                  {/* Summary */}
                  <Box sx={{ mt: 3, textAlign: "left" }}>
                    <Typography variant="body2">✔ Attendance: {attendance}%</Typography>
                    <Typography variant="body2">✔ Study Hours/day: {studyHours}</Typography>
                    <Typography variant="body2">
                      ✔ Internal Total: {internalTotal}/250
                    </Typography>
                    <Typography variant="body2">✔ Assignments: {assignments}</Typography>
                    <Typography variant="body2">✔ Participation: {participation}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
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
