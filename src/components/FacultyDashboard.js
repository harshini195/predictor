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
   Helpers
------------------------- */
const safeNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatConfidence = (c) => {
  if (c === null || c === undefined) return 0;
  // backend seems to use fraction (0.87) or null - ensure number
  const num = Number(c);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
};

/* -------------------------
   Main FacultyDashboard
------------------------- */
export default function FacultyDashboard() {
  const [registered, setRegistered] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsHistory, setAnalyticsHistory] = useState([]);
  const [analyticsStudent, setAnalyticsStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch students from backend and normalize to dashboard shape
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStudents() {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:5001/students/latest", {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      const regs = Array.isArray(json.students) ? json.students : [];

      // Map server response to dashboard-friendly objects
      const enriched = regs.map((stu) => {
        // prefer latest_inputs if available, else use saved_* values
        const latestInputs = stu.latest_inputs ?? null;
        const saved = {
          attendance: safeNum(stu.saved_attendance),
          studyHours: safeNum(stu.saved_studyHours),
          internalTotal: safeNum(stu.saved_internalTotal),
          assignments: safeNum(stu.saved_assignments),
          participation: stu.saved_participation ?? null,
          marksMode: stu.saved_marksMode ?? "total",
          subjectMarks: stu.saved_subjectMarks ?? stu.subjectMarks ?? null,
        };

        const inputs = latestInputs
          ? {
            attendance: safeNum(latestInputs.attendance),
            studyHours: safeNum(latestInputs.studyHours ?? latestInputs.study_hours),
            internalTotal: safeNum(latestInputs.internalTotal ?? latestInputs.internal_total),
            assignments: safeNum(latestInputs.assignments),
            participation: latestInputs.participation ?? saved.participation,
          }
          : saved;

        // subjectMarks can be stored as an object or a JSON string - normalize
        let subjectMarks = stu.subjectMarks ?? saved.subjectMarks ?? null;
        if (typeof subjectMarks === "string" && subjectMarks.trim()) {
          try {
            subjectMarks = JSON.parse(subjectMarks);
          } catch (e) {
            // leave as is
          }
        }

        const hasSavedData =
          safeNum(stu.saved_attendance) !== null ||
          safeNum(stu.saved_internalTotal) !== null ||
          safeNum(stu.saved_assignments) !== null ||
          (stu.subjectMarks && Object.values(stu.subjectMarks).some(v => v !== "" && v !== null));

        let latestPrediction;
        if (stu.latest_prediction) {
          latestPrediction = stu.latest_prediction;
        } else if (hasSavedData) {
          latestPrediction = " Data Available"; // <-- FIX
        } else {
          latestPrediction = "No Data";
        }

        let confidence;
        if (stu.latest_confidence !== null && stu.latest_confidence !== undefined) {
          confidence = Number(stu.latest_confidence);
        } else if (hasSavedData) {
          confidence = 0; // saved marks exist but no prediction yet
        } else {
          confidence = null;
        }
        return {
          name: stu.name ?? stu.email,
          email: stu.email,
          usn: stu.usn ?? "",
          department: stu.department ?? "",
          semester: stu.semester ?? "",
          latestPrediction,
          confidence,
          lastActivity: null,
          attendance: inputs?.attendance ?? null,
          studyHours: inputs?.studyHours ?? null,
          internalMarks: inputs?.internalTotal ?? null,
          assignments: inputs?.assignments ?? null,
          subjectMarks: subjectMarks,
          isActive: !!stu.latest_prediction, // this stays same
        };
      });

      setRegistered(regs);
      setStudentList(enriched);

      // persist a lightweight copy locally as fallback
      localStorage.setItem("registeredStudents", JSON.stringify(regs));
    } catch (err) {
      console.error("Failed to load students from backend:", err);
      // fallback to previously cached localStorage registeredStudents
      const regs = JSON.parse(localStorage.getItem("registeredStudents")) || [];
      const enriched = regs.map((stu) => {
        const history = JSON.parse(localStorage.getItem(`history_${stu.email}`)) || [];
        const latest = history[0] || null;
        return {
          ...stu,
          latestPrediction: latest?.prediction ?? "No Data",
          confidence: latest ? latest.confidence : 0,
          lastActivity: latest?.date ?? null,
          attendance: latest?.inputs?.attendance ?? null,
          studyHours: latest?.inputs?.studyHours ?? null,
          internalMarks: latest?.inputs?.internalTotal ?? null,
          assignments: latest?.inputs?.assignments ?? null,
          subjectMarks: stu.subjectMarks ?? null,
          isActive: history.length > 0,
        };
      });
      setRegistered(regs);
      setStudentList(enriched);
    } finally {
      setLoadingStudents(false);
    }
  }

  // derived totals & charts
  const totals = useMemo(() => {
    const totalRegistered = registered.length;
    const activeCount = studentList.filter((s) => s.isActive).length;
    const atRisk = studentList.filter((s) => s.latestPrediction === "Fail").length;

    const deptCounts = {};
    registered.forEach((s) => {
      const d = s.department || "Unknown";
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    return { totalRegistered, activeCount, atRisk, deptCounts };
  }, [registered, studentList]);

  const passFailCounts = useMemo(() => {
    const pass = studentList.filter((s) => s.latestPrediction === "Pass").length;
    const fail = studentList.filter((s) => s.latestPrediction === "Fail").length;
    return { pass, fail };
  }, [studentList]);

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
    // fallback: localStorage-based history (you can replace this with backend call later)
    const hist = JSON.parse(localStorage.getItem(`history_${student.email}`)) || [];
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
                <Button variant="outlined" onClick={() => fetchStudents()} disabled={loadingStudents}>
                  {loadingStudents ? "Refreshing..." : "Refresh"}
                </Button>
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
                {(studentList.filter(s => s.studyHours).reduce((a, b) => a + (b.studyHours || 0), 0) / Math.max(1, studentList.filter(s => s.studyHours).length)).toFixed(1) || 0} hrs
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
                {Math.round(studentList.filter(s => s.internalMarks).reduce((a, b) => a + (b.internalMarks || 0), 0) / Math.max(1, studentList.filter(s => s.internalMarks).length)) || 0}/250
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
              <Typography variant="h6" gutterBottom>Department Counts</Typography>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 2 ,ml:2}}>
                {Object.entries(totals.deptCounts).length === 0 && <Typography color="text.secondary">No departments</Typography>}
                {Object.entries(totals.deptCounts).map(([dept, cnt]) => (
                  <Chip
                    key={dept}
                    label={`${dept}: ${cnt}`}
                    sx={{
                      "& .MuiChip-label": {
                        fontSize: "1.5rem",   
                        fontWeight: "400",    // optional but keeps it readable
                      },
                    }}
                  />
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
                    <Chip
                      label={s.latestPrediction || "No Data"}
                      sx={{
                        bgcolor: s.latestPrediction !== "No Data" ? "#59a14f" : "#e0e0e0",
                        color: s.latestPrediction !== "No Data" ? "white" : "black",
                        fontWeight: 600,
                      }}
                    />
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
              <Typography variant="h6" sx={{ mb: 1, color: selected.latestPrediction === "Pass" ? "success.main" : selected.latestPrediction === "Fail" ? "error.main" : "text.primary" }}>
                {selected.latestPrediction} • {formatConfidence(selected.confidence)}%
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
                {selected.subjectMarks && Object.keys(selected.subjectMarks).length > 0 ? (
                  Object.entries(selected.subjectMarks).map(([k, v]) => (
                    <Grid item xs={6} key={k}>
                      <Box sx={{ p: 1, borderRadius: 1, bgcolor: "#f5f5f5" }}>
                        <Typography variant="caption">{k}</Typography>
                        <Typography variant="h6">{v === "" || v === null ? "—" : v}</Typography>
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
