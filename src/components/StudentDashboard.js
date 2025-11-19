import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  Alert,
  Fade,
  Grow,
  Chip,
  Divider,
} from "@mui/material";
import {
  School,
  Schedule,
  Assessment,
  QueryStats,
  Insights,
} from "@mui/icons-material";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import PredictionSimulator from "./PredictionSimulator";

const COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949"];

export default function StudentDashboard({ latestPrediction, predictionHistory = [] }) {
  const [insights, setInsights] = useState({ rec: [], alerts: [] });
  const [simResult, setSimResult] = useState(null);

  // 🔥 Extract values from latest prediction
const inputs = latestPrediction?.inputs || {};

const attendance = Number(inputs.attendance ?? 0);
const studyHours = Number(inputs.studyHours ?? inputs.study_hours ?? 0);
const marks = Number(inputs.internalTotal ?? inputs.internal_total ?? 0);
const assignments = Number(inputs.assignments ?? 0);
const participation = inputs.participation ?? "Medium";

  const participationWeight = participation === "High" ? 10 : participation === "Medium" ? 5 : 2;
  const performanceScore = Math.round(
    attendance * 0.30 +
    studyHours * 8 * 0.20 +
    (marks / 2.5) * 0.25 +
    assignments * 10 * 0.10 +
    participationWeight * 0.15
  );
  const scoreLabel =
    performanceScore >= 80 ? "Excellent" :
    performanceScore >= 60 ? "Good" :
    performanceScore >= 40 ? "Average" :
    "Needs Improvement";

  const RiskColor = performanceScore >= 80 ? "success" :
                    performanceScore >= 60 ? "info" :
                    performanceScore >= 40 ? "warning" : "error";

  const pieData = [
    { name: "Attendance", value: attendance },
    { name: "Study Hours", value: studyHours * 8 },
    { name: "Internal Marks", value: marks / 2.5 },
    { name: "Assignments", value: assignments * 16.6 },
  ];

  useEffect(() => {
    const rec = [];
    const alerts = [];

    if (attendance && attendance < 75) alerts.push("Low attendance — aim for 75%+");
    if (studyHours && studyHours < 2) alerts.push("Study more — 2 hours/day recommended");
    if (marks && marks < 150) alerts.push("Internal marks low — revise regularly");
    if (assignments && assignments < 3) alerts.push("Submit more assignments");
    if (latestPrediction?.prediction === "Fail") alerts.push("Model predicted 'Fail' — act fast");

    rec.push("Follow a weekly study schedule");
    rec.push("Solve previous question papers");
    rec.push("Focus on weak subject areas (see heatmap)");

    setInsights({ rec, alerts });
  }, [latestPrediction, attendance, studyHours, marks, assignments]);

  const subjectNames = ["SEPM", "CN", "TOC", "CV/CC", "RM"];
  let subjectScores = [0, 0, 0, 0, 0];

  if (latestPrediction?.subjectMarks) {
    subjectScores = subjectNames.map((_, i) => {
      const mapKey = ["sepm", "cn", "toc", "cvcc", "rm"][i];
      return Number(latestPrediction.subjectMarks[mapKey] ?? 0);
    });
  } else if (marks > 0) {
    for (let i = 0; i < 5; i++) {
      const share = Math.round((marks / 5) + (Math.random() * 6 - 3));
      subjectScores[i] = Math.max(0, Math.min(50, share));
    }
  }

  const subjectHeatColors = subjectScores.map((score) =>
    score < 25 ? "#e15759" : score < 35 ? "#f28e2b" : "#59a14f"
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Student Dashboard</Typography>
        
        <Chip label={`${scoreLabel} (${performanceScore})`} color={RiskColor} />
      </Box>

      <Fade in timeout={700}>
        <Card sx={{ mb: 3, background: "linear-gradient(135deg, #4E73DF, #1CC7D0)", color: "white" }}>
          <CardContent>
            <Grid container alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography variant="h6">Overall Performance</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                  <Typography variant="h3" sx={{ mr: 3 }}>{performanceScore}</Typography>
                  <Box>
                    <Typography variant="h6">{scoreLabel}</Typography>
                    <LinearProgress variant="determinate" value={performanceScore} sx={{ mt: 1, height: 10, borderRadius: 4 }} />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={5} sx={{ textAlign: "center" }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }}>
                  <Insights sx={{ fontSize: 36 }} />
                </Avatar>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Model & insights
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>

      {/* TOP METRICS */}
      <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
        {[
          { label: "Attendance", value: `${attendance}%`, icon: <School />, color: "success" },
          { label: "Study Hours/day", value: studyHours, icon: <Schedule />, color: "info" },
          { label: "Internal Marks", value: `${marks}/250`, icon: <Assessment />, color: "warning" },
          { label: "Assignments", value: assignments, icon: <QueryStats />, color: "secondary" },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Grow in timeout={600 + i * 200}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar sx={{ bgcolor: `${item.color}.main`, mr: 2 }}>{item.icon}</Avatar>
                    <Typography variant="h6">{item.label}</Typography>
                  </Box>
                  <Typography variant="h4" color={`${item.color}.main`}>{item.value}</Typography>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Performance Breakdown Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Performance Breakdown</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <RePieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">AI Recommendations</Typography>
              {insights.rec.map((r, i) => (
                <Alert key={i} severity="info" sx={{ mb: 1 }}>
                  {r}
                </Alert>
              ))}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Alerts</Typography>
              {insights.alerts.length > 0 ? (
                insights.alerts.map((a, i) => (
                  <Alert key={i} severity="warning" sx={{ mb: 1 }}>
                    {a}
                  </Alert>
                ))
              ) : (
                <Alert severity="success">No active alerts</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SUBJECT HEATMAP */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Subject-wise Heatmap</Typography>
              <Grid container spacing={1} sx={{ mt: 2 }}>
                {subjectNames.map((subj, idx) => (
                  <Grid item xs={6} sm={4} md={2} key={subj}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: subjectHeatColors[idx],
                        color: "white",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="subtitle2">{subj}</Typography>
                      <Typography variant="h6">{subjectScores[idx]}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Prediction Simulator */}
      <PredictionSimulator
        initial={{ attendance, studyHours, internalTotal: marks, assignments, participation }}
        onSimulate={(data) => setSimResult(data)}
      />

      {/* Recent Predictions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6">Recent Predictions</Typography>
          {predictionHistory.length === 0 && <Typography>No predictions yet</Typography>}
          {predictionHistory.slice(0, 5).map((p, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
              <Typography>{new Date(p.date).toLocaleString()}</Typography>
              <Typography color={p.prediction === "Pass" ? "success.main" : "error.main"} fontWeight="bold">
                {p.prediction} ({Math.round(p.confidence * 100)}%)
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
