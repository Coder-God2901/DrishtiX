import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Import the clean data pipeline from Step 1
from data_prep import prepare_drishtix_data

def train_and_save_model():
    print("Step 2: Starting Model Training Pipeline...\n")
    
    # 1. Get the clean data directly from our Step 1 script
    df = prepare_drishtix_data()
    
    if df is None:
        print("Training aborted: Could not load data.")
        return
        
    # 2. Define Features (X) and Target (y)
    # X = What the model looks at (Current crowd physics)
    # y = What the model tries to guess (Risk Level in 10 mins)
    feature_cols = ['crowd_count', 'inflow_rate', 'outflow_rate', 'avg_speed', 'direction_entropy']
    X = df[feature_cols]
    y = df['risk_level_t+10']
    
    # 3. Train/Test Split
    # We hide 20% of the data from the model so we can test if it actually learned,
    # rather than just memorizing the answers.
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training on {len(X_train)} records, Testing on {len(X_test)} records...")
    
    # 4. Initialize and Train the Random Forest
    # n_estimators=100 creates 100 'decision trees' that vote on the final risk level
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    rf_model.fit(X_train, y_train)
    
    # 5. Evaluate the Model
    y_pred = rf_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*40)
    print(f" MODEL EVALUATION (ACCURACY: {accuracy * 100:.1f}%)")
    print("="*40)
    print(classification_report(y_test, y_pred))
    
    # 6. Save the trained model to the 'models' folder
    # We use joblib to serialize (package up) the model into a .pkl file
    model_dir = "../models"
    os.makedirs(model_dir, exist_ok=True) # Creates the folder if you forgot to make it
    
    model_path = os.path.join(model_dir, "crowd_risk_rf_model1.pkl")
    joblib.dump(rf_model, model_path)
    
    print(f"\nSUCCESS: Model trained and securely saved to -> {model_path}")
    
    return rf_model

if __name__ == "__main__":
    train_and_save_model()