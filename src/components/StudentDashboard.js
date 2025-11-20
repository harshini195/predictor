// FULL UPDATED STUDENT DASHBOARD WITH PROFILE
// ======================================================

import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@mui/material";

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
} from "@mui/icons-material";

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import PredictionSimulator from "./PredictionSimulator";

const PIE_COLORS = ["#4285F4", "#34A853", "#FBBC05", "#EA4335"];
const PIE_BORDER_COLOR = "#ffffff";

export default function StudentDashboard({ latestPrediction, predictionHistory = [], studentProfile }) {
  const [insights, setInsights] = useState({ rec: [], alerts: [] });
  const [simResult, setSimResult] = useState(null);

  const inputs = latestPrediction?.inputs || {};

  const attendance = Number(inputs.attendance ?? 0);
  const studyHours = Number(inputs.studyHours ?? 0);
  const marks = Number(inputs.internalTotal ?? 0);
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

  const total = attendance + studyHours * 8 + marks / 2.5 + assignments * 16.6;

  const pieData = [
    { name: "Attendance", value: attendance, pct: (attendance / total) * 100 },
    { name: "Study Hours", value: studyHours * 8, pct: ((studyHours * 8) / total) * 100 },
    { name: "Internal Marks", value: marks / 2.5, pct: ((marks / 2.5) / total) * 100 },
    { name: "Assignments", value: assignments * 16.6, pct: ((assignments * 16.6) / total) * 100 },
  ];

  useEffect(() => {
    const rec = [];
    const alerts = [];

    if (attendance && attendance < 75) alerts.push("Low attendance — aim for 75%+");
    if (studyHours && studyHours < 2) alerts.push("Study more — minimum 2 hours/day recommended");
    if (marks && marks < 150) alerts.push("Internal marks low — revise consistently");
    if (assignments && assignments < 3) alerts.push("Submit pending assignments");
    if (latestPrediction?.prediction === "Fail") alerts.push("Model predicted 'Fail' — take corrective steps");

    rec.push("Follow a structured weekly study plan");
    rec.push("Solve previous years’ question papers");
    rec.push("Focus more on the weak subjects displayed in heatmap");

    setInsights({ rec, alerts });
  }, [attendance, studyHours, marks, assignments, latestPrediction]);

  const subjectNames = ["SEPM", "CN", "TOC", "CV/CC", "RM"];
  let subjectScores = [0, 0, 0, 0, 0];

  if (latestPrediction?.subjectMarks) {
    subjectScores = subjectNames.map((_, i) => {
      const key = ["sepm", "cn", "toc", "cvcc", "rm"][i];
      return Number(latestPrediction.subjectMarks[key] ?? 0);
    });
  } else if (marks > 0) {
    for (let i = 0; i < 5; i++) {
      const share = Math.round(marks / 5 + (Math.random() * 6 - 3));
      subjectScores[i] = Math.max(0, Math.min(50, share));
    }
  }

  const subjectHeatColors = subjectScores.map((score) =>
    score > 35
      ? "#1B5E20"   // Dark green – high marks
      : score >= 20
      ? "#4CAF50"   // Medium green – mid marks
      : "#A5D6A7"    // Light green – low marks
  );

  const generateReport = async () => {
    const element = document.getElementById("pdf-section");
    if (!element) return alert("Dashboard element not found for export.");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
    pdf.save("Student_Dashboard_Report.pdf");
  };

  return (
    <Box id="dashboard-root" sx={{ p: 3, background: "#fff" }}>

      

      {/* START OF PDF EXPORT SECTION */}
      <Box id="pdf-section">

        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4">Student Dashboard</Typography>
          <Button variant="contained" onClick={generateReport} sx={{ background: "#1CC7D0" }}>
            Export PDF
          </Button>
        </Box>

        {/* ---------------------- GOALS SECTION ---------------------- */}
        <Fade in timeout={700}>
          <Grid container spacing={3} sx={{ mb: 3 }}>

            {/* Attendance Goal */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: "linear-gradient(135deg,#4E73DF,#1CC7D0)", color: "white", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">Attendance Goal</Typography>
                  <LinearProgress variant="determinate" value={Math.min((attendance / 75) * 100, 100)} sx={{ mt: 1, height: 10, borderRadius: 5 }} />
                  {attendance >= 75 ? (
                    <Typography sx={{ mt: 1, fontWeight: "bold" }}>🎉 Goal Achieved!</Typography>
                  ) : (
                    <Typography sx={{ mt: 1 }}>Current: {attendance}% / Target: 75%</Typography>
                  )}

                  {attendance < 75 && (
                    <Box sx={{ mt: 2 }}>
                      {["Attend all classes", "Avoid unnecessary leave", "Check attendance daily"].map((t, i) => (
                        <Chip key={i} label={t} variant="outlined" sx={{ mr: 1, mb: 1, color: "white", borderColor: "white" }} />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Assignments Goal */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: "linear-gradient(135deg,#4E73DF,#1CC7D0)", color: "white", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">Assignments Goal</Typography>
                  <LinearProgress variant="determinate" value={Math.min((assignments / 6) * 100, 100)} sx={{ mt: 1, height: 10, borderRadius: 5 }} />
                  {assignments >= 6 ? (
                    <Typography sx={{ mt: 1, fontWeight: "bold" }}>🎉 All Assignments Completed</Typography>
                  ) : (
                    <Typography sx={{ mt: 1 }}>Submitted: {assignments} / 6</Typography>
                  )}

                  {assignments < 6 && (
                    <Box sx={{ mt: 2 }}>
                      {["Finish pending assignments", "Submit before deadline", "Clarify doubts"].map((t, i) => (
                        <Chip key={i} label={t} variant="outlined" sx={{ mr: 1, mb: 1, color: "white", borderColor: "white" }} />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Fade>

        {/* ---------------------- TOP METRICS ---------------------- */}
        <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
          {[{ label: "Attendance", value: `${attendance}%`, icon: <School />, color: "success" },
            { label: "Study Hours/day", value: studyHours, icon: <Schedule />, color: "info" },
            { label: "Internal Marks", value: `${marks}/250`, icon: <Assessment />, color: "warning" },
            { label: "Assignments", value: assignments, icon: <QueryStats />, color: "secondary" }].map((item, i) => (
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

        {/* ---------------------- PIE CHART ---------------------- */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>Performance Breakdown</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Tooltip />
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={50} paddingAngle={4} stroke={PIE_BORDER_COLOR} strokeWidth={4}
                      label={({ name, pct }) => `${name}: ${pct.toFixed(1)}%`}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* ---------------------- AI RECOMMENDATIONS ---------------------- */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">AI Recommendations</Typography>
                {insights.rec.map((r, i) => (
                  <Alert key={i} severity="info" sx={{ mb: 1 }}>{r}</Alert>
                ))}
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Alerts</Typography>
                {insights.alerts.length > 0 ? insights.alerts.map((a, i) => (
                  <Alert key={i} severity="warning" sx={{ mb: 1 }}>{a}</Alert>
                )) : <Alert severity="success">No active alerts</Alert>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ---------------------- SUBJECT HEATMAP ---------------------- */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Subject-wise Heatmap</Typography>
                <Grid container spacing={2} sx={{ mt: 1, justifyContent: "center" }}>
                  {subjectNames.map((subj, i) => (
                    <Grid item xs={6} sm={4} md={2} key={i}>
                      <Box sx={{ p: 2, m: 1, borderRadius: 3, bgcolor: subjectHeatColors[i], color: "white", textAlign: "center" }}>
                        <Typography variant="subtitle2">{subj}</Typography>
                        <Typography variant="h6">{subjectScores[i]}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
      {/* ⭐ HEATMAP LEGEND ⭐ */}
<Box sx={{ mt: 3, textAlign: "center" }}>
  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
    Heatmap Legend
  </Typography>

  <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: 18, height: 18, bgcolor: "#1B5E20", borderRadius: 1, mr: 1 }} />
      <Typography variant="body2">Above 35 (High)</Typography>
    </Box>

    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: 18, height: 18, bgcolor: "#4CAF50", borderRadius: 1, mr: 1 }} />
      <Typography variant="body2">20–35 (Medium)</Typography>
    </Box>

    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: 18, height: 18, bgcolor: "#A5D6A7", borderRadius: 1, mr: 1 }} />
      <Typography variant="body2">Below 20 (Low)</Typography>
    </Box>
  </Box>
</Box>


      {/* SIMULATOR NOT IN PDF */}
      <PredictionSimulator initial={{ attendance, studyHours, internalTotal: marks, assignments, participation }} onSimulate={(data) => setSimResult(data)} />

      {/* RECENT PREDICTIONS */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6">Recent Predictions</Typography>

          {predictionHistory.length === 0 && <Typography>No predictions yet</Typography>}

          {predictionHistory.slice(0, 5).map((p, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", my: 1 }}>
              <Typography>{new Date(p.date).toLocaleString()}</Typography>
              <Typography color={p.prediction === "Pass" ? "success.main" : "error.main"} fontWeight="bold">{p.prediction} ({Math.round(p.confidence * 100)}%)</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
