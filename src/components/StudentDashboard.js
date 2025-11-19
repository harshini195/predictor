import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
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

  const inputs = latestPrediction?.inputs || {};

  const attendance = Number(inputs.attendance ?? 0);
  const studyHours = Number(inputs.studyHours ?? 0);
  const marks = Number(inputs.internalTotal ?? 0);
  const assignments = Number(inputs.assignments ?? 0);
  const participation = inputs.participation ?? "Medium";

  const participationWeight =
    participation === "High" ? 10 : participation === "Medium" ? 5 : 2;

  const performanceScore = Math.round(
    attendance * 0.3 +
    studyHours * 8 * 0.2 +
    (marks / 2.5) * 0.25 +
    assignments * 10 * 0.1 +
    participationWeight * 0.15
  );

  const scoreLabel =
    performanceScore >= 80
      ? "Excellent"
      : performanceScore >= 60
      ? "Good"
      : performanceScore >= 40
      ? "Average"
      : "Needs Improvement";

  // ==================================================================================
  //      📄 PROFESSIONAL PDF REPORT — CLEAN, TEXT-ONLY, MODERN DESIGN
  // ==================================================================================
  const generateReport = () => {
    const doc = new jsPDF("p", "pt", "a4");

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Student Performance Report", 40, 50);

    // Section Header
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text("Overall Summary", 40, 100);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(13);
    doc.text(`Performance Level: ${scoreLabel}`, 40, 130);
    doc.text(`Performance Score: ${performanceScore}`, 40, 150);

    // Metrics Section
    doc.setFontSize(16);
    doc.text("Key Student Metrics", 40, 200);

    doc.setFontSize(13);
    doc.text(`• Attendance: ${attendance}%`, 60, 225);
    doc.text(`• Study Hours/day: ${studyHours}`, 60, 245);
    doc.text(`• Internal Marks: ${marks}/250`, 60, 265);
    doc.text(`• Assignments Submitted: ${assignments}/6`, 60, 285);
    doc.text(`• Class Participation: ${participation}`, 60, 305);

    // Recommendations
    doc.setFontSize(16);
    doc.text("AI Recommendations", 40, 360);

    doc.setFontSize(13);
    insights.rec.forEach((r, i) => {
      doc.text(`• ${r}`, 60, 385 + i * 20);
    });

    // Alerts
    let alertStart = 385 + insights.rec.length * 20 + 40;
    doc.setFontSize(16);
    doc.text("Alerts", 40, alertStart);

    doc.setFontSize(13);
    if (insights.alerts.length === 0) {
      doc.text("• No active alerts", 60, alertStart + 25);
    } else {
      insights.alerts.forEach((a, i) => {
        doc.text(`• ${a}`, 60, alertStart + 25 + i * 20);
      });
    }

    // Recent Predictions
    let predStart = alertStart + 80 + insights.alerts.length * 20;
    doc.setFontSize(16);
    doc.text("Recent Predictions", 40, predStart);

    doc.setFontSize(13);
    const recent = predictionHistory.slice(0, 5);

    recent.forEach((p, i) => {
      doc.text(
        `${new Date(p.date).toLocaleString()} — ${p.prediction} (${Math.round(
          p.confidence * 100
        )}%)`,
        60,
        predStart + 25 + i * 20
      );
    });

    doc.save("Student_Performance_Report.pdf");
  };

  // ==================================================================================

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
    score < 25 ? "#e15759" : score < 35 ? "#f28e2b" : "#59a14f"
  );

  return (
    <Box sx={{ p: 3 }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Student Dashboard</Typography>

        {/* PDF Export Button */}
        <Button variant="contained" onClick={generateReport} sx={{ background: "#1CC7D0" }}>
          Export Report
        </Button>
      </Box>

      {/* ⭐⭐⭐⭐⭐ GOAL SETTING (Unchanged) ⭐⭐⭐⭐⭐ */}
      <Fade in timeout={700}>
        <Card sx={{ mb: 3, background: "linear-gradient(135deg,#4E73DF,#1CC7D0)", color: "white" }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>Goal Setting & Achievement</Typography>
            {(() => {
              const goals = [];
              if (attendance < 75) goals.push({ goal: "Increase attendance to 75%", progress: attendance, target: 75, tasks: ["Attend all classes this week", "Avoid unnecessary leave", "Check attendance daily"] });
              if (studyHours < 2) goals.push({ goal: "Study for at least 2 hours/day", progress: studyHours, target: 2, tasks: ["Create a study plan", "Use Pomodoro method", "Study one subject per day"] });
              if (marks < 150) goals.push({ goal: "Achieve 150+ internal marks", progress: marks, target: 150, tasks: ["Revise weak subjects", "Attend remedial classes", "Complete question bank"] });
              if (assignments < 6) goals.push({ goal: "Submit all assignments", progress: assignments, target: 6, tasks: ["Finish pending assignments", "Submit before deadline", "Clarify doubts with faculty"] });
              if (participation !== "High") {
                const levels = { Low: 1, Medium: 2, High: 3 };
                goals.push({ goal: "Increase class participation", progress: levels[participation], target: 3, tasks: ["Ask questions in class", "Join group discussions", "Volunteer in activities"] });
              }
              if (goals.length === 0) {
                return <Alert severity="success" sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.15)", color: "white" }}>🎉 All goals achieved! Excellent work!</Alert>;
              }
              return goals.map((g, i) => {
                const pct = Math.min(Math.round((g.progress / g.target) * 100), 100);
                return (
                  <Card key={i} sx={{ p: 2, mb: 2, mt: 2, bgcolor: "rgba(255,255,255,0.15)", color: "white" }}>
                    <Typography variant="subtitle1" fontWeight="bold">{g.goal}</Typography>
                    <LinearProgress variant="determinate" value={pct} sx={{ mt: 1, height: 10, borderRadius: 5, bgcolor: "rgba(255,255,255,0.3)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }} />
                    <Typography variant="body2" sx={{ mt: 1 }}>Progress: {pct}%</Typography>
                    <Box sx={{ mt: 1 }}>
                      {g.tasks.map((t, idx) => (
                        <Chip key={idx} label={t} variant="outlined" sx={{ mr: 1, mb: 1, color: "white", borderColor: "white" }} />
                      ))}
                    </Box>
                    {pct >= 100 && <Alert severity="success" sx={{ mt: 2, bgcolor: "rgba(0,0,0,0.2)", color: "white" }}>🎯 Goal Achieved!</Alert>}
                  </Card>
                );
              });
            })()}
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

      {/* CHARTS + AI RECOMMENDATIONS (UNCHANGED) */}
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">AI Recommendations</Typography>
              {insights.rec.map((r, i) => (
                <Alert key={i} severity="info" sx={{ mb: 1 }}>{r}</Alert>
              ))}

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2">Alerts</Typography>
              {insights.alerts.length > 0 ? (
                insights.alerts.map((a, i) => (
                  <Alert key={i} severity="warning" sx={{ mb: 1 }}>{a}</Alert>
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
              <Grid container spacing={2} sx={{ mt: 1, justifyContent: "center" }}>
                {subjectNames.map((subj, idx) => (
                  <Grid item xs={6} sm={4} md={2} key={subj}>
                    <Box sx={{ p: 2, m: 1, borderRadius: 3, bgcolor: subjectHeatColors[idx], color: "white", textAlign: "center", width: "100%" }}>
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

      {/* SIMULATOR */}
      <PredictionSimulator
        initial={{ attendance, studyHours, internalTotal: marks, assignments, participation }}
        onSimulate={(data) => setSimResult(data)}
      />

      {/* RECENT PREDICTIONS */}
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
