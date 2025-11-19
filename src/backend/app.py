from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import sqlite3
import bcrypt
import jwt
import datetime
import numpy as np
import pickle
import json


# ---------------------------------------------------------
# APP + CORS
# ---------------------------------------------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = "your-secret-key"

CORS(app, supports_credentials=True)

# ---------------------------------------------------------
# DB CONNECTION
# ---------------------------------------------------------
DATABASE = "database.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/get-settings", methods=["GET"])
@cross_origin()
def get_settings():
    email = request.headers.get("Email")
    if not email:
        return jsonify({"error": "No email provided"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM user_predict_settings WHERE email=?", (email,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({})  # no saved settings yet

    return jsonify({
        "attendance": row["attendance"],
        "studyHours": row["studyHours"],
        "internalTotal": row["internalTotal"],
        "assignments": row["assignments"],
        "participation": row["participation"],
        "marksMode": row["marksMode"],
        "subjectMarks": json.loads(row["subjectMarks"]),
    })

# ---------------------------------------------------------
# INIT TABLES
# ---------------------------------------------------------
def init_db():
    conn = get_db()
    cur = conn.cursor()

    # USERS TABLE
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT,
            usn TEXT,
            department TEXT,
            semester TEXT,
            created_at TEXT
        )
    """)

    # PREDICTION HISTORY
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
    # SAVE LAST USED PREDICTOR FORM VALUES
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_predict_settings (
            email TEXT PRIMARY KEY,
            attendance REAL,
            studyHours REAL,
            internalTotal REAL,
            assignments REAL,
            participation TEXT,
            marksMode TEXT,
            subjectMarks TEXT  -- stored as JSON
        )
    """)


    conn.commit()
    conn.close()


init_db()

# ---------------------------------------------------------
# LOAD MODEL + ENCODER
# ---------------------------------------------------------
model = pickle.load(open("model.pkl", "rb"))
label_encoder = pickle.load(open("label_encoder.pkl", "rb"))

# ---------------------------------------------------------
# SIGNUP
# ---------------------------------------------------------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    name = data.get("name")
    email = data["email"].lower()
    password = data["password"]
    role = data["role"]

    usn = data.get("usn")
    department = data.get("department")
    semester = data.get("Semester")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users WHERE email=?", (email,))
    if cur.fetchone():
        return jsonify({"error": "User already exists"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    cur.execute("""
        INSERT INTO users(name, email, password_hash, role, usn, department, semester, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    """, (name, email, password_hash, role, usn, department, semester))

    conn.commit()
    conn.close()

    token = jwt.encode({
            "email": email,
            "role": role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config["SECRET_KEY"])

    return jsonify({"token": token, "email": email, "role": role})


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------
@app.route("/login", methods=["POST"])
def login():
        data = request.get_json()
        email = data["email"].lower()
        password = data["password"]

        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT * FROM users WHERE email=?", (email,))
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
        "token": token,
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "usn": user["usn"],
        "department": user["department"],
        "semester": user["semester"]
    })


# ---------------------------------------------------------
# ⭐ ADDED: STUDENT PREDICT API (ONLY FIX YOU REQUESTED)
# ---------------------------------------------------------
@app.route("/predict", methods=["POST"])
@cross_origin()
def predict():
    data = request.get_json()

    attendance = float(data["attendance"])
    studyHours = float(data["studyHours"])
    internalTotal = float(data["internalTotal"])
    assignments = float(data["assignments"])
    participation = data["participation"]

    # Encode participation
    participation_encoded = label_encoder.transform([participation])[0]

    # ML input vector
    input_vec = np.array([
        [attendance, studyHours, internalTotal, assignments, participation_encoded]
    ])

    # ML Prediction
    pred = model.predict(input_vec)[0]
    prob = model.predict_proba(input_vec)[0]

    prediction_label = "Pass" if pred == 1 else "Fail"
    confidence = float(max(prob))

    # --------------------------------------------
    # SAVE USER SETTINGS IN DB
    # --------------------------------------------
    email = request.headers.get("Email")  # MUST be sent from frontend

    if email:
        conn = get_db()
        cur = conn.cursor()

        # Insert OR Update user's last-used predictor values
        cur.execute("""
            INSERT INTO user_predict_settings 
            (email, attendance, studyHours, internalTotal, assignments, participation, marksMode, subjectMarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                attendance = excluded.attendance,
                studyHours = excluded.studyHours,
                internalTotal = excluded.internalTotal,
                assignments = excluded.assignments,
                participation = excluded.participation,
                marksMode = excluded.marksMode,
                subjectMarks = excluded.subjectMarks
        """, (
            email,
            attendance,
            studyHours,
            internalTotal,
            assignments,
            participation,
            data.get("marksMode", "total"),               # save mode
            json.dumps(data.get("subjectMarks", {}))      # save marks
        ))

        conn.commit()
        conn.close()

    # --------------------------------------------

    return jsonify({
        "prediction": prediction_label,
        "confidence": confidence
    })

# ---------------------------------------------------------
# GET LAST SAVED PREDICTOR SETTINGS
# ---------------------------------------------------------
@app.route("/predict/settings", methods=["GET"])
@cross_origin()
def get_predict_settings():
    email = request.headers.get("Email")

    if not email:
        return jsonify({"error": "Email header missing"}), 400

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM user_predict_settings WHERE email=?", (email,))
    row = cur.fetchone()

    if not row:
        return jsonify({"exists": False}), 200

    return jsonify({
        "exists": True,
        "attendance": row["attendance"],
        "studyHours": row["studyHours"],
        "internalTotal": row["internalTotal"],
        "assignments": row["assignments"],
        "participation": row["participation"],
        "marksMode": row["marksMode"],
        "subjectMarks": json.loads(row["subjectMarks"]) if row["subjectMarks"] else {}
    })
# ---------------------------------------------------------
@app.route("/")
def home():
    return "Backend running OK"


# ---------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5001)
