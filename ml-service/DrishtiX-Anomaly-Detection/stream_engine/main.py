import redis
import json
import numpy as np
import time
from sklearn.ensemble import IsolationForest
import requests
from concurrent.futures import ThreadPoolExecutor

# Import your custom prediction logic
from predict import load_drishtix_model, predict_live_risk

# 1. Initialize Redis and Thread Pool
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
STREAM_KEY = 'crowd_pings'
GROUP_NAME = 'anomaly_group'
CONSUMER_NAME = 'consumer_1'

background_worker = ThreadPoolExecutor(max_workers=5) 

try:
    r.xgroup_create(STREAM_KEY, GROUP_NAME, id='0', mkstream=True)
except redis.exceptions.ResponseError:
    pass

# 2. Load the Dual AI Engines
print("Loading AI Models...")
if_model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
rf_model = load_drishtix_model() # Loads the .pkl file

data_window = []
WINDOW_SIZE = 100

def generate_recommendation(ping_data, threat_reason):
    """Background LLM call to Ollama Llama 3.2"""
    prompt = f"""
    You are an AI safety assistant for an event venue.
    A threat was detected: {threat_reason}
    Sensor Data: {json.dumps(ping_data)}
    Provide a brief, 2-sentence actionable recommendation for the security team.
    """
    
    try:
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={"model": "llama3.2", "prompt": prompt, "stream": False},
            timeout=15
        )
        if response.status_code == 200:
            return response.json()['response']
        return "Warning: Could not get recommendation from LLM."
    except Exception as e:
        return f"LLM Connection Error: {str(e)}"

def handle_anomaly_pipeline(ping_data, threat_reason):
    """Runs in the background thread to handle heavy AI tasks."""
    print(f"\n[BACKGROUND] Processing {threat_reason} Alert...")
    
    # 1. THE VISION VERIFICATION (Calling your Tier 2 CLIP API)
    # We simulate grabbing the camera frame for the affected zone
    zone = ping_data.get('zone_id', 'Unknown Zone')
    print(f"👁️ Requesting visual verification for {zone}...")
    
    vision_context = ""
    try:
        # Assuming your Flask app runs on port 5000 and has an endpoint that accepts an image
        # You will need to start your vision_api server in a separate terminal for this to work!
        vision_response = requests.post(
            'http://localhost:5001/analyze_frame', # Update this to match your actual Flask route
            json={"zone_id": zone, "timestamp": ping_data.get('timestamp')},
            timeout=10
        )
        
        if vision_response.status_code == 200:
            clip_result = vision_response.json()
            vision_context = f"Visual Verification: {clip_result.get('description', 'Unverified')}"
            print(f"✅ Vision API Confirmed: {vision_context}")
        else:
            vision_context = "Visual Verification: Camera feed unavailable."
            print("⚠️ Vision API Offline or Error.")
    except Exception as e:
         vision_context = "Visual Verification: Camera feed unreachable."
         print("⚠️ Could not reach Vision API. Proceeding with sensor data only.")

    # 2. Add the visual context to the LLM Prompt
    prompt = f"""
    You are a safety and security AI helping EVENT ORGANIZERS PREVENT injuries.
    We are trying to STOP a crowd crush. A sensor threat was just detected: {threat_reason}
    Sensor Data: {json.dumps(ping_data)}
    Camera AI Report: {vision_context}
    
    Provide a brief, 2-sentence actionable recommendation for the security guards to safely disperse the crowd and resolve the bottleneck.
    """
    
    # 3. Get the final recommendation
    try:
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={"model": "llama3.2", "prompt": prompt, "stream": False},
            timeout=15
        )
        if response.status_code == 200:
            recommendation = response.json()['response']
        else:
            recommendation = "Warning: Could not get recommendation from LLM."
    except Exception as e:
        recommendation = f"LLM Connection Error: {str(e)}"
    
    print("-" * 50)
    print(f"🚨 FULL ALERT CONFIRMED 🚨")
    print(f"Trigger: {threat_reason}")
    print(f"Vision Data: {vision_context}")
    print(f"Action Plan: {recommendation.strip()}")
    print("-" * 50)
    
    # ==========================================
    # SEND THE AI RECOMMENDATIONS or DATA TO THE DrishtiX BACKEND/FRONTEND
    # ==========================================
    final_alert_payload = {
        "timestamp": ping_data.get('timestamp'),
        "zone_id": ping_data.get('zone_id'),
        "trigger_reason": threat_reason,
        "vision_verification": vision_context,
        "ai_action_plan": recommendation.strip(),
        "raw_sensor_data": ping_data
    }
    
    #--------------------------------------------------------------------->
    
    # Broadcast this JSON to anyone listening (like your Node.js server)
    # r.publish("drishtix_alerts", json.dumps(final_alert_payload))

    #OR ------------------------------------------------------------------>

    # Send the alert directly to your Node.js Express server
    requests.post("http://localhost:3000/api/receive-alert", json=final_alert_payload)

    #--------------------------------------------------------------------->

def start_stream_processor():
    print("🚀 DrishtiX Dual-Engine Stream Processor Started.")
    
    global data_window
    last_id = '>'

    while True:
        try:
            messages = r.xreadgroup(GROUP_NAME, CONSUMER_NAME, {STREAM_KEY: last_id}, count=1, block=2000)
            if not messages:
                continue
                
            for stream, message_list in messages:
                for message_id, message in message_list:
                    ping_data = json.loads(message['data'])
                    
                    # --- MODEL 1: THE WATCHDOG (Isolation Forest) ---
                    # Note: Assumes your producer.py is sending 'crowd_density' or 'crowd_count'
                    density = float(ping_data.get('crowd_density', ping_data.get('crowd_count', 0)))
                    data_window.append(density)
                    if len(data_window) > WINDOW_SIZE:
                        data_window.pop(0)
                        
                    if_anomaly = False
                    if len(data_window) == WINDOW_SIZE:
                        if_model.fit(np.array(data_window).reshape(-1, 1))
                        if if_model.predict([[density]])[0] == -1:
                            if_anomaly = True

                    # --- MODEL 2: THE FORECASTER (Random Forest) ---
                    # We pass the ping data dict straight to your predict_live_risk function
                    rf_risk_label, rf_confidence = predict_live_risk(rf_model, ping_data)
                    
                    rf_danger = False
                    # If it returns Class 2 (Medium) or Class 3 (High Danger)
                    if "MEDIUM" in rf_risk_label or "HIGH" in rf_risk_label:
                        rf_danger = True
                    
                    # --- THE DECISION ENGINE ---
                    if if_anomaly or rf_danger:
                        threat_reason = []
                        if if_anomaly: threat_reason.append("Statistical Density Spike (IF)")
                        if rf_danger: threat_reason.append(f"Physics Crush Risk [{rf_risk_label}] (RF)")
                        
                        trigger_msg = " + ".join(threat_reason)
                        print(f"\n⚠️ TIER 1 ALERT: {trigger_msg}")
                        
                        # Hand off to the background thread
                        background_worker.submit(handle_anomaly_pipeline, ping_data, trigger_msg)
                    
                    r.xack(STREAM_KEY, GROUP_NAME, message_id)
                    
        except Exception as e:
            print(f"Stream Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    start_stream_processor()