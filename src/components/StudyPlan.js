import React from "react";
import { Box, Typography } from "@mui/material";

export default function StudyPlan({ user }) {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Study Plan
      </Typography>
      <Typography color="text.secondary">
        This is a placeholder for the Study Plan page. Add your study plan logic here.
      </Typography>
    </Box>
  );
}