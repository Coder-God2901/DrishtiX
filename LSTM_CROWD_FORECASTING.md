# LSTM Integration Quick Start Guide

## Overview

The LSTM integration script (`scripts/lstm_integration.py`) connects machine learning models with DrishtiX's real-time crowd forecasting system to predict future crowd levels.

## Prerequisites

### 1. Python Dependencies

```bash
pip install requests numpy tensorflow pandas scikit-learn
```

### 2. Backend Running

```bash
cd c:\Users\KIIT\Desktop\open-source\DrishtiX
npm run dev
```

### 3. Real-Time Data Collection Active

```bash
# Start data collection for your event
curl -X POST http://localhost:3000/api/events/YOUR_EVENT_ID/zones/start-collection
```

## Quick Start

### Step 1: Check Data Availability

Before running predictions, verify that sufficient historical data exists:

```bash
python scripts/lstm_integration.py \
  --event-id "clz123456789" \
  --check-data
```

**Expected Output:**

```
Data Availability Status:
  Event ID: clz123456789
  Zones Configured: 8
  Zones Ready: 6
  Zones with Insufficient Data: 2
  Overall Ready: ✗

Zones needing more data:
  - Food Court A: 5/12 timesteps
  - Entrance South: 8/12 timesteps
```

> **Note:** You need at least 12 timesteps (60 minutes) of data for each zone before predictions can be made.

### Step 2: Create or Load LSTM Model

#### Option A: Use Example Model (for testing)

```python
from scripts.lstm_integration import create_example_model

# Creates untrained model with correct architecture
model = create_example_model(timesteps=12, features=14)
model.save('models/example_lstm.h5')
```

#### Option B: Train Your Own Model

```python
import tensorflow as tf
import numpy as np
from scripts.lstm_integration import DrishtiXLSTMClient

client = DrishtiXLSTMClient()

# Fetch historical data for training
# (Implement data collection from ZoneState table)
X_train, y_train = load_training_data()  # Your implementation

# Build model
model = tf.keras.Sequential([
    tf.keras.layers.LSTM(128, return_sequences=True, input_shape=(12, 14)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.LSTM(64),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1)
])

model.compile(optimizer='adam', loss='mse', metrics=['mae'])
model.fit(X_train, y_train, epochs=50, batch_size=32, validation_split=0.2)
model.save('models/trained_lstm.h5')
```

### Step 3: Run Single Prediction Test

Test predictions with a single run:

```bash
python scripts/lstm_integration.py \
  --event-id "clz123456789" \
  --model-path "models/trained_lstm.h5" \
  --single-run \
  --horizons 10 30 60
```

**Expected Output:**

```
Generating 10-minute forecasts...
  ✓ Main Entrance: 245 people (MEDIUM, MEDIUM)
  ✓ Food Court A: 312 people (HIGH, HIGH)
  ✓ Seating Area 1: 489 people (HIGH, CRITICAL)
  ...
```

### Step 4: Run Continuous Predictions

Start the prediction loop for real-time forecasting:

```bash
python scripts/lstm_integration.py \
  --event-id "clz123456789" \
  --model-path "models/trained_lstm.h5" \
  --interval 5 \
  --horizons 10 30 60
```

**Output:**

```
Starting prediction loop for event clz123456789
Prediction interval: 5 minutes
Horizons: [10, 30, 60] minutes

============================================================
Prediction Cycle #1 - 2026-01-13 10:15:00 UTC
============================================================

Generating 10-minute forecasts...
  ✓ 8/8 forecasts sent successfully
  ⚠ 2 zones at HIGH/CRITICAL risk:
    - Food Court A: 312 people (HIGH)
    - Seating Area 1: 489 people (CRITICAL)

Generating 30-minute forecasts...
  ✓ 8/8 forecasts sent successfully

Generating 60-minute forecasts...
  ✓ 8/8 forecasts sent successfully

Cycle completed in 3.42s
Sleeping for 297s until next cycle...
```

Press `Ctrl+C` to stop the loop gracefully.

## Command-Line Options

### Required Arguments

- `--event-id EVENT_ID` - Event UUID to forecast

### Optional Arguments

