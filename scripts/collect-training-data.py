# Copyright Â© 2025 DrishtiX. All Rights Reserved.
#
# PROPRIETARY AND CONFIDENTIAL
#
# This software is the proprietary information of DrishtiX.
# Unauthorized copying, distribution, modification, or use of this software,
# via any medium, is strictly prohibited without the express written permission
# of DrishtiX.
#
# This software is provided "as is" without warranty of any kind, express or implied.
#
# For licensing inquiries: licensing@drishtix.com
# License: See LICENSE file in the project root
"""
Training Data Collection Script
Fetches historical data from BigQuery for ML model training

This script collects:
- Crowd density time-series data for ConvLSTM
- Anomaly features for Isolation Forest
- Video frame sequences for Autoencoder

Usage:
    python collect-training-data.py --model [convlstm|isolation-forest|autoencoder] --days 30
"""

import argparse
import os
from datetime import datetime, timedelta
from google.cloud import bigquery
import pandas as pd
import numpy as np
from pathlib import Path

# Initialize BigQuery client
project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'your-project-id')
client = bigquery.Client(project=project_id)


def collect_convlstm_data(days: int = 30, output_dir: str = 'data/convlstm'):
    """
    Collect crowd density time-series data for ConvLSTM training

    Data format: (samples, timesteps, features)
    - timesteps: 60 (past hour in 1-minute intervals)
    - features: density_norm, delta_t1, delta_t5, time_sin, time_cos, zone_type
    """
    print(
        f"[ConvLSTM Data] Collecting {days} days of crowd density data from BigQuery...")

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # BigQuery SQL to fetch time-series data
    query = f"""
    SELECT
        event_id,
        zone_id,
        timestamp,
        density_norm,
        delta_t1,
        delta_t5,
        delta_t15,
        zone_type,
        time_sin,
        time_cos,
        actual_density
    FROM `{project_id}.drishtix_analytics.crowd_features`
    WHERE timestamp BETWEEN TIMESTAMP('{start_date.isoformat()}') AND TIMESTAMP('{end_date.isoformat()}')
        AND density_norm IS NOT NULL
    ORDER BY event_id, zone_id, timestamp ASC
    """

    print(f"Query: {query[:200]}...")

    try:
        # Execute query
        df = client.query(query).to_dataframe()

        if df.empty:
            print("âš ï¸ No data found in BigQuery. Generating synthetic data...")
            df = generate_synthetic_convlstm_data(days)
        else:
            print(f"âœ… Fetched {len(df)} rows from BigQuery")

        # Save raw data
        df.to_csv(f'{output_dir}/raw_data.csv', index=False)
        print(f"ðŸ“ Saved raw data to {output_dir}/raw_data.csv")

        # Process into sequences
        sequences, labels = create_time_sequences(
            df, sequence_length=60, forecast_horizon=5)

        # Save processed data
        np.save(f'{output_dir}/sequences.npy', sequences)
        np.save(f'{output_dir}/labels.npy', labels)

        print(f"âœ… Created {len(sequences)} training sequences")
        print(f"   Sequence shape: {sequences.shape}")
        print(f"   Labels shape: {labels.shape}")
        print(f"ðŸ“ Saved to {output_dir}/sequences.npy and labels.npy")

        return sequences, labels

    except Exception as e:
        print(f"âŒ Error fetching data: {e}")
        print("Generating synthetic data instead...")
        df = generate_synthetic_convlstm_data(days)
        df.to_csv(f'{output_dir}/raw_data.csv', index=False)
        sequences, labels = create_time_sequences(
            df, sequence_length=60, forecast_horizon=5)
        np.save(f'{output_dir}/sequences.npy', sequences)
        np.save(f'{output_dir}/labels.npy', labels)
        return sequences, labels


