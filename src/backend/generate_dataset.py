import pandas as pd
import numpy as np
import random

# -------------------------
# Helper function
# -------------------------
def participation_level():
    return random.choice(["Low", "Medium", "High"])

# -------------------------
# Generate Fail students
# -------------------------
def generate_fail(n):
    data = []
    for _ in range(n):
        attendance = np.random.randint(40, 75)          # Low–moderate attendance
        studyHours = round(np.random.uniform(0.5, 2.5), 1)
        internalTotal = np.random.randint(80, 160)     # Low–mid internal marks (out of 250)
        assignments = np.random.randint(0, 3)           # Very few assignments
        participation = participation_level()

        data.append([
            attendance,
            studyHours,
            internalTotal,
            assignments,
            participation,
            "Fail"
        ])
    return data

# -------------------------
# Generate Pass students
# -------------------------
def generate_pass(n):
    data = []
    for _ in range(n):
        attendance = np.random.randint(75, 100)         # Good attendance
        studyHours = round(np.random.uniform(2.0, 5.0), 1)
        internalTotal = np.random.randint(160, 240)    # High internal marks
        assignments = np.random.randint(3, 7)           # Submits assignments
        participation = participation_level()

        data.append([
            attendance,
            studyHours,
            internalTotal,
            assignments,
            participation,
            "Pass"
        ])
    return data

# -------------------------
# MAIN GENERATION
# -------------------------
fail_data = generate_fail(500)
pass_data = generate_pass(500)

all_data = fail_data + pass_data
random.shuffle(all_data)

df = pd.DataFrame(all_data, columns=[
    "attendance",
    "studyHours",
    "internalTotal",
    "assignments",
    "participation",
    "performance"
])

df.to_csv("student_dataset.csv", index=False)

print("🔥 Balanced Dataset Generated Successfully!")
print(df.head())
print(df['performance'].value_counts())
