from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import sqlite3
import bcrypt
import jwt
import datetime
import numpy as np
import pickle
import json
from flask import g  # if not already imported


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
@app.route("/students", methods=["GET"])
def list_students():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT name, email, usn, department, semester, created_at FROM users WHERE role = 'student'")
    rows = cur.fetchall()
    students = [dict(r) for r in rows]
    conn.close()
    return jsonify({"students": students})


# Return students with their latest prediction (if any) and saved predictor settings
@app.route("/students/latest", methods=["GET"])
def students_with_latest():
    conn = get_db()
    cur = conn.cursor()

    # For each student, pick latest prediction_history record (if exists)
    # Also fetch user_predict_settings if present
    cur.execute("""
        SELECT u.name, u.email, u.usn, u.department, u.semester,
               ph.prediction AS latest_prediction,
               ph.confidence AS latest_confidence,
               ph.input_json AS latest_inputs_json,
               ups.attendance AS saved_attendance,
               ups.studyHours AS saved_studyHours,
               ups.internalTotal AS saved_internalTotal,
               ups.assignments AS saved_assignments,
               ups.participation AS saved_participation,
               ups.marksMode AS saved_marksMode,
               ups.subjectMarks AS saved_subjectMarks
        FROM users u
        LEFT JOIN (
            SELECT p1.*
            FROM prediction_history p1
            JOIN (
                SELECT email, MAX(created_at) AS maxdt FROM prediction_history GROUP BY email
            ) p2 ON p1.email = p2.email AND p1.created_at = p2.maxdt
        ) ph ON ph.email = u.email
        LEFT JOIN user_predict_settings ups ON ups.email = u.email
        WHERE u.role = 'student'
    """)

    rows = cur.fetchall()
    students = []
    for r in rows:
        obj = dict(r)
        # parse input_json and subjectMarks JSON if present
        try:
            obj["latest_inputs"] = json.loads(obj.pop("latest_inputs_json")) if obj.get("latest_inputs_json") else None
        except Exception:
            obj["latest_inputs"] = None
        try:
            obj["subjectMarks"] = json.loads(obj.pop("saved_subjectMarks")) if obj.get("saved_subjectMarks") else None
        except Exception:
            obj["subjectMarks"] = None

        students.append(obj)

    conn.close()
    return jsonify({"students": students})
# DELETE /students/<email>
@app.route("/students/<email>", methods=["DELETE"])
def delete_student(email):
    conn = get_db()
    cur = conn.cursor()

    # Delete from main users table
    cur.execute("DELETE FROM users WHERE email = ?", (email,))

    # Optional cleanup: delete settings & history also
    cur.execute("DELETE FROM user_predict_settings WHERE email = ?", (email,))
    cur.execute("DELETE FROM prediction_history WHERE email = ?", (email,))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "deleted": email})

# ---------------------------------------------------------
# FACULTY PREDICT (Separate Endpoint)
# ---------------------------------------------------------
@app.route("/faculty/predict", methods=["POST"])
@cross_origin()
def faculty_predict():
    print("🔥 Faculty Predict Endpoint HIT!")   # <--- ADD THIS LINE

    data = request.get_json()
    print("Received Data:", data)              # <--- AND THIS

    attendance = float(data["attendance"])
    studyHours = float(data["studyHours"])
    internalTotal = float(data["internalTotal"])
    assignments = float(data["assignments"])
    participation = data["participation"]

    participation_encoded = label_encoder.transform([participation])[0]

    input_vec = np.array([
        [attendance, studyHours, internalTotal, assignments, participation_encoded]
    ])

    pred = model.predict(input_vec)[0]
    prob = model.predict_proba(input_vec)[0]

    prediction_label = "Pass" if pred == 1 else "Fail"
    confidence = float(max(prob))

    return jsonify({
        "prediction": prediction_label,
        "confidence": confidence
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
