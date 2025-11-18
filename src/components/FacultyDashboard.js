// src/components/FacultyDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Download as DownloadIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  BarChart as BarChartIcon,
  EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949"];

/* -------------------------
   Utility: CSV Export
   ------------------------- */
function exportCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k] == null ? "" : `${r[k]}`.replace(/"/g, '""');
          return `"${v}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------
   Main FacultyDashboard
   ------------------------- */
export default function FacultyDashboard({ classData }) {
  // Load registered students from localStorage (real students)
  const [registered, setRegistered] = useState([]);
  const [studentList, setStudentList] = useState([]); // enriched with latest history
  const [selected, setSelected] = useState(null); // drawer selection
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsHistory, setAnalyticsHistory] = useState([]);
  const [analyticsStudent, setAnalyticsStudent] = useState(null);

  // load on mount
  useEffect(() => {
    const regs = JSON.parse(localStorage.getItem("registeredStudents")) || [];
    setRegistered(regs);

    // enrich each student with latest history and computed fields
    const enriched = regs.map((stu) => {
      const history = JSON.parse(localStorage.getItem(`history_${stu.email}`)) || [];
      const latest = history[0] || null;
      return {
        ...stu,
        latestPrediction: latest?.prediction ?? "No Data",
        confidence: latest ? latest.confidence : 0,
        lastActivity: latest?.date ?? null,
        attendance: latest?.inputs?.attendance ?? null,
        studyHours: latest?.inputs?.studyHours ?? latest?.inputs?.study_hours ?? null,
        internalMarks: latest?.inputs?.internalTotal ?? latest?.inputs?.internal_total ?? null,
        assignments: latest?.inputs?.assignments ?? null,
        subjectMarks: latest?.subjectMarks ?? null,
        isActive: history.length > 0,
      };
    });

    setStudentList(enriched);
  }, []);

  // derived totals & charts
  const totals = useMemo(() => {
    const totalRegistered = registered.length;
    const activeCount = studentList.filter((s) => s.isActive).length;
    const atRisk = studentList.filter((s) => s.latestPrediction === "Fail").length;

    // department counts
    const deptCounts = {};
    registered.forEach((s) => {
      const d = s.department || "Unknown";
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    return { totalRegistered, activeCount, atRisk, deptCounts };
  }, [registered, studentList]);

  // Compute pass/fail counts from studentList where we have predictions
  const passFailCounts = useMemo(() => {
    const pass = studentList.filter((s) => s.latestPrediction === "Pass").length;
    const fail = studentList.filter((s) => s.latestPrediction === "Fail").length;
    return { pass, fail };
  }, [studentList]);

  // Subject averages if subjectMarks exist
  const subjectAverages = useMemo(() => {
    const firstWith = studentList.find((s) => s.subjectMarks);
    const subjects = firstWith ? Object.keys(firstWith.subjectMarks) : [];
    if (!subjects.length) return [];
    const sums = {};
    let count = 0;
    subjects.forEach((sub) => (sums[sub] = 0));
    studentList.forEach((s) => {
      if (!s.subjectMarks) return;
      count++;
      subjects.forEach((sub) => {
        sums[sub] += Number(s.subjectMarks[sub] ?? 0);
      });
    });
    return subjects.map((sub) => ({ subject: sub, avg: count ? sums[sub] / count : 0 }));
  }, [studentList]);

  // Attendance buckets used for bar chart
  const attendanceBuckets = useMemo(() => {
    const buckets = [
      { name: "<60%", count: 0 },
      { name: "60-69%", count: 0 },
      { name: "70-79%", count: 0 },
      { name: "80-89%", count: 0 },
      { name: "90-100%", count: 0 },
    ];
    studentList.forEach((s) => {
      const a = Number(s.attendance ?? 0);
      if (!a) return;
      if (a < 60) buckets[0].count++;
      else if (a < 70) buckets[1].count++;
      else if (a < 80) buckets[2].count++;
      else if (a < 90) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [studentList]);

  /* -------------------------
     Handlers
  ------------------------- */
  const handleExportAll = () => {
    const rows = studentList.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      usn: s.usn || "",
      department: s.department || "",
      attendance: s.attendance ?? "",
      studyHours: s.studyHours ?? "",
      internalMarks: s.internalMarks ?? "",
      assignments: s.assignments ?? "",
      prediction: s.latestPrediction ?? "",
      confidence: s.confidence ?? "",
      lastActivity: s.lastActivity ?? "",
    }));
    exportCSV("students_export.csv", rows);
  };

  const openAnalytics = (student) => {
    // get student's history from localStorage
    const hist = JSON.parse(localStorage.getItem(`history_${student.email}`)) || [];
    // last up to 20 entries, reversed so older -> newer order
    const sliced = hist.slice(0, 20).map((h) => ({
      date: h.date ? new Date(h.date).toLocaleString() : "",
      confidence: typeof h.confidence === "number" ? Math.round(h.confidence * 100) : null,
      prediction: h.prediction,
    })).reverse();
    setAnalyticsHistory(sliced);
    setAnalyticsStudent(student);
    setAnalyticsOpen(true);
  };

  const closeAnalytics = () => {
    setAnalyticsOpen(false);
    setAnalyticsHistory([]);
    setAnalyticsStudent(null);
  };

  /* -------------------------
     UI - Render
  ------------------------- */
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3} alignItems="stretch">
        {/* Header & quick stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Faculty Dashboard
                </Typography>
                <Typography color="text.secondary">Real student activity & analytics</Typography>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center">
                <Chip icon={<PeopleIcon />} label={`${totals.totalRegistered} registered`} />
                <Chip icon={<EventAvailableIcon />} color="primary" label={`${totals.activeCount} active`} />
                <Chip icon={<WarningIcon />} color="error" label={`${totals.atRisk} at-risk`} />
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportAll}>
                  Export CSV
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Avg Attendance (active)</Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {Math.round(
                  studentList.filter(s => s.attendance).reduce((a, b) => a + (b.attendance || 0), 0) /
                    Math.max(1, studentList.filter(s => s.attendance).length)
                ) || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Calculated from active students</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Avg Study Hours (active)</Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {(studentList.filter(s => s.studyHours).reduce((a,b)=>a+(b.studyHours||0),0) / Math.max(1, studentList.filter(s => s.studyHours).length)).toFixed(1) || 0} hrs
              </Typography>
              <Typography variant="caption" color="text.secondary">Per student / day</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Avg Internal Marks</Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {Math.round(studentList.filter(s=>s.internalMarks).reduce((a,b)=>a+(b.internalMarks||0),0) / Math.max(1, studentList.filter(s=>s.internalMarks).length)) || 0}/250
              </Typography>
              <Typography variant="caption" color="text.secondary">Mean (active students)</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Pass / Fail</Typography>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {passFailCounts.pass} / {passFailCounts.fail}
              </Typography>
              <Typography variant="caption" color="text.secondary">From latest predictions</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pass/Fail Distribution</Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pass", value: passFailCounts.pass },
                        { name: "Fail", value: passFailCounts.fail },
                      ]}
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label
                    >
                      <Cell fill="#59a14f" />
                      <Cell fill="#e15759" />
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Department Counts</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                {Object.entries(totals.deptCounts).length === 0 && <Typography color="text.secondary">No departments</Typography>}
                {Object.entries(totals.deptCounts).map(([dept, cnt]) => (
                  <Chip key={dept} label={`${dept}: ${cnt}`} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance distribution + Subject averages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Attendance Distribution</Typography>
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceBuckets} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <ReTooltip />
                    <Bar dataKey="count" fill="#76b7b2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Subject Averages</Typography>
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectAverages} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 50]} />
                    <ReTooltip />
                    <Bar dataKey="avg" fill="#4e79a7" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Student lists */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6">At-risk / Intervention List</Typography>
              <List sx={{ maxHeight: 360, overflow: "auto" }}>
                {studentList.filter(s => s.latestPrediction === "Fail").length === 0 && <Typography color="text.secondary" sx={{ mt: 1 }}>No students flagged</Typography>}
                {studentList.filter(s => s.latestPrediction === "Fail").map((s) => (
                  <ListItem key={s.email} button onClick={() => setSelected(s)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "error.main" }}><WarningIcon /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={s.name}
                      secondary={`${s.usn || ""} • attendance ${s.attendance ?? "—"} • marks ${s.internalMarks ?? "—"}`}
                    />
                    <Chip label={`${Math.round((s.confidence||0) * 100)}%`} color="warning" />
                    <Button sx={{ ml: 1 }} variant="outlined" onClick={(e) => { e.stopPropagation(); openAnalytics(s); }}>View Analytics</Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6">Student List (click for details)</Typography>
              <List sx={{ maxHeight: 360, overflow: "auto" }}>
                {studentList.length === 0 && <Typography color="text.secondary">No registered students yet</Typography>}
                {studentList.map((s) => (
                  <ListItem key={s.email} button onClick={() => setSelected(s)}>
                    <ListItemAvatar>
                      <Avatar>{s.name?.charAt(0) ?? "U"}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={s.name}
                      secondary={`${s.usn || ""} — ${s.department || "—"} — last: ${s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "—"}`}
                    />
                    <Chip label={s.latestPrediction || "No Data"} color={s.latestPrediction === "Pass" ? "success" : s.latestPrediction === "Fail" ? "error" : "default"} />
                    <Tooltip title="Open analytics">
                      <Button sx={{ ml: 1 }} variant="text" onClick={(e) => { e.stopPropagation(); openAnalytics(s); }}>View Analytics</Button>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Class heatmap */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Class Subject Heatmap</Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                {subjectAverages.length === 0 && <Typography color="text.secondary">Not enough subject data</Typography>}
                {subjectAverages.map((sub) => {
                  const v = sub.avg || 0;
                  const bg = v < 25 ? "#e15759" : v < 35 ? "#f28e2b" : "#59a14f";
                  return (
                    <Box key={sub.subject} sx={{ width: 140, p: 2, borderRadius: 2, bgcolor: bg, color: "white", textAlign: "center" }}>
                      <Typography variant="subtitle2">{sub.subject}</Typography>
                      <Typography variant="h6">{Math.round(sub.avg)}</Typography>
                      <Typography variant="caption">avg / 50</Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Student detail drawer */}
      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}>
        <Box sx={{ width: 420, p: 3 }}>
          {selected ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56 }}>{selected.name?.charAt(0)}</Avatar>
                <Box>
                  <Typography variant="h6">{selected.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{selected.usn || selected.email}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2">Prediction</Typography>
              <Typography variant="h6" sx={{ mb: 1, color: selected.latestPrediction === "Pass" ? "success.main" : "error.main" }}>
                {selected.latestPrediction} • {Math.round((selected.confidence || 0) * 100)}%
              </Typography>

              <Typography variant="subtitle2">Key Metrics</Typography>
              <List>
                <ListItem>
                  <ListItemAvatar><Avatar><EventAvailableIcon /></Avatar></ListItemAvatar>
                  <ListItemText primary={`Attendance`} secondary={`${selected.attendance ?? "—"}%`} />
                </ListItem>

                <ListItem>
                  <ListItemAvatar><Avatar><BarChartIcon /></Avatar></ListItemAvatar>
                  <ListItemText primary={`Total Internal`} secondary={`${selected.internalMarks ?? "—"}/250`} />
                </ListItem>

                <ListItem>
                  <ListItemAvatar><Avatar><PeopleIcon /></Avatar></ListItemAvatar>
                  <ListItemText primary={`Assignments`} secondary={`${selected.assignments ?? "—"}`} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>Subject Scores</Typography>
              <Grid container spacing={1}>
                {selected.subjectMarks ? (
                  Object.entries(selected.subjectMarks).map(([k, v]) => (
                    <Grid item xs={6} key={k}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: "#f5f5f5" }}>
                        <Typography variant="caption">{k}</Typography>
                        <Typography variant="h6">{v}</Typography>
                      </Box>
                    </Grid>
                  ))
                ) : (
                  <Typography color="text.secondary">No subject-level data</Typography>
                )}
              </Grid>

              <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                <Button variant="contained" fullWidth color="primary">Add Note</Button>
                <Button variant="outlined" fullWidth color="error" onClick={() => alert("Intervention logged (placeholder)")}>Log Intervention</Button>
              </Box>
            </>
          ) : null}
        </Box>
      </Drawer>

      {/* Analytics Dialog: Prediction Confidence Trend (D) */}
      <Dialog open={analyticsOpen} onClose={closeAnalytics} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Prediction Confidence Trend {analyticsStudent ? `— ${analyticsStudent.name}` : ""}</span>
          <IconButton onClick={closeAnalytics}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent>
          {analyticsHistory.length === 0 ? (
            <Typography color="text.secondary">No prediction history available for this student.</Typography>
          ) : (
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsHistory} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <ReTooltip />
                  <Line type="monotone" dataKey="confidence" stroke="#4e79a7" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Confidence shown as percentage (0-100). Data points are the student's latest predictions (up to 20).
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
