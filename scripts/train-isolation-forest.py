"""
Isolation Forest Training Pipeline for L2 Anomaly Detection
Trains an Isolation Forest model on historical crowd density patterns

Requirements:
- scikit-learn>=1.3.0
- google-cloud-bigquery>=3.11.0
- google-cloud-storage>=2.10.0
- joblib>=1.3.0
- numpy>=1.24.0
- pandas>=2.0.0

Usage:
    python scripts/train-isolation-forest.py --mode fetch-data
    python scripts/train-isolation-forest.py --mode train
    python scripts/train-isolation-forest.py --mode upload
"""

import os
import sys
import argparse
import numpy as np
import pandas as pd
import joblib
import logging
import warnings
from datetime import datetime, timedelta
from typing import Tuple, List, Dict, Any
try:
    from google.cloud import bigquery
    from google.cloud import storage
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False
    warnings.warn(
        "Google Cloud libraries not installed. Using synthetic data mode.")
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('train-isolation-forest.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'your-gcp-project-id')
DATASET_ID = 'drishtix_analytics'
BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'drishtix-data-storage')
MODEL_DIR = './models/isolation-forest'
DATA_DIR = './data/isolation-forest'

# Model hyperparameters
N_ESTIMATORS = 100
CONTAMINATION = 0.05  # Expected percentage of anomalies (5%)
MAX_SAMPLES = 256
RANDOM_STATE = 42


def setup_directories():
    """Create necessary directories"""
    try:
        os.makedirs(MODEL_DIR, exist_ok=True)
        os.makedirs(DATA_DIR, exist_ok=True)
        logger.info(f"✓ Directories created: {MODEL_DIR}, {DATA_DIR}")
    except Exception as e:
        logger.error(f"Failed to create directories: {e}")
        raise


