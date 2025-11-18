import React from "react";

export default function InsightsPage({ user, latestPrediction }) {
  return (
    <div style={{ padding: 40 }}>
      <h2>Insights Page</h2>
      <p>This is a placeholder for insights. Add your insights logic here.</p>
      {user && <p>User: {user.name}</p>}
      {latestPrediction && <p>Latest Prediction: {latestPrediction.prediction}</p>}
    </div>
  );
}
