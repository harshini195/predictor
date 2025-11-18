import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load dataset
df = pd.read_csv("student_dataset.csv")

# Encode categorical column
label = LabelEncoder()
df["participation"] = label.fit_transform(df["participation"])

# Features & Target
X = df[["attendance", "studyHours", "internalTotal", "assignments", "participation"]]
y = df["performance"]

# Encode target labels (Fail=0, Pass=1)
y = LabelEncoder().fit_transform(y)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Store model accuracies
results = {}

# ----------------------------------------------------
# 1️⃣ Logistic Regression
# ----------------------------------------------------
log_model = LogisticRegression(max_iter=500)
log_model.fit(X_train, y_train)
log_acc = accuracy_score(y_test, log_model.predict(X_test)) * 100
results["Logistic Regression"] = (log_acc, log_model)

# ----------------------------------------------------
# 2️⃣ Decision Tree
# ----------------------------------------------------
dt_model = DecisionTreeClassifier()
dt_model.fit(X_train, y_train)
dt_acc = accuracy_score(y_test, dt_model.predict(X_test)) * 100
results["Decision Tree"] = (dt_acc, dt_model)

# ----------------------------------------------------
# 3️⃣ Random Forest
# ----------------------------------------------------
rf_model = RandomForestClassifier(n_estimators=200)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test)) * 100
results["Random Forest"] = (rf_acc, rf_model)

# ----------------------------------------------------
# Select Best Model
# ----------------------------------------------------
best_model_name = max(results, key=lambda x: results[x][0])
best_model_acc, best_model = results[best_model_name]

# Save best model
pickle.dump(best_model, open("model.pkl", "wb"))
pickle.dump(label, open("label_encoder.pkl", "wb"))

# Summary Output
print("\n==============================")
print(" MODEL ACCURACIES")
print("==============================")
print(f"Logistic Regression: {log_acc:.2f}%")
print(f"Decision Tree:      {dt_acc:.2f}%")
print(f"Random Forest:      {rf_acc:.2f}%")
print("------------------------------")
print(f"✅ BEST MODEL: {best_model_name} ({best_model_acc:.2f}%)")
print("✔ Saved as model.pkl")
print("==============================")
