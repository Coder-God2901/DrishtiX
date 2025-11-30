"""
ConvLSTM Training Pipeline for Crowd Density Prediction
Trains a ConvLSTM model on historical crowd density heatmaps from BigQuery

Requirements:
- tensorflow>=2.13.0
- google-cloud-bigquery>=3.11.0
- google-cloud-aiplatform>=1.35.0
- numpy>=1.24.0
- pandas>=2.0.0

Usage:
    python scripts/train-convlstm.py --mode fetch-data
    python scripts/train-convlstm.py --mode train
    python scripts/train-convlstm.py --mode deploy
"""

import os
import sys
import argparse
import numpy as np
import pandas as pd
import logging
import warnings
from datetime import datetime, timedelta
from typing import Tuple, List, Optional
try:
    from google.cloud import bigquery
    from google.cloud import aiplatform
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False
    warnings.warn(
        "Google Cloud libraries not installed. Using synthetic data mode.")
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import ConvLSTM2D, BatchNormalization, Conv2D, Dropout
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, TensorBoard
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    warnings.warn(
        "TensorFlow not installed. Run: pip install tensorflow>=2.13.0")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('train-convlstm.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'your-gcp-project-id')
DATASET_ID = 'drishtix_analytics'
LOCATION = os.getenv('GCP_REGION', 'us-central1')
BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'drishtix-data-storage')
MODEL_DIR = './models/convlstm'
DATA_DIR = './data/convlstm'

# Model hyperparameters
SEQUENCE_LENGTH = 10  # Use last 10 time steps (e.g., 10 minutes)
GRID_SIZE = 32  # 32x32 grid for crowd density heatmap
FORECAST_HORIZON = 3  # Predict next 3 time steps (e.g., 15 minutes ahead)
BATCH_SIZE = 16
EPOCHS = 50
LEARNING_RATE = 0.001


def setup_directories():
    """Create necessary directories"""
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"✓ Directories created: {MODEL_DIR}, {DATA_DIR}")


