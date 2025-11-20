# SPRINT BACKLOG – AI Student Performance Predictor

## Sprint Goal:
Build a fully functional Student Performance Prediction system with login, ML prediction, and dashboard.

---

## User Stories

### 1. User Login (Student + Faculty)
- As a user, I can sign up and log in.
- JWT token stored so I remain authenticated.

### 2. Prediction Form
- As a student, I can enter attendance, study hours, marks, assignments, etc.
- The system predicts PASS/FAIL with confidence score.

### 3. Dashboard
- As a student, I can view my latest prediction.
- View history of past predictions.
- See heatmap & insights.

### 4. Faculty Module
- Faculty can predict for any student.
- Faculty can view analytics.

---

## Task Breakdown

### 🔹 Frontend Tasks
- Login/Signup UI
- PredictorForm UI
- Dashboard UI with charts
- Save & load prediction history
- Faculty dashboard UI

### 🔹 Backend Tasks
- SQLite DB setup
- JWT authentication routes
- /signup & /login endpoints
- /predict ML endpoint
- Model loading & preprocessing

### 🔹 ML Tasks
- Load trained model
- Return prediction + confidence
- Validate input before inference
