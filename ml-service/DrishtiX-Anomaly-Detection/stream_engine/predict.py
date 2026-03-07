import os
import joblib
import pandas as pd

import os
import joblib
import pandas as pd

def load_drishtix_model():
    """Loads the trained model from the disk."""
    # Dynamically get the folder where predict.py lives
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Look for the .pkl file right next to it
    model_path = os.path.join(current_dir, "crowd_risk_rf_model1.pkl")
    
    if not os.path.exists(model_path):
        print(f"Error: Could not find model at {model_path}. Did you copy it over?")
        return None
        
    return joblib.load(model_path)

def predict_live_risk(model, live_data_dict):
    """
    Takes a dictionary of live camera/sensor data and predicts the risk level.
    """
    # 1. Convert the single live reading into a DataFrame (which the model expects)
    # The columns must exactly match what we trained on
    expected_features = ['crowd_count', 'inflow_rate', 'outflow_rate', 'avg_speed', 'direction_entropy']
    
    df_live = pd.DataFrame([live_data_dict])
    
    # 2. Reorder columns just in case the dictionary was out of order
    df_live = df_live[expected_features]
    
    # 3. Make the prediction
    predicted_class = model.predict(df_live)[0]
    
    # 4. Get the confidence scores (probability of each class)
    probabilities = model.predict_proba(df_live)[0]
    confidence = probabilities[predicted_class] * 100
    
    # 5. Map the numeric class to a human-readable threat level
    threat_levels = {
        0: "🟢 SAFE (Normal Flow)",
        1: "🟡 LOW RISK (Monitoring)",
        2: "🟠 MEDIUM RISK (Deploying Staff)",
        3: "🔴 HIGH DANGER (Potential Crush Detected)"
    }
    
    return threat_levels[predicted_class], confidence

if __name__ == "__main__":
    # --- SIMULATING A LIVE HACKATHON DEMO ---
    
    print("Initializing DrishtiX Live Inference Engine...")
    model = load_drishtix_model()
    
    if model:
        print("Model loaded successfully. Waiting for live sensor data...\n")
        
        # Scenario A: A quiet gate opening
        sensor_reading_1 = {
            'crowd_count': 150,
            'inflow_rate': 10.5,
            'outflow_rate': 12.0,
            'avg_speed': 2.5,
            'direction_entropy': 0.1
        }
        
        # Scenario B: A dangerous bottleneck forming (high inflow, zero outflow, stopped moving)
        sensor_reading_2 = {
            'crowd_count': 4500,
            'inflow_rate': 85.0,
            'outflow_rate': 2.0,
            'avg_speed': 0.1,
            'direction_entropy': 0.8
        }
        
        print("--- ZONE A LIVE FEED ---")
        risk, conf = predict_live_risk(model, sensor_reading_1)
        print(f"Status: {risk}")
        print(f"AI Confidence: {conf:.1f}%\n")
        
        print("--- ZONE B LIVE FEED (BOTTLENECK DETECTED) ---")
        risk, conf = predict_live_risk(model, sensor_reading_2)
        print(f"Status: {risk}")
        print(f"AI Confidence: {conf:.1f}%\n")