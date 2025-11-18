import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
} from "@mui/material";
import {
  Analytics,
  School,
  EmojiEvents,
  Warning,
  CheckCircle,
  Lightbulb,
  Timeline,
  Psychology,
  Insights,
} from "@mui/icons-material";

/*
  PROPS EXPECTED:
  studentData = {
    attendance: number,
    studyHours: number,
    internal_marks: number,
    assignments_submitted: number,
    activities: number
  }

  predictionData = {
    prediction: "Pass" | "Fail",
    confidence: 0.82
  }

  explanationData (optional from SHAP API) = {
    features: [...],
    shap_values: [...]
  }
*/

export default function StudentInsights({ studentData, predictionData, explanationData }) {
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (studentData) generateInsights();
  }, [studentData, predictionData, explanationData]);

  const generateInsights = () => {
    const {
      attendance,
      studyHours,
      internal_marks,
      assignments_submitted,
      activities,
    } = studentData;

    const newInsights = [];
    const newPatterns = [];
    const newRecommendations = [];

    /* -----------------------------------------------
       🔵 KEY INSIGHTS (simple explanation cards)
    ------------------------------------------------*/
    newInsights.push({
      title: "Attendance",
      value: `${attendance}%`,
      description:
        attendance >= 80
          ? "Excellent attendance!"
          : attendance >= 60
          ? "Good attendance, but can improve."
          : "Low attendance affecting academic performance.",
      type: attendance >= 80 ? "success" : attendance >= 60 ? "warning" : "error",
      icon: <School />,
    });

    newInsights.push({
      title: "Study Hours",
      value: `${studyHours} hrs/day`,
      description:
        studyHours >= 3
          ? "Strong study habits!"
          : "Increase study hours for better performance.",
      type: studyHours >= 3 ? "success" : "warning",
      icon: <Lightbulb />,
    });

    newInsights.push({
      title: "Internal Marks",
      value: `${internal_marks}/50`,
      description:
        internal_marks >= 35
          ? "Good internal marks!"
          : "Marks below average. More revision needed.",
      type: internal_marks >= 35 ? "success" : "error",
      icon: <CheckCircle />,
    });

    newInsights.push({
      title: "Assignments",
      value: assignments_submitted,
      description:
        assignments_submitted >= 4
          ? "Consistent assignment submission!"
          : "Submit more assignments to improve understanding.",
      type: assignments_submitted >= 4 ? "success" : "warning",
      icon: <Insights />,
    });

    newInsights.push({
      title: "Activities",
      value: activities,
      description:
        activities >= 3
          ? "Good participation in activities!"
          : "Engage more in academic/skill activities.",
      type: activities >= 3 ? "success" : "info",
      icon: <EmojiEvents />,
    });

    /* -----------------------------------------------
       🔵 PATTERNS (ML + manual rules)
    ------------------------------------------------*/
    if (predictionData?.prediction === "Fail") {
      newPatterns.push({
        title: "At-Risk Performance",
        description:
          "Your academic indicators suggest risk. Improvements needed in key areas.",
        suggestion:
          "Increase study hours, improve attendance, and revise internal tests.",
        type: "warning",
      });
    }

    if (attendance < 60) {
      newPatterns.push({
        title: "Low Attendance Pattern",
        description: "Your attendance is significantly below safe levels.",
        suggestion: "Aim for 75%+ attendance to avoid detainment risk.",
        type: "error",
      });
    }

    if (studyHours < 2) {
      newPatterns.push({
        title: "Low Study Time Trend",
        description: "Study hours are below expected levels.",
        suggestion: "Try to schedule at least 2–3 hours of focused study daily.",
        type: "warning",
      });
    }

    /* -----------------------------------------------
       🔵 RECOMMENDATIONS SECTION
    ------------------------------------------------*/
    if (predictionData?.prediction === "Fail") {
      newRecommendations.push({
        title: "Boost Your Study Routine",
        priority: "high",
        actions: [
          "Increase study hours by at least 1 hour per day.",
          "Practice previous question papers regularly.",
          "Attend remedial classes if available.",
        ],
      });
    }

    if (internal_marks < 35) {
      newRecommendations.push({
        title: "Improve Internal Performance",
        priority: "high",
        actions: [
          "Revise chapters weekly.",
          "Attempt practice quizzes.",
          "Meet faculty for doubt clarification.",
        ],
      });
    }

    if (assignments_submitted < 3) {
      newRecommendations.push({
        priority: "medium",
        title: "Complete Pending Assignments",
        actions: [
          "Finish all pending assignments this week.",
          "Start tracking assignment deadlines.",
        ],
      });
    }

    if (activities < 2) {
      newRecommendations.push({
        priority: "low",
        title: "Increase Academic Activities",
        actions: [
          "Participate in online quizzes, coding challenges, or seminars.",
        ],
      });
    }

    setInsights(newInsights);
    setPatterns(newPatterns);
    setRecommendations(newRecommendations);
  };

  const chipColor = (type) =>
    type === "success"
      ? "success"
      : type === "warning"
      ? "warning"
      : type === "error"
      ? "error"
      : "info";

  const priorityColor = (priority) =>
    priority === "high" ? "error" : priority === "medium" ? "warning" : "info";

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        📊 Student Performance Insights
      </Typography>

      <Grid container spacing={3}>
        {/* -----------------------------------------------
           KEY INSIGHTS
        ------------------------------------------------*/}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <Analytics sx={{ mr: 1 }} /> Key Indicators
            </Typography>

            <Grid container spacing={2}>
              {insights.map((ins, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card>
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          {ins.icon}
                          <Typography variant="subtitle2">{ins.title}</Typography>
                        </Box>

                        <Chip
                          label={ins.value}
                          color={chipColor(ins.type)}
                          size="small"
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mt: 1 }}
                      >
                        {ins.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* -----------------------------------------------
           PATTERNS
        ------------------------------------------------*/}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <Timeline sx={{ mr: 1 }} /> Performance Patterns
            </Typography>

            {patterns.length === 0 ? (
              <Typography>No patterns detected. Keep up the good work!</Typography>
            ) : (
              <List>
                {patterns.map((p, i) => (
                  <React.Fragment key={i}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={p.title}
                        secondary={
                          <>
                            <Typography variant="body2">{p.description}</Typography>
                            <Alert severity="info" sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                💡 {p.suggestion}
                              </Typography>
                            </Alert>
                          </>
                        }
                      />
                    </ListItem>
                    {i < patterns.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* -----------------------------------------------
           RECOMMENDATIONS
        ------------------------------------------------*/}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <Lightbulb sx={{ mr: 1 }} /> AI Recommendations
            </Typography>

            {recommendations.length === 0 ? (
              <Typography>Everything looks good! 👍</Typography>
            ) : (
              <Grid container spacing={2}>
                {recommendations.map((rec, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="subtitle2">{rec.title}</Typography>
                          <Chip
                            label={rec.priority}
                            color={priorityColor(rec.priority)}
                            size="small"
                          />
                        </Box>

                        <List dense sx={{ mt: 1 }}>
                          {rec.actions.map((a, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <Typography variant="caption">• {a}</Typography>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