def fetch_bigquery_data(days_back=90):
    """
    Fetch historical crowd density data from BigQuery

    Args:
        days_back: Number of days of historical data to fetch

    Returns:
        DataFrame with crowd density features
    """
    print(f"\n📊 Fetching {days_back} days of historical data from BigQuery...")

    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    SELECT 
        event_id,
        zone_id,
        timestamp,
        density_norm,
        delta_t1,
        delta_t5,
        zone_type,
        time_sin,
        time_cos,
        ST_X(location) as lon,
        ST_Y(location) as lat
    FROM `{PROJECT_ID}.{DATASET_ID}.crowd_features`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days_back} DAY)
    ORDER BY event_id, timestamp
    """

    try:
        df = client.query(query).to_dataframe()
        print(f"✓ Fetched {len(df)} records from BigQuery")

        # Save raw data
        data_path = os.path.join(DATA_DIR, 'raw_data.csv')
        df.to_csv(data_path, index=False)
        print(f"✓ Saved raw data to {data_path}")

        return df

    except Exception as e:
        print(f"⚠️  BigQuery fetch failed: {e}")
        print("⚠️  Using synthetic data for training demonstration...")
        return generate_synthetic_data()


def generate_synthetic_data(num_events=10, steps_per_event=200):
    """
    Generate synthetic crowd density data for training demonstration

    This is used when real BigQuery data is not available.
    Replace with actual data in production.

    Args:
        num_events: Number of simulated events
        steps_per_event: Time steps per event

    Returns:
        DataFrame with synthetic crowd data
    """
    print(
        f"\n🔧 Generating synthetic data: {num_events} events × {steps_per_event} steps")

    data = []
    for event_idx in range(num_events):
        event_id = f"evt_{event_idx:03d}"
        base_time = datetime.now() - timedelta(days=90 - event_idx * 9)

        for step in range(steps_per_event):
            timestamp = base_time + timedelta(minutes=step * 5)

            # Simulate crowd buildup and dispersal
            t_norm = step / steps_per_event
            density_pattern = (
                0.3 * np.sin(t_norm * np.pi) +  # Bell curve attendance
                0.1 * np.sin(t_norm * np.pi * 4) +  # Periodic fluctuations
                0.05 * np.random.randn()  # Noise
            )
            density = np.clip(density_pattern, 0, 1)

            # Create grid zones
            for i in range(8):  # 8x8 zones
                for j in range(8):
                    zone_id = f"zone_{i}_{j}"

                    # Add spatial variation (higher density in center)
                    distance_from_center = np.sqrt((i - 4)**2 + (j - 4)**2)
                    spatial_factor = np.exp(-distance_from_center / 3)

                    zone_density = density * spatial_factor + 0.05 * np.random.randn()
                    zone_density = np.clip(zone_density, 0, 1)

                    data.append({
                        'event_id': event_id,
                        'zone_id': zone_id,
                        'timestamp': timestamp,
                        'density_norm': zone_density,
                        'delta_t1': 0.01 * np.random.randn(),
                        'delta_t5': 0.02 * np.random.randn(),
                        'zone_type': 'GRID',
                        'time_sin': np.sin(2 * np.pi * timestamp.hour / 24),
                        'time_cos': np.cos(2 * np.pi * timestamp.hour / 24),
                        'lat': 37.7749 + i * 0.001,
                        'lon': -122.4194 + j * 0.001,
                    })

    df = pd.DataFrame(data)

    # Save synthetic data
    data_path = os.path.join(DATA_DIR, 'synthetic_data.csv')
    df.to_csv(data_path, index=False)
    print(f"✓ Generated {len(df)} synthetic records")
    print(f"✓ Saved to {data_path}")

    return df


def prepare_sequences(df, grid_size=GRID_SIZE, seq_length=SEQUENCE_LENGTH, forecast_horizon=FORECAST_HORIZON):
    df.to_csv(data_path, index=False)
    print(f"✓ Generated {len(df)} synthetic records")
    print(f"✓ Saved to {data_path}")

    return df


def prepare_sequences(df, grid_size=GRID_SIZE, seq_length=SEQUENCE_LENGTH, forecast_horizon=FORECAST_HORIZON):
    """
    Convert crowd density data to ConvLSTM sequences

    Args:
        df: DataFrame with crowd density data
        grid_size: Size of spatial grid (grid_size x grid_size)
        seq_length: Number of past time steps to use
        forecast_horizon: Number of future steps to predict

    Returns:
        X: Input sequences (samples, seq_length, grid_size, grid_size, features)
        y: Target sequences (samples, forecast_horizon, grid_size, grid_size, 1)
    """
    print(f"\n🔄 Preparing ConvLSTM sequences...")
    print(
        f"   Grid: {grid_size}×{grid_size}, Sequence: {seq_length}, Forecast: {forecast_horizon}")

    # Group by event
    events = df['event_id'].unique()
    X_list = []
    y_list = []

    for event_id in events:
        event_df = df[df['event_id'] == event_id].sort_values('timestamp')

        # Reshape to grid format for each timestep
        timesteps = event_df['timestamp'].unique()

        for t_idx in range(len(timesteps) - seq_length - forecast_horizon + 1):
            # Input sequence (past)
            input_grids = []
            for i in range(seq_length):
                t = timesteps[t_idx + i]
                step_data = event_df[event_df['timestamp'] == t]

                # Create grid
                # 3 features: density, delta_t1, delta_t5
                grid = np.zeros((grid_size, grid_size, 3))

                for _, row in step_data.iterrows():
                    # Map zone to grid position
                    zone_parts = row['zone_id'].split('_')
                    if len(zone_parts) >= 3:
                        try:
                            x = int(zone_parts[1]) % grid_size
                            y = int(zone_parts[2]) % grid_size
                            grid[x, y, 0] = row['density_norm']
                            grid[x, y, 1] = row['delta_t1']
                            grid[x, y, 2] = row['delta_t5']
                        except:
                            pass

                input_grids.append(grid)

            # Target sequence (future)
            target_grids = []
            for i in range(forecast_horizon):
                t = timesteps[t_idx + seq_length + i]
                step_data = event_df[event_df['timestamp'] == t]

                # Only predict density
                grid = np.zeros((grid_size, grid_size, 1))

                for _, row in step_data.iterrows():
                    zone_parts = row['zone_id'].split('_')
                    if len(zone_parts) >= 3:
                        try:
                            x = int(zone_parts[1]) % grid_size
                            y = int(zone_parts[2]) % grid_size
                            grid[x, y, 0] = row['density_norm']
                        except:
                            pass

                target_grids.append(grid)

            X_list.append(np.array(input_grids))
            y_list.append(np.array(target_grids))  # Input sequence (past)
            input_grids = []
            for i in range(seq_length):
                t = timesteps[t_idx + i]
                step_data = event_df[event_df['timestamp'] == t]

                # Create grid
                # 3 features: density, delta_t1, delta_t5
                grid = np.zeros((grid_size, grid_size, 3))

                for _, row in step_data.iterrows():
                    # Map zone to grid position
                    zone_parts = row['zone_id'].split('_')
                    if len(zone_parts) >= 3:
                        try:
                            x = int(zone_parts[1]) % grid_size
                            y = int(zone_parts[2]) % grid_size
                            grid[x, y, 0] = row['density_norm']
                            grid[x, y, 1] = row['delta_t1']
                            grid[x, y, 2] = row['delta_t5']
                        except:
                            pass

                input_grids.append(grid)

            # Target sequence (future)
            target_grids = []
            for i in range(forecast_horizon):
                t = timesteps[t_idx + seq_length + i]
                step_data = event_df[event_df['timestamp'] == t]

                # Only predict density
                grid = np.zeros((grid_size, grid_size, 1))

                for _, row in step_data.iterrows():
                    zone_parts = row['zone_id'].split('_')
                    if len(zone_parts) >= 3:
                        try:
                            x = int(zone_parts[1]) % grid_size
                            y = int(zone_parts[2]) % grid_size
                            grid[x, y, 0] = row['density_norm']
                        except:
                            pass

                target_grids.append(grid)

            X_list.append(np.array(input_grids))
            y_list.append(np.array(target_grids))

    X = np.array(X_list)
    y = np.array(y_list)

    print(f"✓ Prepared sequences: X shape = {X.shape}, y shape = {y.shape}")
    return X, y


def build_convlstm_model(input_shape: Tuple[int, int, int, int], output_steps: int) -> Sequential:
    """
    Build ConvLSTM model architecture

    Args:
        input_shape: (seq_length, grid_size, grid_size, features)
        output_steps: Number of forecast steps

    Returns:
        Compiled Keras model
    """
    if not TF_AVAILABLE:
        logger.error("TensorFlow not installed. Cannot build model.")
        raise ImportError(
            "TensorFlow required. Install with: pip install tensorflow>=2.13.0")

    logger.info(f"\n🏗️  Building ConvLSTM model...")
    logger.info(f"   Input shape: {input_shape}")
    logger.info(f"   Output steps: {output_steps}")

    model = Sequential([
        # First ConvLSTM layer
        ConvLSTM2D(
            filters=64,
            kernel_size=(3, 3),
            padding='same',
            return_sequences=True,
            input_shape=input_shape
        ),
        BatchNormalization(),
        Dropout(0.2),

        # Second ConvLSTM layer
        ConvLSTM2D(
            filters=32,
            kernel_size=(3, 3),
            padding='same',
            return_sequences=True
        ),
        BatchNormalization(),
        Dropout(0.2),

        # Third ConvLSTM layer
        ConvLSTM2D(
            filters=16,
            kernel_size=(3, 3),
            padding='same',
            return_sequences=False
        ),
        BatchNormalization(),

        # Output layer (generate forecast_horizon frames)
        Conv2D(
            filters=output_steps,
            kernel_size=(1, 1),
            activation='sigmoid',
            padding='same'
        )
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='mse',
        metrics=['mae', 'mape']
    )

    print("✓ Model built successfully")
    model.summary()

    return model


def train_model(X_train, y_train, X_val, y_val):
    """
    Train ConvLSTM model

    Args:
        X_train, y_train: Training data
        X_val, y_val: Validation data

    Returns:
        Trained model and training history
    """
    print(f"\n🚀 Starting training...")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Validation samples: {len(X_val)}")
    print(f"   Batch size: {BATCH_SIZE}, Epochs: {EPOCHS}")

    # Build model
    # (seq_length, grid_size, grid_size, features)
    input_shape = X_train.shape[1:]
    output_steps = y_train.shape[1]  # forecast_horizon

    # Reshape y to (samples, grid_size, grid_size, forecast_horizon)
    y_train_reshaped = y_train.transpose(0, 2, 3, 1, 4).squeeze(-1)
    y_val_reshaped = y_val.transpose(0, 2, 3, 1, 4).squeeze(-1)

    model = build_convlstm_model(input_shape, output_steps)

    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=os.path.join(MODEL_DIR, 'convlstm_best.h5'),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        TensorBoard(
            log_dir=os.path.join(MODEL_DIR, 'logs'),
            histogram_freq=1
        )
    ]

    # Train
    history = model.fit(
        X_train, y_train_reshaped,
        validation_data=(X_val, y_val_reshaped),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )

    # Save final model
    model_path = os.path.join(MODEL_DIR, 'convlstm_final.h5')
    model.save(model_path)
    print(f"\n✓ Model saved to {model_path}")

    return model, history


def deploy_to_vertex_ai(model_path):
    """
    Deploy trained model to Vertex AI endpoint

    Args:
        model_path: Path to saved model
    """
    print(f"\n☁️  Deploying model to Vertex AI...")

    try:
        aiplatform.init(project=PROJECT_ID, location=LOCATION)

        # Upload model
        print("   Uploading model to Vertex AI Model Registry...")
        model = aiplatform.Model.upload(
            display_name=f"convlstm-crowd-prediction-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            artifact_uri=f"gs://{BUCKET_NAME}/models/convlstm/",
            serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-13:latest",
            description="ConvLSTM model for crowd density forecasting",
        )
        print(f"✓ Model uploaded: {model.resource_name}")

        # Create endpoint
        print("   Creating Vertex AI endpoint...")
        endpoint = aiplatform.Endpoint.create(
            display_name=f"convlstm-endpoint-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            description="ConvLSTM crowd prediction endpoint"
        )
        print(f"✓ Endpoint created: {endpoint.resource_name}")

        # Deploy model to endpoint
        print("   Deploying model to endpoint...")
        model.deploy(
            endpoint=endpoint,
            deployed_model_display_name="convlstm-v1",
            machine_type="n1-standard-4",
            min_replica_count=1,
            max_replica_count=3,
        )

        print(f"\n✅ Model deployed successfully!")
        print(f"   Endpoint ID: {endpoint.name}")
        print(f"   Add this to your .env file:")
        print(f"   VERTEX_AI_CONVLSTM_ENDPOINT={endpoint.name}")

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        print("   Make sure you have:")
        print("   1. Vertex AI API enabled")
        print("   2. GCS bucket created")
        print("   3. Proper IAM permissions")


def main():
    parser = argparse.ArgumentParser(
        description='Train ConvLSTM model for crowd prediction')
    parser.add_argument(
        '--mode',
        choices=['fetch-data', 'train', 'deploy', 'full'],
        default='full',
        help='Execution mode'
    )
    parser.add_argument('--days-back', type=int, default=90,
                        help='Days of historical data to fetch')
    parser.add_argument('--use-synthetic', action='store_true',
                        help='Force use of synthetic data')

    args = parser.parse_args()

    print("=" * 60)
    print("ConvLSTM Crowd Density Prediction - Training Pipeline")
    print("=" * 60)

    setup_directories()

    # Step 1: Fetch/Generate Data
    if args.mode in ['fetch-data', 'full']:
        if args.use_synthetic:
            df = generate_synthetic_data()
        else:
            df = fetch_bigquery_data(args.days_back)

        # Prepare sequences
        X, y = prepare_sequences(df)

        # Train/val split
        split_idx = int(0.8 * len(X))
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]

        # Save prepared data
        np.save(os.path.join(DATA_DIR, 'X_train.npy'), X_train)
        np.save(os.path.join(DATA_DIR, 'X_val.npy'), X_val)
        np.save(os.path.join(DATA_DIR, 'y_train.npy'), y_train)
        np.save(os.path.join(DATA_DIR, 'y_val.npy'), y_val)
        print(f"✓ Saved prepared sequences to {DATA_DIR}")

        if args.mode == 'fetch-data':
            print("\n✅ Data preparation complete. Run with --mode train to train model.")
            returnprint(
                "\n✅ Data preparation complete. Run with --mode train to train model.")
            return

    # Step 2: Train Model
    if args.mode in ['train', 'full']:
        # Load prepared data
        X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
        X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
        y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
        y_val = np.load(os.path.join(DATA_DIR, 'y_val.npy'))

        model, history = train_model(X_train, y_train, X_val, y_val)

        if args.mode == 'train':
            print("\n✅ Training complete. Run with --mode deploy to deploy to Vertex AI.")
            returnprint(
                "\n✅ Training complete. Run with --mode deploy to deploy to Vertex AI.")
            return

    # Step 3: Deploy to Vertex AI
    if args.mode in ['deploy', 'full']:
        model_path = os.path.join(MODEL_DIR, 'convlstm_final.h5')
        if os.path.exists(model_path):
            deploy_to_vertex_ai(model_path)
        else:
            print(f"\n❌ Model not found at {model_path}. Train model first.")
        model_path = os.path.join(MODEL_DIR, 'convlstm_final.h5')
        if os.path.exists(model_path):
            deploy_to_vertex_ai(model_path)
        else:
            print(f"\n❌ Model not found at {model_path}. Train model first.")

    print("\n" + "=" * 60)
    print("✅ Pipeline complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
