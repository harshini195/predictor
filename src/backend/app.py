from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
import bcrypt
import jwt
import datetime
import numpy as np
import pickle
from functools import wraps

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = "your-secret-key"

DATABASE = "database.db"

# =====================================================================
# DB CONNECTION
# =====================================================================
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# =====================================================================
# CREATE TABLES
# =====================================================================
def init_db():
    conn = get_db()
    cur = conn.cursor()

    # USERS TABLE — now includes: usn, department, year
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT CHECK(role IN ('student','faculty')),
            usn TEXT,
            department TEXT,
            year TEXT,
            created_at TEXT
        )
    """)

    # PREDICTION HISTORY TABLE
    cur.execute("""
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            prediction TEXT,
            confidence REAL,
            input_json TEXT,
            created_at TEXT
        )
    """)

    conn.commit()
    conn.close()


init_db()

# =====================================================================
# LOAD MODEL + ENCODER
# =====================================================================
model = pickle.load(open("/Users/harshiniasapu/Desktop/Projects/predict/src/backend/model.pkl", "rb"))
label_encoder = pickle.load(open("/Users/harshiniasapu/Desktop/Projects/predict/src/backend/label_encoder.pkl", "rb"))

# =====================================================================
# JWT DECORATOR
# =====================================================================
def token_required(role=None):
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            token = request.headers.get("Authorization", "").replace("Bearer ", "")

            if not token:
                return jsonify({"error": "Token missing"}), 401

            try:
                data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])

                if role and data["role"] != role:
                    return jsonify({"error": "Unauthorized"}), 403

                request.user = data

            except:
                return jsonify({"error": "Invalid or expired token"}), 401

            return fn(*args, **kwargs)
        return decorated
    return wrapper


# =====================================================================
# SIGNUP — stores full student details
# =====================================================================
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    name = data.get("name")
    email = data["email"].lower()
    password = data["password"]
    role = data["role"]

    usn = data.get("usn")
    department = data.get("department")
    year = data.get("year")

    conn = get_db()
    cur = conn.cursor()

    # Prevent duplicate emails
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    if cur.fetchone():
        return jsonify({"error": "User already exists"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    cur.execute("""
        INSERT INTO users (name, email, password_hash, role, usn, department, year, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (name, email, password_hash, role, usn, department, year))

    conn.commit()
    conn.close()

    # JWT token
    token = jwt.encode({
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config["SECRET_KEY"])

    return jsonify({"email": email, "role": role, "token": token})


# =====================================================================
# LOGIN
# =====================================================================
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data["email"].lower()
    password = data["password"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 400

    if not bcrypt.checkpw(password.encode(), user["password_hash"]):
        return jsonify({"error": "Incorrect password"}), 400

    token = jwt.encode({
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config["SECRET_KEY"])

    return jsonify({
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "usn": user["usn"],
        "department": user["department"],
        "year": user["year"],
        "token": token
    })


# =====================================================================
# STUDENT PREDICT + SAVE HISTORY
# =====================================================================
@app.route("/predict", methods=["POST"])
@token_required(role="student")
def predict():
    data = request.get_json()
    attendance = float(data["attendance"])
    studyHours = float(data["studyHours"])
    internalTotal = float(data["internalTotal"])
    assignments = float(data["assignments"])
    participation = data["participation"]

    participation_encoded = label_encoder.transform([participation])[0]

    input_vec = np.array([[attendance, studyHours, internalTotal, assignments, participation_encoded]])

    pred = model.predict(input_vec)[0]
    prob = model.predict_proba(input_vec)[0]

    prediction_label = "Pass" if pred == 1 else "Fail"
    confidence = float(max(prob))

    # SAVE HISTORY
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO prediction_history (email, prediction, confidence, input_json, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
    """, (
        request.user["email"],
        prediction_label,
        confidence,
        str(data),
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "prediction": prediction_label,
        "confidence": confidence
    })


# =====================================================================
# FACULTY PREDICT
# =====================================================================
@app.route("/faculty/predict", methods=["POST"])
@token_required(role="faculty")
def faculty_predict():
    data = request.get_json()

    attendance = float(data["attendance"])
    studyHours = float(data["studyHours"])
    internalTotal = float(data["internalTotal"])
    assignments = float(data["assignments"])
    participation = data["participation"]

    participation_encoded = label_encoder.transform([participation])[0]

    input_vec = np.array([[attendance, studyHours, internalTotal, assignments, participation_encoded]])

    pred = model.predict(input_vec)[0]
    prob = model.predict_proba(input_vec)[0]

    label = "Pass" if pred == 1 else "Fail"
    confidence = float(max(prob))
    risk_score = round((1 - confidence) * 100, 2)

    suggestions = []
    if attendance < 75:
        suggestions.append("Low attendance — suggest counselling.")
    if studyHours < 2:
        suggestions.append("Recommend 2 hours/day.")
    if internalTotal < 150:
        suggestions.append("Suggest remedial classes.")
    if assignments < 3:
        suggestions.append("Encourage assignment completion.")

    return jsonify({
        "prediction": label,
        "confidence": confidence,
        "risk_score": risk_score,
        "suggestions": suggestions
    })


# =====================================================================
# (2) FACULTY — GET LIST OF ALL STUDENTS
# =====================================================================
@app.route("/students/all", methods=["GET"])
@token_required(role="faculty")
def get_students():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT name, email, usn, department, year, created_at
        FROM users
        WHERE role = 'student'
    """)

    rows = cur.fetchall()
    students = [dict(row) for row in rows]

    return jsonify(students)


# =====================================================================
# (1) VIEW STUDENT PREDICTION HISTORY
# =====================================================================
@app.route("/history/student", methods=["GET"])
@token_required(role="student")
def student_history():
    email = request.user["email"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM prediction_history
        WHERE email = ?
        ORDER BY created_at DESC
    """, (email,))

    rows = cur.fetchall()
    history = [dict(r) for r in rows]

    return jsonify(history)


# =====================================================================
# (1 + 2) FACULTY VIEW ANY STUDENT'S HISTORY
# =====================================================================
@app.route("/history/faculty/<email>", methods=["GET"])
@token_required(role="faculty")
def faculty_history(email):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM prediction_history
        WHERE email = ?
        ORDER BY created_at DESC
    """, (email,))

    rows = cur.fetchall()
    history = [dict(r) for r in rows]

    return jsonify(history)


# =====================================================================
@app.route("/")
def home():
    return "Backend with SQLite + Students + History running ✔"


if __name__ == "__main__":
    app.run(debug=True, port=5001)
