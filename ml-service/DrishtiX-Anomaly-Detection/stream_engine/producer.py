import redis
import json
import time
import random
from datetime import datetime

# Connect to local Redis server
# (For production, you would swap this to an AWS ElastiCache or Kinesis endpoint)
try:
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    r.ping()
    print("✅ Connected to Redis Event Stream")
except redis.ConnectionError:
    print("❌ ERROR: Could not connect to Redis. Is the Redis server running?")
    exit(1)

STREAM_KEY = 'crowd_pings'

def generate_sensor_payload(is_anomaly=False):
    """
    Simulates physical crowd data. 
    If is_anomaly is True, it generates physics that mimic a crowd crush.
    """
    if is_anomaly:
        # 🚨 THE CRUSH SCENARIO: 
        # Massive crowd, high inflow, zero outflow, nobody is moving.
        data = {
            "timestamp": datetime.now().isoformat(),
            "zone_id": "GATE_A_BOTTLENECK",
            "crowd_count": round(random.uniform(4000, 5500), 1),
            "crowd_density": round(random.uniform(4.5, 6.0), 2), # People per sq meter
            "inflow_rate": round(random.uniform(80.0, 100.0), 1),
            "outflow_rate": round(random.uniform(0.0, 5.0), 1),
            "avg_speed": round(random.uniform(0.05, 0.2), 2),
            "direction_entropy": round(random.uniform(0.7, 0.9), 2)
        }
    else:
        # 🟢 NORMAL FLOW: 
        # Manageable crowd, balanced inflow/outflow, walking speed.
        data = {
            "timestamp": datetime.now().isoformat(),
            "zone_id": "GATE_A_MAIN",
            "crowd_count": round(random.uniform(100, 300), 1),
            "crowd_density": round(random.uniform(0.5, 1.2), 2),
            "inflow_rate": round(random.uniform(10.0, 20.0), 1),
            "outflow_rate": round(random.uniform(10.0, 22.0), 1),
            "avg_speed": round(random.uniform(1.2, 2.0), 2),
            "direction_entropy": round(random.uniform(0.1, 0.3), 2)
        }
    return data

def stream_live_data():
    print("🚀 DrishtiX IoT Producer Started.")
    print("Streaming live sensor data to Redis... (Press Ctrl+C to stop)")
    print("-" * 50)
    
    ping_counter = 0
    
    try:
        while True:
            ping_counter += 1
            
            # Inject a dangerous anomaly every 15 pings for the demo
            is_anomaly = (ping_counter % 15 == 0)
            
            payload = generate_sensor_payload(is_anomaly)
            
            # Push to the Redis Stream
            # We wrap the payload in a 'data' key as a JSON string because 
            # that's exactly how your main.py is programmed to read it.
            message_id = r.xadd(STREAM_KEY, {'data': json.dumps(payload)})
            
            if is_anomaly:
                print(f"🔴 [DANGER INJECTED] Sent massive crowd spike -> ID: {message_id}")
            else:
                print(f"🟢 [SAFE] Sent normal flow ping -> Count: {payload['crowd_count']}")
            
            # Simulate a 1-second delay between hardware sensor readings
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Stream stopped by user.")

if __name__ == "__main__":
    stream_live_data()