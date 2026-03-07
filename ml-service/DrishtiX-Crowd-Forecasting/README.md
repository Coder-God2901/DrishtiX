# 👁️ DrishtiX: Crowd Forecasting Engine

This repository contains the core Machine Learning microservice for DrishtiX. It ingests real-time crowd dynamics (camera/sensor data) and predicts the likelihood of a crowd crush 10 minutes before it happens.

## 🧠 The Physics-Driven AI Model
Unlike standard AI wrappers, DrishtiX uses a **Random Forest Classifier** trained on mathematically validated crowd physics. 

We engineered our dataset to correlate physical threat indicators. The AI specifically hunts for this dangerous pattern:
`High Density + Rapid Inflow + Zero Outflow + Low Movement Speed = Crush Risk`

### Model Performance
* **Overall Accuracy:** ~74% 
* **Safe Zone Detection (Class 0):** 85% Accuracy
* **High-Danger Detection (Class 3):** 82% Accuracy
*(Note: The AI accurately captures the extreme ends of crowd safety, perfectly mimicking real-world crowd volatility).*

## 📂 Project Architecture
We use a modular, production-ready pipeline:
* `/datasets`: Contains the raw CSV synthetic sensor data.
* `/models`: Stores the compiled, frozen AI brain (`crowd_risk_rf_model1.pkl`).
* `/src`: Contains the pipeline scripts.

## 🚀 How to Run the Engine

### 1. Train the Model (Optional)
If the dataset changes, retrain the model by navigating to the `src/` folder and running:
```bash
python data_prep.py     # Cleans and injects physics into the data
python train_model.py   # Trains the Random Forest and saves the .pkl file