def collect_isolation_forest_data(days: int = 30, output_dir: str = 'data/isolation-forest'):
    """
    Collect anomaly detection features for Isolation Forest training

    Features: density_norm, delta_t1, delta_t5, zone_type_enc, time_sin, time_cos
    """
    print(
        f"[Isolation Forest Data] Collecting {days} days of anomaly features from BigQuery...")

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    query = f"""
    SELECT
        density_norm,
        delta_t1,
        delta_t5,
        zone_type,
        time_sin,
        time_cos,
        timestamp
    FROM `{project_id}.drishtix_analytics.crowd_features`
    WHERE timestamp BETWEEN TIMESTAMP('{start_date.isoformat()}') AND TIMESTAMP('{end_date.isoformat()}')
        AND density_norm IS NOT NULL
    """

    try:
        df = client.query(query).to_dataframe()

        if df.empty:
            print("âš ï¸ No data found. Generating synthetic data...")
            df = generate_synthetic_isolation_forest_data(days)
        else:
            print(f"âœ… Fetched {len(df)} rows from BigQuery")

        # Encode zone_type
        df['zone_type_enc'] = pd.Categorical(df['zone_type']).codes

        # Save data
        df.to_csv(f'{output_dir}/features.csv', index=False)

        # Extract feature matrix
        feature_cols = ['density_norm', 'delta_t1', 'delta_t5',
                        'zone_type_enc', 'time_sin', 'time_cos']
        X = df[feature_cols].values

        np.save(f'{output_dir}/features.npy', X)

        print(f"âœ… Created {len(X)} feature vectors")
        print(f"   Feature shape: {X.shape}")
        print(f"ðŸ“ Saved to {output_dir}/features.npy")

        return X

    except Exception as e:
        print(f"âŒ Error fetching data: {e}")
        print("Generating synthetic data instead...")
        df = generate_synthetic_isolation_forest_data(days)
        df.to_csv(f'{output_dir}/features.csv', index=False)
        X = df[['density_norm', 'delta_t1', 'delta_t5',
                'zone_type_enc', 'time_sin', 'time_cos']].values
        np.save(f'{output_dir}/features.npy', X)
        return X


def collect_autoencoder_data(days: int = 7, output_dir: str = 'data/autoencoder'):
    """
    Collect video frame data for Autoencoder training

    Note: This would require actual video frames from storage
    For now, we'll create placeholders and document the process
    """
    print(f"[Autoencoder Data] Setting up video frame collection...")

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print("âš ï¸ Video frame collection requires access to GCS bucket with stored frames")
    print("   Expected path: gs://drishtix-data-storage/video-frames/")
    print("   Frame format: event_id/camera_id/timestamp.jpg")

    # Generate sample frames for demonstration
    print("Generating synthetic video frames for testing...")
    frames = generate_synthetic_video_frames(
        num_frames=1000, height=224, width=224)

    np.save(f'{output_dir}/frames.npy', frames)

    print(f"âœ… Created {len(frames)} synthetic frames")
    print(f"   Frame shape: {frames.shape}")
    print(f"ðŸ“ Saved to {output_dir}/frames.npy")

    return frames


# ========== HELPER FUNCTIONS ==========

def create_time_sequences(df, sequence_length=60, forecast_horizon=5):
    """
    Create time-series sequences for ConvLSTM

    Args:
        df: DataFrame with time-series data
        sequence_length: Number of past timesteps (e.g., 60 minutes)
        forecast_horizon: Number of future timesteps to predict (e.g., 5 minutes)

    Returns:
        sequences: (n_samples, sequence_length, n_features)
        labels: (n_samples, forecast_horizon)
    """
    sequences = []
    labels = []

    # Group by event and zone
    for (event_id, zone_id), group in df.groupby(['event_id', 'zone_id']):
        group = group.sort_values('timestamp')

        # Extract features
        feature_cols = ['density_norm', 'delta_t1',
                        'delta_t5', 'time_sin', 'time_cos']
        features = group[feature_cols].values
        targets = group['density_norm'].values

        # Create sequences
        for i in range(len(features) - sequence_length - forecast_horizon + 1):
            seq = features[i:i+sequence_length]
            label = targets[i+sequence_length:i +
                            sequence_length+forecast_horizon]

            sequences.append(seq)
            labels.append(label)

    return np.array(sequences), np.array(labels)


