import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  Select,
  MenuItem,
  Button,
  LinearProgress,
  Chip,
  Stack,
  Divider,
  Fade,
} from "@mui/material";
import { Insights, PlayArrow, Tune } from "@mui/icons-material";
import axios from "axios";

export default function PredictionSimulator({ initial = {}, onSimulate = null }) {
  const [attendance, setAttendance] = useState(initial.attendance ?? 75);
  const [studyHours, setStudyHours] = useState(initial.studyHours ?? 2.5);
  const [internalTotal, setInternalTotal] = useState(initial.internalTotal ?? 150);
  const [assignments, setAssignments] = useState(initial.assignments ?? 3);
  const [participation, setParticipation] = useState(initial.participation ?? "Medium");

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState(null);

  // Weighted "local" performance score for instant preview while backend responds
  const perfScore = useMemo(() => {
    const pWeight = participation === "High" ? 10 : participation === "Medium" ? 5 : 2;
    const score = Math.round(
      attendance * 0.30 +
      studyHours * 8 * 0.20 +
      (internalTotal / 2.5) * 0.25 +
      assignments * 10 * 0.10 +
      pWeight * 0.15
    );
    return Math.max(0, Math.min(100, score));
  }, [attendance, studyHours, internalTotal, assignments, participation]);

  const colorForScore = (s) =>
    s >= 80 ? "success" : s >= 60 ? "info" : s >= 40 ? "warning" : "error";

  // quick simulate using backend ml
  const runPredict = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    setConfidence(null);

    const payload = {
  attendance: Number(attendance),
  studyHours: Number(studyHours),
  internalTotal: Number(internalTotal),
  assignments: Number(assignments),
  participation: participation,
};


    try {
      const res = await axios.post("http://localhost:5001/predict", payload, { timeout: 7000 });
      // expected { prediction: 'Pass'/'Fail', confidence: 0.x }
      setPrediction(res.data.prediction);
      setConfidence((res.data.confidence ?? 0) * 100);
      if (onSimulate) onSimulate({ prediction: res.data.prediction, confidence: res.data.confidence, inputs: payload });
    } catch (err) {
      // fallback to heuristic prediction when backend fails
      setError("Backend unavailable — using local heuristic.");
      // heuristic: if perfScore >= 65 => Pass
      const pred = perfScore >= 65 ? "Pass" : "Fail";
      const conf = Math.min(0.95, Math.max(0.45, (perfScore / 100)));
      setPrediction(pred);
      setConfidence(conf * 100);
      if (onSimulate) onSimulate({ prediction: pred, confidence: conf, inputs: payload });
    } finally {
      setLoading(false);
    }
  };

  // auto-simulate on mount with initial values
  useEffect(() => {
   const runPredict = async () => {
  setLoading(true);
  setError(null);
  setPrediction(null);
  setConfidence(null);

  const payload = {
    attendance: Number(attendance),
    studyHours: Number(studyHours),
    internalTotal: Number(internalTotal),
    assignments: Number(assignments),
    participation: participation,
  };

  const token = localStorage.getItem("authToken");

  try {
    const res = await axios.post(
      "http://localhost:5001/predict",
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 7000,
      }
    );

    // SAME FORMAT as PredictorForm
    setPrediction(res.data.prediction);
    setConfidence((res.data.confidence * 100).toFixed(1));

    if (onSimulate)
      onSimulate({
        prediction: res.data.prediction,
        confidence: res.data.confidence,
        inputs: payload,
      });

  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      setError("Session expired. Please login again.");
    } else {
      setError("Backend unavailable — using fallback heuristic.");

      // SAME fallback threshold as PredictorForm
      const pred = perfScore >= 65 ? "Pass" : "Fail";
      const conf = Math.min(0.95, Math.max(0.45, perfScore / 100));

      setPrediction(pred);
      setConfidence((conf * 100).toFixed(1));

      if (onSimulate)
        onSimulate({
          prediction: pred,
          confidence: conf,
          inputs: payload,
        });
    }
  }

  setLoading(false);
};}, []);
// Animation styles
const styles = `
@keyframes fadePop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.pass-animate {
  animation: fadePop 0.45s ease-out forwards;
  color: #2ecc71;
}
.fail-animate {
  animation: fadePop 0.45s ease-out forwards;
  color: #e74c3c;
}
`;
  return (
    <Card elevation={8} sx={{
      mt: 3,
      borderRadius: 3,
      background: "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(245,249,255,0.9))",
      p: 1
    }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" gap={2}>
              <Insights sx={{ fontSize: 34, color: "primary.main" }} />
              <Box>
                <Typography variant="h6">Prediction Simulator</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try "what-if" scenarios — adjust sliders and simulate the model instantly.
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={runPredict}
              disabled={loading}
              sx={{ ml: { md: 1 } }}
            >
              {loading ? "Simulating..." : "Simulate"}
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Sliders / Inputs */}
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption">Attendance (%)</Typography>
              <Slider
                value={attendance}
                onChange={(e, v) => setAttendance(Math.round(v))}
                step={1}
                min={0}
                max={100}
                valueLabelDisplay="on"
                sx={{ mt: 1 }}
              />

              <Typography variant="caption" sx={{ mt: 2 }}>Study hours / day</Typography>
              <Slider
                value={studyHours}
                onChange={(e, v) => setStudyHours(Math.round(v * 10) / 10)}
                step={0.1}
                min={0}
                max={6}
                valueLabelDisplay="on"
                sx={{ mt: 1 }}
              />

              <Typography variant="caption" sx={{ mt: 2 }}>Assignments submitted</Typography>
              <Slider
                value={assignments}
                onChange={(e, v) => setAssignments(Math.round(v))}
                step={1}
                min={0}
                max={6}
                valueLabelDisplay="on"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption">Internal total (out of 250)</Typography>
              <Slider
                value={internalTotal}
                onChange={(e, v) => setInternalTotal(Math.round(v))}
                step={1}
                min={0}
                max={250}
                valueLabelDisplay="on"
                sx={{ mt: 1 }}
              />

              <Typography variant="caption" sx={{ mt: 2 }}>Participation</Typography>
              <Select
                value={participation}
                onChange={(e) => setParticipation(e.target.value)}
                fullWidth
                sx={{ mt: 1 }}
                startAdornment={<Tune sx={{ mr: 1 }} />}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>

              <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
                Performance Preview
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={perfScore}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    background: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))",
                    "& .MuiLinearProgress-bar": {
                      background: (theme) =>
                        `linear-gradient(90deg, ${theme.palette[colorForScore(perfScore)].main}, ${theme.palette.primary.main})`,
                    }
                  }}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">0</Typography>
                  <Typography variant="caption" color="text.secondary">100</Typography>
                </Stack>
<Box component="style">{styles}</Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  <Typography
  variant="h5"
  className={prediction ? (prediction === "Pass" ? "pass-animate" : "fail-animate") : ""}
  sx={{ m: 0 }}
>
  {prediction ? `Predicted: ${prediction}` : "No prediction yet"}
</Typography>


                  <Typography variant="body2" color="text.secondary">
                    {confidence ? `Confidence: ${Math.round(confidence)}%` : ""}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Footer */}
          <Grid item xs={12}>
            <Fade in={!error}>
              <Typography variant="caption" color="text.secondary">
                Tip: slide values and click "Simulate" to query the model or use the local heuristic if backend isn't reachable.
              </Typography>
            </Fade>
            {error && (
              <Typography variant="caption" color="error" sx={{ display: "block" }}>
                {error}
              </Typography>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
