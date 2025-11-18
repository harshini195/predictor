from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle

app = Flask(__name__)
CORS(app)

# Load model
model = pickle.load(open("/Users/harshiniasapu/Desktop/Projects/predict/src/backend/model.pkl", "rb"))

# Load participation encoder
label_encoder = pickle.load(open("/Users/harshiniasapu/Desktop/Projects/predict/src/backend/label_encoder.pkl", "rb"))

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    try:
        attendance = float(data["attendance"])
        studyHours = float(data["studyHours"])
        internalTotal = float(data["internalTotal"])
        assignments = float(data["assignments"])
        participation = data["participation"]  # "Low" / "Medium" / "High"

        # Encode participation
        participation_encoded = label_encoder.transform([participation])[0]

        # Prepare input
        input_data = np.array([[attendance, studyHours, internalTotal, assignments, participation_encoded]])

        # Predict
        pred = model.predict(input_data)[0]
        prob = model.predict_proba(input_data)[0]

        # Convert numeric output back to label
        prediction_label = "Pass" if pred == 1 else "Fail"
        confidence = float(max(prob))

        return jsonify({
            "prediction": prediction_label,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400
@app.route("/faculty/predict", methods=["POST"])
def faculty_predict():
    data = request.get_json()

    try:
        attendance = float(data["attendance"])
        studyHours = float(data["studyHours"])
        internalTotal = float(data["internalTotal"])
        assignments = float(data["assignments"])
        participation = data["participation"]

        participation_encoded = label_encoder.transform([participation])[0]

        input_data = np.array([[attendance, studyHours, internalTotal, assignments, participation_encoded]])
        
        pred = model.predict(input_data)[0]
        prob = model.predict_proba(input_data)[0]

        prediction_label = "Pass" if pred == 1 else "Fail"
        confidence = float(max(prob))

        risk_score = round((1 - confidence) * 100)

        suggestions = []
        if pred == 0:  # Fail
            if attendance < 75:
                suggestions.append("Improve attendance to at least 75%.")
            if studyHours < 2:
                suggestions.append("Increase study hours to at least 2 hrs/day.")
            if internalTotal < 150:
                suggestions.append("Revise internal topics and take practice tests.")
            if assignments < 3:
                suggestions.append("Submit more assignments to improve internal marks.")

        return jsonify({
            "prediction": prediction_label,
            "confidence": confidence,
            "risk_score": risk_score,
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/", methods=["GET"])
def home():
    return "Student Performance Predictor Backend Running ✔"

if __name__ == "__main__":
    app.run(debug=True, port=5001)
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle

app = Flask(__name__)
CORS(app)

# Load model + encoder
model = pickle.load(open("/Users/harshiniasapu/Desktop/Projects/predict/src/backend/model.pkl", "rb"))
label_encoder = pickle.load(open("/Users/harshiniasapu/Desktop/Projects/predict/src/backend/label_encoder.pkl", "rb"))


@app.route("/predict", methods=["POST"])
def student_predict():
    """
    Normal student prediction
    """
    data = request.get_json()

    try:
        attendance = float(data["attendance"])
        studyHours = float(data["studyHours"])
        internalTotal = float(data["internalTotal"])
        assignments = float(data["assignments"])
        participation = data["participation"]

        participation_encoded = label_encoder.transform([participation])[0]

        input_data = np.array(
            [[attendance, studyHours, internalTotal, assignments, participation_encoded]]
        )

        pred = model.predict(input_data)[0]
        prob = model.predict_proba(input_data)[0]

        return jsonify({
            "prediction": "Pass" if pred == 1 else "Fail",
            "confidence": float(max(prob))
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400



# ----------------------------------------------------
# ⭐ NEW ROUTE: FACULTY PREDICTOR (SLIDERS VERSION)
# ----------------------------------------------------
@app.route("/faculty/predict", methods=["POST"])
def faculty_predict():
    """
    Faculty predictor with sliders (0–100 normalized)
    Faculty sees more detailed output
    """
    try:
        data = request.get_json()

        attendance = float(data["attendance"])
        studyHours = float(data["studyHours"])
        internalTotal = float(data["internalTotal"])
        assignments = float(data["assignments"])
        participation = data["participation"]

        participation_encoded = label_encoder.transform([participation])[0]

        input_data = np.array(
            [[attendance, studyHours, internalTotal, assignments, participation_encoded]]
        )

        pred = model.predict(input_data)[0]
        prob = model.predict_proba(input_data)[0]
        prediction_label = "Pass" if pred == 1 else "Fail"
        confidence = float(max(prob))

        # ⭐ Extra faculty-only analytics
        risk_score = round((1 - confidence) * 100 if prediction_label == "Fail" else (confidence * 100), 2)

        # Simple faculty suggestion system
        suggestions = []
        if attendance < 75:
            suggestions.append("Low attendance — recommend attendance counselling.")
        if studyHours < 2:
            suggestions.append("Increase daily study hours to improve consistency.")
        if internalTotal < 150:
            suggestions.append("Suggest remedial classes or revision plan.")
        if assignments < 3:
            suggestions.append("Student is not completing assignments regularly.")
        if participation == "Low":
            suggestions.append("Encourage student to participate in class.")

        return jsonify({
            "prediction": prediction_label,
            "confidence": confidence,
            "risk_score": risk_score,
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/", methods=["GET"])
def home():
    return "Student Performance Predictor Backend Running ✔"


if __name__ == "__main__":
    app.run(debug=True, port=5001)