- `--model-path PATH` - Path to trained model (.h5 or SavedModel)
- `--url URL` - DrishtiX backend URL (default: `http://localhost:3000`)
- `--interval MINUTES` - Prediction interval (default: 5)
- `--horizons MIN [MIN ...]` - Prediction horizons (default: 10 30 60)
- `--check-data` - Check data availability and exit
- `--single-run` - Run once and exit (no loop)

## Understanding the Output

### Prediction Format

Each prediction includes:

```json
{
  "eventId": "clz123456789",
  "zoneId": "ZONE_ENTRANCE_MAIN",
  "zoneName": "Main Entrance",
  "forecastTime": "2026-01-13T10:15:00.000Z",
  "targetTime": "2026-01-13T10:25:00.000Z",
  "horizonMinutes": 10,
  "predictedCount": 245,
  "predictedDensity": 2.45,
  "predictedDensityLevel": "MEDIUM",
  "predictedRiskLevel": "MEDIUM",
  "confidence": 0.85,
  "modelVersion": "v1.0",
  "modelType": "LSTM",
  "alerts": [
    {
      "type": "CAPACITY_WARNING",
      "severity": "MEDIUM",
      "message": "Main Entrance predicted to reach 78.5% capacity"
    }
  ],
  "recommendations": [
    "Increase monitoring frequency for Main Entrance",
    "Open alternate routes via North Gate, South Gate"
  ]
}
```

### Density Levels

- **LOW**: < 1.0 people/m²
- **MEDIUM**: 1.0 - 2.0 people/m²
- **HIGH**: 2.0 - 3.0 people/m²
- **CRITICAL**: ≥ 3.0 people/m²

### Risk Levels

- **LOW**: < 60% capacity
- **MEDIUM**: 60-75% capacity
- **HIGH**: 75-90% capacity
- **CRITICAL**: ≥ 90% capacity

### Alert Types

| Type                | Severity | Trigger                        |
| ------------------- | -------- | ------------------------------ |
| `CAPACITY_CRITICAL` | CRITICAL | Predicted ≥95% capacity        |
| `CAPACITY_HIGH`     | HIGH     | Predicted ≥85% capacity        |
| `CAPACITY_WARNING`  | MEDIUM   | Predicted ≥75% capacity        |
| `BOTTLENECK_RISK`   | HIGH     | Bottleneck zone >70% capacity  |
| `QUEUE_BUILDUP`     | MEDIUM   | Queue-prone zone >60% capacity |

## Integration with DrishtiX APIs

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                   LSTM Integration                       │
└─────────────────────────────────────────────────────────┘

1. Fetch Zone Metadata
   GET /api/events/:eventId/zones
   → Returns zone capacity, area, type, characteristics

2. Fetch Historical Data
   GET /api/events/:eventId/zones/:zoneId/state/history?window=60
   → Returns last 12 timesteps (5-min intervals)

3. Get Schedule Context
   GET /api/events/:eventId/schedule/context
   → Returns current event phase

4. Prepare Features
   14 features from ZoneState:
   - crowdCount, crowdDensity, inflowRate, outflowRate
   - netFlowRate, avgSpeed, directionEntropy
   - queueLength, avgWaitTime, temperature, humidity
   - congestionScore, bottleneckScore, riskScore

5. Run LSTM Model
   Input: (1, 12, 14) tensor
   Output: Predicted crowd count

6. Calculate Metrics
   - Predicted density
   - Risk level
   - Generate alerts
   - Generate recommendations

7. Send to DrishtiX
   POST /api/events/:eventId/zones/forecast
   → Stores in CrowdForecast table

8. Frontend Retrieves
   GET /api/events/:eventId/zones/forecast
   → Organizers view predictions on dashboard
