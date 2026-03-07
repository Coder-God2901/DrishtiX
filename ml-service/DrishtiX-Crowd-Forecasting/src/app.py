from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import the functions we just wrote in predict.py
from predict import load_drishtix_model, predict_live_risk

# Initialize the API and load the model into memory at startup
app = FastAPI(title="DrishtiX Live Inference API", version="1.0")
model = load_drishtix_model()

# Define the exact JSON structure we expect from the live sensors
class SensorReading(BaseModel):
    crowd_count: float
    inflow_rate: float
    outflow_rate: float
    avg_speed: float
    direction_entropy: float

@app.get("/health")
async def health_check():
    """Confirms the API is running and the model is loaded."""
    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load. Run train_model.py first.")
    return {"status": "Online", "model": "crowd_risk_rf_model1.pkl"}

@app.post("/api/predict-risk")
async def predict_risk(reading: SensorReading):
    """
    Takes live sensor data, feeds it to the Random Forest, 
    and returns a real-time risk assessment.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model is offline.")
        
    try:
        # Convert the incoming JSON into a Python dictionary
        data_dict = reading.model_dump()
        
        # Get the prediction from our predict.py function
        risk_level, confidence = predict_live_risk(model, data_dict)
        
        return {
            "success": True,
            "threat_assessment": risk_level,
            "confidence_score": round(confidence, 2),
            "sensor_data_processed": data_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting DrishtiX API Server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)