def generate_synthetic_convlstm_data(days: int = 30):
    """Generate synthetic crowd density data for testing"""
    print("ðŸ”„ Generating synthetic ConvLSTM data...")

    timestamps = pd.date_range(
        start=datetime.now() - timedelta(days=days),
        end=datetime.now(),
        freq='1min'
    )

    data = []
    for zone_id in range(1, 6):  # 5 zones
        for ts in timestamps:
            # Simulate daily patterns
            hour = ts.hour
            minute = ts.minute

            # Base density varies by time of day
            base_density = 0.3 + 0.4 * \
                np.sin((hour * 60 + minute) / (24 * 60) * 2 * np.pi)
            noise = np.random.normal(0, 0.1)
            density = np.clip(base_density + noise, 0, 1)

            data.append({
                'event_id': 'synthetic_event_1',
                'zone_id': f'zone_{zone_id}',
                'timestamp': ts,
                'density_norm': density,
                'delta_t1': np.random.normal(0, 0.02),
                'delta_t5': np.random.normal(0, 0.05),
                'delta_t15': np.random.normal(0, 0.1),
                'zone_type': np.random.choice(['ENTRANCE', 'STAGE', 'FOOD', 'EXIT']),
                'time_sin': np.sin(2 * np.pi * (hour * 60 + minute) / (24 * 60)),
                'time_cos': np.cos(2 * np.pi * (hour * 60 + minute) / (24 * 60)),
                'actual_density': density
            })

    df = pd.DataFrame(data)
    print(f"âœ… Generated {len(df)} synthetic rows")
    return df


def generate_synthetic_isolation_forest_data(days: int = 30):
    """Generate synthetic anomaly detection data"""
    print("ðŸ”„ Generating synthetic Isolation Forest data...")

    timestamps = pd.date_range(
        start=datetime.now() - timedelta(days=days),
        end=datetime.now(),
        freq='5min'
    )

    data = []
    for ts in timestamps:
        hour = ts.hour
        minute = ts.minute

        # Normal patterns
        density = np.clip(np.random.normal(0.5, 0.15), 0, 1)

        # 5% anomalies
        if np.random.random() < 0.05:
            density = np.clip(np.random.uniform(0.8, 1.0), 0, 1)

        data.append({
            'density_norm': density,
            'delta_t1': np.random.normal(0, 0.02),
            'delta_t5': np.random.normal(0, 0.05),
            'zone_type': np.random.choice(['ENTRANCE', 'STAGE', 'FOOD', 'EXIT']),
            'time_sin': np.sin(2 * np.pi * (hour * 60 + minute) / (24 * 60)),
            'time_cos': np.cos(2 * np.pi * (hour * 60 + minute) / (24 * 60)),
            'timestamp': ts
        })

    df = pd.DataFrame(data)
    df['zone_type_enc'] = pd.Categorical(df['zone_type']).codes
    print(f"âœ… Generated {len(df)} synthetic rows")
    return df


def generate_synthetic_video_frames(num_frames: int = 1000, height: int = 224, width: int = 224):
    """Generate synthetic video frames (grayscale)"""
    print(f"ðŸ”„ Generating {num_frames} synthetic video frames...")

    frames = []
    for i in range(num_frames):
        # Create frame with random patterns
        frame = np.random.rand(height, width) * 0.3

        # Add some structure (circles representing people)
        num_people = np.random.randint(5, 30)
        for _ in range(num_people):
            x = np.random.randint(0, width)
            y = np.random.randint(0, height)
            size = np.random.randint(5, 15)

            yy, xx = np.ogrid[:height, :width]
            circle = (xx - x)**2 + (yy - y)**2 <= size**2
            frame[circle] = np.random.uniform(0.7, 1.0)

        frames.append(frame)

    return np.array(frames)


# ========== MAIN ==========

def main():
    parser = argparse.ArgumentParser(
        description='Collect training data for ML models')
    parser.add_argument('--model', type=str, required=True,
                        choices=['convlstm', 'isolation-forest',
                                 'autoencoder', 'all'],
                        help='Which model to collect data for')
    parser.add_argument('--days', type=int, default=30,
                        help='Number of days of historical data to collect')
    parser.add_argument('--output-dir', type=str, default='data',
                        help='Output directory for collected data')

    args = parser.parse_args()

    print("=" * 60)
    print("Training Data Collection for EventSphere ML Models")
    print("=" * 60)

    if args.model in ['convlstm', 'all']:
        print("\n[1/3] Collecting ConvLSTM Data...")
        collect_convlstm_data(args.days, f'{args.output_dir}/convlstm')

    if args.model in ['isolation-forest', 'all']:
        print("\n[2/3] Collecting Isolation Forest Data...")
        collect_isolation_forest_data(
            args.days, f'{args.output_dir}/isolation-forest')

    if args.model in ['autoencoder', 'all']:
        print("\n[3/3] Collecting Autoencoder Data...")
        collect_autoencoder_data(args.days, f'{args.output_dir}/autoencoder')

    print("\n" + "=" * 60)
    print("âœ… Data collection complete!")
    print(f"ðŸ“ Data saved to: {args.output_dir}/")
    print("=" * 60)


if __name__ == '__main__':
    main()