```

## Troubleshooting

### "Insufficient data for zone"

**Problem:** Zone doesn't have 12 timesteps (60 minutes) of data.

**Solution:**

1. Wait for more data to accumulate (real-time collection runs every 5 minutes)
2. Check if data collection is running:
   ```bash
   curl http://localhost:3000/api/events/EVENT_ID/zones/realtime-status
   ```

### "Failed to fetch zone state history"

**Problem:** API endpoint not responding or zone doesn't exist.

**Solution:**

1. Verify backend is running
2. Check event ID is correct
3. Verify zones are configured:
   ```bash
   curl http://localhost:3000/api/events/EVENT_ID/zones
   ```

### "Model prediction failed"

**Problem:** Model input shape mismatch.

**Solution:**

1. Ensure model expects shape `(None, 12, 14)`
2. Verify model is compatible with TensorFlow version
3. Check model file is not corrupted

### Predictions are inaccurate

**Problem:** Model not trained or poorly trained.

**Solution:**

1. Train model with historical data from your venue
2. Collect more diverse training data (different event phases)
3. Tune hyperparameters
4. Consider using ensemble methods

## Advanced Usage

### Custom Feature Engineering

Modify `prepare_lstm_features()` to add custom features:

```python
def prepare_lstm_features(self, zone_states):
    # ... existing code ...

    # Add custom features
    df['crowd_velocity'] = df['avgSpeed'] * df['crowdDensity']
    df['pressure_index'] = df['congestionScore'] * df['bottleneckScore']

    # Update feature_columns list
    feature_columns.extend(['crowd_velocity', 'pressure_index'])

    # ... rest of code ...
```

### Multi-Output Models

Predict multiple outputs (crowd count, inflow, outflow):

```python
# Build multi-output model
model = tf.keras.Sequential([
    tf.keras.layers.LSTM(128, return_sequences=True, input_shape=(12, 14)),
    tf.keras.layers.LSTM(64),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(3)  # [count, inflow, outflow]
])

# Update prediction handling
y_pred = model.predict(X, verbose=0)
predicted_count = float(y_pred[0][0])
predicted_inflow = float(y_pred[0][1])
predicted_outflow = float(y_pred[0][2])
```

### Uncertainty Estimation

Add dropout at inference time for uncertainty:

```python
# Enable dropout during inference
import tensorflow as tf

class MCDropout(tf.keras.layers.Dropout):
    def call(self, inputs, training=None):
        return super().call(inputs, training=True)

# Make multiple predictions
predictions = [model.predict(X) for _ in range(30)]
mean_pred = np.mean(predictions, axis=0)
std_pred = np.std(predictions, axis=0)

confidence = 1 - (std_pred / mean_pred)  # Higher confidence = lower uncertainty
```

## Best Practices

### 1. Data Quality

- ✅ Ensure camera/sensor data is accurate
- ✅ Handle missing data gracefully
- ✅ Validate zone state timestamps

### 2. Model Training

- ✅ Use diverse training data from multiple events
- ✅ Include different event phases (entry, main event, exit)
- ✅ Validate on hold-out test set
- ✅ Monitor prediction accuracy over time

### 3. Production Deployment

- ✅ Use trained model, not example model
- ✅ Set appropriate prediction interval (5-10 minutes)
- ✅ Monitor model performance metrics
- ✅ Implement fallback mechanisms
- ✅ Log predictions for analysis

### 4. Alert Management

- ✅ Tune alert thresholds for venue type
- ✅ Avoid alert fatigue (don't alert too frequently)
- ✅ Provide actionable recommendations
- ✅ Integrate with notification system

## Performance Optimization

### Batch Processing

Process multiple zones in parallel:

```python
import concurrent.futures

def predict_zone_wrapper(args):
    model, client, event_id, zone_meta, horizon = args
    return client.predict_zone(model, event_id,
                               zone_meta['zoneId'],
                               zone_meta, horizon)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    args = [(model, client, event_id, zm, 10) for zm in zones_metadata]
    predictions = list(executor.map(predict_zone_wrapper, args))
```

### Model Optimization

1. **Quantization** - Reduce model size
2. **TensorFlow Lite** - Faster inference
3. **ONNX Runtime** - Cross-platform optimization
4. **Caching** - Cache zone metadata

## Next Steps

1. ✅ Complete data collection setup
2. ✅ Train LSTM model with historical data
3. ✅ Test predictions in single-run mode
4. ✅ Validate predictions against ground truth
5. ✅ Deploy continuous prediction loop
6. ✅ Monitor model performance
7. ✅ Iterate and improve model

## Support

For issues or questions:

- Check logs in terminal output
- Review `INTEGRATION_COMPLETE.md`
- See `ORGANIZER_CONFIG_QUICK_REFERENCE.md`
- Check API endpoints in `zone-forecasting.routes.ts`

---

**Version:** 1.0
**Last Updated:** January 13, 2026
**Status:** Production Ready