def fetch_bigquery_data(days_back=90) -> pd.DataFrame:
    """
    Fetch historical crowd density features from BigQuery

    Args:
        days_back: Number of days of historical data to fetch

    Returns:
        DataFrame with crowd features and anomaly labels
    """
    if not GCP_AVAILABLE:
        logger.warning("GCP libraries not available. Using synthetic data.")
        return generate_synthetic_data()

    logger.info(
        f"\n📊 Fetching {days_back} days of historical data from BigQuery...")

    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    WITH crowd_stats AS (
        SELECT 
            event_id,
            zone_id,
            timestamp,
            density_norm,
            delta_t1,
            delta_t5,
            delta_t15,
            velocity_mag,
            acceleration_mag,
            time_sin,
            time_cos,
            weather_temp,
            weather_humidity,
            is_weekend,
            hour_of_day,
            -- Label anomalies based on extreme values or known incidents
            CASE 
                WHEN density_norm > 0.85 THEN 1  -- Overcrowding
                WHEN delta_t1 > 0.3 THEN 1       -- Sudden spike
                WHEN velocity_mag > 2.0 THEN 1   -- Panic movement
                WHEN EXISTS (
                    SELECT 1 FROM `{PROJECT_ID}.{DATASET_ID}.incidents` i
                    WHERE i.event_id = cf.event_id
                    AND ABS(TIMESTAMP_DIFF(i.timestamp, cf.timestamp, MINUTE)) <= 5
                ) THEN 1
                ELSE 0
            END as is_anomaly
        FROM `{PROJECT_ID}.{DATASET_ID}.crowd_features` cf
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days_back} DAY)
    )
    SELECT * FROM crowd_stats
    ORDER BY timestamp
    """

    try:
        df = client.query(query).to_dataframe()
        print(f"✓ Fetched {len(df)} records from BigQuery")

        # Check anomaly distribution
        anomaly_count = df['is_anomaly'].sum()
        anomaly_pct = 100 * anomaly_count / len(df)
        print(f"   Anomalies: {anomaly_count} ({anomaly_pct:.2f}%)")

        # Save raw data
        data_path = os.path.join(DATA_DIR, 'raw_data.csv')
        df.to_csv(data_path, index=False)
        print(f"✓ Saved raw data to {data_path}")

        return df

    except Exception as e:
        print(f"⚠️  BigQuery fetch failed: {e}")
        print("⚠️  Using synthetic data for training demonstration...")
        return generate_synthetic_data()


def generate_synthetic_data(num_samples=10000):
    """
    Generate synthetic crowd density data with anomalies

    This is used when real BigQuery data is not available.
    Replace with actual data in production.

    Args:
        num_samples: Number of samples to generate

    Returns:
        DataFrame with synthetic crowd features
    """
    print(f"\n🔧 Generating {num_samples} synthetic samples...")

    np.random.seed(RANDOM_STATE)

    # Normal crowd patterns
    normal_samples = int(num_samples * 0.95)

    # Normal data (Gaussian distribution)
    normal_data = {
        'event_id': [f"evt_{i//100:03d}" for i in range(normal_samples)],
        'zone_id': [f"zone_{i % 10}_{i % 8}" for i in range(normal_samples)],
        'timestamp': [datetime.now() - timedelta(minutes=i*5) for i in range(normal_samples)],
        'density_norm': np.random.normal(0.4, 0.15, normal_samples).clip(0, 0.8),
        'delta_t1': np.random.normal(0.0, 0.05, normal_samples),
        'delta_t5': np.random.normal(0.0, 0.08, normal_samples),
        'delta_t15': np.random.normal(0.0, 0.12, normal_samples),
        'velocity_mag': np.random.normal(0.5, 0.2, normal_samples).clip(0, 1.5),
        'acceleration_mag': np.random.normal(0.0, 0.1, normal_samples).clip(-0.5, 0.5),
        # 288 = 5-min intervals in a day
        'time_sin': [np.sin(2 * np.pi * i / 288) for i in range(normal_samples)],
        'time_cos': [np.cos(2 * np.pi * i / 288) for i in range(normal_samples)],
        'weather_temp': np.random.normal(22, 5, normal_samples),
        'weather_humidity': np.random.normal(60, 15, normal_samples).clip(30, 90),
        'is_weekend': [i % 7 < 2 for i in range(normal_samples)],
        'hour_of_day': [i % 24 for i in range(normal_samples)],
        'is_anomaly': [0] * normal_samples
    }

    # Anomalous data (outliers)
    anomaly_samples = num_samples - normal_samples

    anomaly_data = {
        'event_id': [f"evt_{i//100:03d}" for i in range(anomaly_samples)],
        'zone_id': [f"zone_{i % 10}_{i % 8}" for i in range(anomaly_samples)],
        'timestamp': [datetime.now() - timedelta(minutes=i*5) for i in range(anomaly_samples)],
        # Overcrowding
        'density_norm': np.random.uniform(0.85, 1.0, anomaly_samples),
        # Sudden spikes
        'delta_t1': np.random.uniform(0.3, 0.6, anomaly_samples),
        'delta_t5': np.random.uniform(0.4, 0.8, anomaly_samples),
        'delta_t15': np.random.uniform(0.5, 1.0, anomaly_samples),
        # Panic movement
        'velocity_mag': np.random.uniform(2.0, 4.0, anomaly_samples),
        'acceleration_mag': np.random.uniform(0.5, 1.5, anomaly_samples),
        'time_sin': [np.sin(2 * np.pi * i / 288) for i in range(anomaly_samples)],
        'time_cos': [np.cos(2 * np.pi * i / 288) for i in range(anomaly_samples)],
        'weather_temp': np.random.normal(22, 5, anomaly_samples),
        'weather_humidity': np.random.normal(60, 15, anomaly_samples).clip(30, 90),
        'is_weekend': [i % 7 < 2 for i in range(anomaly_samples)],
        'hour_of_day': [i % 24 for i in range(anomaly_samples)],
        'is_anomaly': [1] * anomaly_samples
    }

    # Combine and shuffle
    df_normal = pd.DataFrame(normal_data)
    df_anomaly = pd.DataFrame(anomaly_data)
    df = pd.concat([df_normal, df_anomaly], ignore_index=True).sample(
        frac=1, random_state=RANDOM_STATE)

    # Save synthetic data
    data_path = os.path.join(DATA_DIR, 'synthetic_data.csv')
    df.to_csv(data_path, index=False)
    print(f"✓ Generated {len(df)} synthetic records")
    print(
        f"   Anomalies: {anomaly_samples} ({100*anomaly_samples/num_samples:.1f}%)")
    print(f"✓ Saved to {data_path}")

    return df


def prepare_features(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str], StandardScaler]:
    """
    Prepare feature matrix for Isolation Forest

    Args:
        df: DataFrame with crowd features

    Returns:
        X: Feature matrix
        y: Anomaly labels (for evaluation)
        feature_names: List of feature names
        scaler: Fitted StandardScaler
    """
    logger.info(f"\n🔄 Preparing features for Isolation Forest...")

    # Validate required columns
    required_cols = ['density_norm', 'delta_t1', 'delta_t5', 'delta_t15',
                     'velocity_mag', 'acceleration_mag', 'time_sin', 'time_cos',
                     'weather_temp', 'weather_humidity', 'hour_of_day', 'is_weekend', 'is_anomaly']

    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        logger.warning(
            f"Missing columns: {missing_cols}. Using available columns.")
        required_cols = [col for col in required_cols if col in df.columns]
        logger.warning(
            f"Missing columns: {missing_cols}. Using available columns.")
        required_cols = [col for col in required_cols if col in df.columns]

    # Select numerical features
    feature_cols = [
        'density_norm',
        'delta_t1',
        'delta_t5',
        'delta_t15',
        'velocity_mag',
        'acceleration_mag',
        'time_sin',
        'time_cos',
        'weather_temp',
        'weather_humidity',
        'hour_of_day'
    ]

    # Convert boolean to int
    df['is_weekend'] = df['is_weekend'].astype(int)
    feature_cols.append('is_weekend')

    X = df[feature_cols].values
    y = df['is_anomaly'].values

    # Standardize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print(f"✓ Feature matrix: {X_scaled.shape}")
    print(f"   Features: {', '.join(feature_cols)}")
    print(f"   Anomaly rate: {100 * y.mean():.2f}%")

    return X_scaled, y, feature_cols, scaler


def train_model(X_train, y_train, X_test, y_test):
    """
    Train Isolation Forest model

    Args:
        X_train, y_train: Training data
        X_test, y_test: Test data

    Returns:
        Trained model
    """
    print(f"\n🚀 Training Isolation Forest...")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    print(f"   Hyperparameters:")
    print(f"     - n_estimators: {N_ESTIMATORS}")
    print(f"     - contamination: {CONTAMINATION}")
    print(f"     - max_samples: {MAX_SAMPLES}")

    # Train model (unsupervised, doesn't use y_train)
    model = IsolationForest(
        n_estimators=N_ESTIMATORS,
        contamination=CONTAMINATION,
        max_samples=MAX_SAMPLES,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=1
    )

    model.fit(X_train)

    print(f"✓ Training complete")

    # Evaluate on test set
    print(f"\n📊 Evaluating on test set...")

    # Predict anomalies (-1 = anomaly, 1 = normal)
    y_pred = model.predict(X_test)
    y_pred_binary = (y_pred == -1).astype(int)  # Convert to 0/1

    # Get anomaly scores
    # Negative to make higher = more anomalous
    anomaly_scores = -model.score_samples(X_test)

    # Metrics
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred_binary,
          target_names=['Normal', 'Anomaly']))

    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred_binary)
    print(cm)
    print(f"   [[TN={cm[0, 0]}, FP={cm[0, 1]}],")
    print(f"    [FN={cm[1, 0]}, TP={cm[1, 1]}]]")

    # Feature importance (not directly available, but can use contamination impact)
    print(f"\n✓ Model trained with {N_ESTIMATORS} trees")

    return model, anomaly_scores


def save_model(model, scaler, feature_names):
    """
    Save trained model and scaler

    Args:
        model: Trained Isolation Forest
        scaler: Fitted StandardScaler
        feature_names: List of feature names
    """
    print(f"\n💾 Saving model artifacts...")

    # Save model
    model_path = os.path.join(MODEL_DIR, 'isolation_forest.joblib')
    joblib.dump(model, model_path)
    print(f"✓ Model saved to {model_path}")

    # Save scaler
    scaler_path = os.path.join(MODEL_DIR, 'scaler.joblib')
    joblib.dump(scaler, scaler_path)
    print(f"✓ Scaler saved to {scaler_path}")

    # Save feature names
    metadata = {
        'feature_names': feature_names,
        'n_estimators': N_ESTIMATORS,
        'contamination': CONTAMINATION,
        'max_samples': MAX_SAMPLES,
        'trained_at': datetime.now().isoformat(),
        'model_version': '1.0'
    }

    metadata_path = os.path.join(MODEL_DIR, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Metadata saved to {metadata_path}")


def upload_to_gcs():
    """
    Upload trained model to Google Cloud Storage
    """
    print(f"\n☁️  Uploading model to GCS...")

    try:
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(BUCKET_NAME)

        # Upload model files
        files_to_upload = [
            'isolation_forest.joblib',
            'scaler.joblib',
            'metadata.json'
        ]

        for filename in files_to_upload:
            local_path = os.path.join(MODEL_DIR, filename)
            gcs_path = f"models/isolation-forest/{filename}"

            blob = bucket.blob(gcs_path)
            blob.upload_from_filename(local_path)
            print(f"✓ Uploaded {filename} to gs://{BUCKET_NAME}/{gcs_path}")

        print(f"\n✅ Model uploaded to GCS successfully!")
        print(f"   Bucket: gs://{BUCKET_NAME}/models/isolation-forest/")
        print(f"   Update your .env file:")
        print(f"   GCS_ISOLATION_FOREST_MODEL_PATH=models/isolation-forest/isolation_forest.joblib")
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(BUCKET_NAME)

        # Upload model files
        files_to_upload = [
            'isolation_forest.joblib',
            'scaler.joblib',
            'metadata.json'
        ]

        for filename in files_to_upload:
            local_path = os.path.join(MODEL_DIR, filename)
            gcs_path = f"models/isolation-forest/{filename}"

            blob = bucket.blob(gcs_path)
            blob.upload_from_filename(local_path)
            print(f"✓ Uploaded {filename} to gs://{BUCKET_NAME}/{gcs_path}")

        print(f"\n✅ Model uploaded to GCS successfully!")
        print(f"   Bucket: gs://{BUCKET_NAME}/models/isolation-forest/")
        print(f"   Update your .env file:")
        print(f"   GCS_ISOLATION_FOREST_MODEL_PATH=models/isolation-forest/isolation_forest.joblib")

    except Exception as e:
        print(f"\n❌ Upload failed: {e}")
        print("   Make sure you have:")
        print("   1. GCS bucket created")
        print("   2. Proper IAM permissions (Storage Object Admin)")


def main():
    parser = argparse.ArgumentParser(
        description='Train Isolation Forest for L2 anomaly detection')
    parser.add_argument(
        '--mode',
        choices=['fetch-data', 'train', 'upload', 'full'],
        default='full',
        help='Execution mode'
    )
    parser.add_argument('--days-back', type=int, default=90,
                        help='Days of historical data to fetch')
    parser.add_argument('--use-synthetic', action='store_true',
                        help='Force use of synthetic data')

    args = parser.parse_args()

    print("=" * 60)
    print("Isolation Forest L2 Anomaly Detection - Training Pipeline")
    print("=" * 60)

    setup_directories()

    # Step 1: Fetch/Generate Data
    if args.mode in ['fetch-data', 'full']:
        if args.use_synthetic:
            df = generate_synthetic_data()
        else:
            df = fetch_bigquery_data(args.days_back)

        # Prepare features
        X, y, feature_names, scaler = prepare_features(df)

        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=np.array(y)
        )

        # Save prepared data
        np.save(os.path.join(DATA_DIR, 'X_train.npy'), X_train)
        np.save(os.path.join(DATA_DIR, 'X_test.npy'), X_test)
        np.save(os.path.join(DATA_DIR, 'y_train.npy'), y_train)
        np.save(os.path.join(DATA_DIR, 'y_test.npy'), y_test)
        joblib.dump(scaler, os.path.join(DATA_DIR, 'scaler_temp.joblib'))
        joblib.dump(feature_names, os.path.join(
            DATA_DIR, 'feature_names.joblib'))
        print(f"✓ Saved prepared data to {DATA_DIR}")

        if args.mode == 'fetch-data':
            print("\n✅ Data preparation complete. Run with --mode train to train model.")
            return

    # Step 2: Train Model
    if args.mode in ['train', 'full']:
        # Load prepared data
        X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
        X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
        y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
        y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
        scaler = joblib.load(os.path.join(DATA_DIR, 'scaler_temp.joblib'))
        feature_names = joblib.load(
            os.path.join(DATA_DIR, 'feature_names.joblib'))

        model, anomaly_scores = train_model(X_train, y_train, X_test, y_test)

        # Save model
        save_model(model, scaler, feature_names)

        if args.mode == 'train':
            print("\n✅ Training complete. Run with --mode upload to upload to GCS.")
            return

    # Step 3: Upload to GCS
    if args.mode in ['upload', 'full']:
        upload_to_gcs()
        if args.use_synthetic:
            df = generate_synthetic_data()
        else:
            df = fetch_bigquery_data(args.days_back)

        # Prepare features
        X, y, feature_names, scaler = prepare_features(df)

        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=np.array(y)
        )

        # Save prepared data
        np.save(os.path.join(DATA_DIR, 'X_train.npy'), X_train)
        np.save(os.path.join(DATA_DIR, 'X_test.npy'), X_test)
        np.save(os.path.join(DATA_DIR, 'y_train.npy'), y_train)
        np.save(os.path.join(DATA_DIR, 'y_test.npy'), y_test)
        joblib.dump(scaler, os.path.join(DATA_DIR, 'scaler_temp.joblib'))
        joblib.dump(feature_names, os.path.join(
            DATA_DIR, 'feature_names.joblib'))
        print(f"✓ Saved prepared data to {DATA_DIR}")

        if args.mode == 'fetch-data':
            print("\n✅ Data preparation complete. Run with --mode train to train model.")
            return

    # Step 2: Train Model
    if args.mode in ['train', 'full']:
        # Load prepared data
        X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
        X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
        y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
        y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
        scaler = joblib.load(os.path.join(DATA_DIR, 'scaler_temp.joblib'))
        feature_names = joblib.load(
            os.path.join(DATA_DIR, 'feature_names.joblib'))

        model, anomaly_scores = train_model(X_train, y_train, X_test, y_test)

        # Save model
        save_model(model, scaler, feature_names)

        if args.mode == 'train':
            print("\n✅ Training complete. Run with --mode upload to upload to GCS.")
            return

    # Step 3: Upload to GCS
    if args.mode in ['upload', 'full']:
        upload_to_gcs()

    print("\n" + "=" * 60)
    print("✅ Pipeline complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
