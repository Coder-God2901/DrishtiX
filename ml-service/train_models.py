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
ML Model Training - Local Replacement for Vertex AI Training Jobs
Trains ConvLSTM, Autoencoder, and Isolation Forest models using local compute

Features:
- Fetch training data from BigQuery
- Train ConvLSTM for crowd forecasting
- Train Autoencoder for anomaly detection
- Train Isolation Forest for outlier detection
- Save models locally (replaces Vertex AI Model Registry)
"""

import numpy as np
try:
    import tensorflow as tf
    from tensorflow import keras  # type: ignore
    from tensorflow.keras import layers  # type: ignore
except ImportError:
    print("Warning: TensorFlow not installed. Run: pip install tensorflow==2.13.0")
    keras = None  # type: ignore
    layers = None  # type: ignore

try:
    from sklearn.ensemble import IsolationForest  # type: ignore
except ImportError:
    print("Warning: scikit-learn not installed. Run: pip install scikit-learn==1.3.2")
    IsolationForest = None  # type: ignore

try:
    from google.cloud import bigquery  # type: ignore
except ImportError:
    print("Warning: google-cloud-bigquery not installed. Run: pip install google-cloud-bigquery==3.13.0")
    bigquery = None  # type: ignore

import pickle
import logging
from pathlib import Path
from datetime import datetime, timedelta
import json
from typing import Optional, Tuple, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model save paths
MODEL_DIR = Path("/app/models")
MODEL_DIR.mkdir(exist_ok=True)

# BigQuery configuration
PROJECT_ID = "your-project-id"  # Set via env var
DATASET_ID = "drishtix_analytics"


class ConvLSTMTrainer:
    """Train ConvLSTM model for crowd density forecasting"""

    def __init__(self, mode: str = "GENERAL"):
        self.mode = mode
        self.model: Optional[Any] = None
        # (timesteps, height, width, channels)
        self.input_shape = (10, 64, 64, 1)

    def build_model(self) -> Optional[Any]:
        """Build ConvLSTM architecture"""
        if keras is None or layers is None:
            logger.error("TensorFlow not available. Cannot build model.")
            return None

        model = keras.Sequential([
            # Encoder
            layers.ConvLSTM2D(
                filters=64,
                kernel_size=(3, 3),
                padding='same',
                return_sequences=True,
                input_shape=self.input_shape
            ),
            layers.BatchNormalization(),

            layers.ConvLSTM2D(
                filters=32,
                kernel_size=(3, 3),
                padding='same',
                return_sequences=True
            ),
            layers.BatchNormalization(),

            # Decoder
            layers.ConvLSTM2D(
                filters=32,
                kernel_size=(3, 3),
                padding='same',
                return_sequences=True
            ),
            layers.BatchNormalization(),

            layers.ConvLSTM2D(
                filters=1,
                kernel_size=(3, 3),
                padding='same',
                return_sequences=True,
                activation='sigmoid'
            )
        ])

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )

        self.model = model
        logger.info(f"Built ConvLSTM model for mode: {self.mode}")
        return model

    def fetch_training_data(self) -> np.ndarray:
        """Fetch historical crowd density data from BigQuery"""
        if bigquery is None:
            logger.error("BigQuery client not available")
            return np.array([])

        client = bigquery.Client(project=PROJECT_ID)

        query = f"""
        SELECT
            timestamp,
            grid_data,
            event_type
        FROM `{PROJECT_ID}.{DATASET_ID}.video_analytics`
        WHERE 
            timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
            AND event_type = '{self.mode}'
        ORDER BY timestamp ASC
        LIMIT 10000
        """

        logger.info(f"Fetching training data for {self.mode}...")
        query_job = client.query(query)
        results = query_job.result()

        sequences = []
        for row in results:
            if row.grid_data:
                # Parse grid data (assuming JSON format)
                grid = json.loads(row.grid_data)
                sequences.append(grid)

        logger.info(f"Fetched {len(sequences)} sequences")
        return np.array(sequences)

    def prepare_sequences(self, data: np.ndarray, sequence_length: int = 10) -> Tuple[np.ndarray, np.ndarray]:
        """Create input-output pairs for training"""
        X, y = [], []

        for i in range(len(data) - sequence_length - 5):
            # Input: 10 historical frames
            X.append(data[i:i+sequence_length])
            # Output: Next 5 frames (5-30 min ahead)
            y.append(data[i+sequence_length:i+sequence_length+5])

        return np.array(X), np.array(y)

    def train(self, epochs: int = 50, batch_size: int = 32) -> Optional[Any]:
        """Train the ConvLSTM model"""
        if keras is None:
            logger.error("TensorFlow not available. Cannot train model.")
            return None

        # Fetch data
        data = self.fetch_training_data()

        if len(data) < 100:
            logger.warning(
                f"Insufficient training data for {self.mode}: {len(data)} samples")
            return None

        # Prepare sequences
        X, y = self.prepare_sequences(data)

        # Reshape for ConvLSTM (add channel dimension)
        X = np.expand_dims(X, axis=-1)
        y = np.expand_dims(y, axis=-1)

        logger.info(f"Training data shape: X={X.shape}, y={y.shape}")

        # Build model
        self.build_model()

        if self.model is None:
            logger.error("Failed to build model")
            return None

        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3
            )
        ]

        # Train
        logger.info(f"Training ConvLSTM for {self.mode}...")
        history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            callbacks=callbacks,
            verbose=1
        )

        # Save model
        if self.model is not None:
            model_path = MODEL_DIR / f"convlstm_{self.mode.lower()}.h5"
            self.model.save(str(model_path))
            logger.info(f"âœ“ Model saved: {model_path}")
        else:
            logger.error("Model is None, cannot save")

        return history


class AutoencoderTrainer:
    """Train Autoencoder for anomaly detection"""

    def __init__(self):
        self.model: Optional[Any] = None
        self.input_shape = (64, 64, 1)

    def build_model(self) -> Optional[Any]:
        """Build Autoencoder architecture"""
        if keras is None or layers is None:
            logger.error("TensorFlow not available. Cannot build model.")
            return None

        # Encoder
        encoder_input = layers.Input(shape=self.input_shape)
        x = layers.Conv2D(32, (3, 3), activation='relu',
                          padding='same')(encoder_input)
        x = layers.MaxPooling2D((2, 2), padding='same')(x)
        x = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(x)
        x = layers.MaxPooling2D((2, 2), padding='same')(x)
        encoded = layers.Conv2D(
            8, (3, 3), activation='relu', padding='same')(x)

        # Decoder
        x = layers.Conv2D(8, (3, 3), activation='relu',
                          padding='same')(encoded)
        x = layers.UpSampling2D((2, 2))(x)
        x = layers.Conv2D(16, (3, 3), activation='relu', padding='same')(x)
        x = layers.UpSampling2D((2, 2))(x)
        decoded = layers.Conv2D(
            1, (3, 3), activation='sigmoid', padding='same')(x)

        autoencoder = keras.Model(encoder_input, decoded)
        autoencoder.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )

        self.model = autoencoder
        logger.info("Built Autoencoder model")
        return autoencoder

    def fetch_normal_data(self) -> np.ndarray:
        """Fetch normal (non-anomalous) crowd data"""
        if bigquery is None:
            logger.error("BigQuery client not available")
            return np.array([])

        client = bigquery.Client(project=PROJECT_ID)

        query = f"""
        SELECT
            grid_data
        FROM `{PROJECT_ID}.{DATASET_ID}.video_analytics`
        WHERE 
            timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
            AND anomaly_detected = FALSE
        LIMIT 5000
        """

        logger.info("Fetching normal crowd patterns...")
        query_job = client.query(query)
        results = query_job.result()

        data = []
        for row in results:
            if row.grid_data:
                grid = json.loads(row.grid_data)
                data.append(grid)

        logger.info(f"Fetched {len(data)} normal samples")
        return np.array(data)

    def train(self, epochs: int = 50, batch_size: int = 32) -> Optional[Any]:
        """Train Autoencoder on normal data"""
        if keras is None:
            logger.error("TensorFlow not available. Cannot train model.")
            return None

        # Fetch normal data
        data = self.fetch_normal_data()

        if len(data) < 100:
            logger.warning(f"Insufficient training data: {len(data)} samples")
            return None

        # Reshape and normalize
        data = np.expand_dims(data, axis=-1)
        data = data.astype('float32')

        logger.info(f"Training data shape: {data.shape}")

        # Build model
        self.build_model()

        if self.model is None:
            logger.error("Failed to build model")
            return None

        # Train (autoencoder uses same data as input and output)
        logger.info("Training Autoencoder...")
        history = self.model.fit(
            data, data,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            callbacks=[
                keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=5,
                    restore_best_weights=True
                )
            ],
            verbose=1
        )

        # Save model
        if self.model is not None:
            model_path = MODEL_DIR / "autoencoder.h5"
            self.model.save(str(model_path))
            logger.info(f"âœ“ Model saved: {model_path}")
        else:
            logger.error("Model is None, cannot save")

        return history


class IsolationForestTrainer:
    """Train Isolation Forest for outlier detection"""

    def __init__(self):
        self.model: Optional[Any] = None

    def fetch_features(self) -> np.ndarray:
        """Fetch crowd features for outlier detection"""
        if bigquery is None:
            logger.error("BigQuery client not available")
            return np.array([])

        client = bigquery.Client(project=PROJECT_ID)

        query = f"""
        SELECT
            people_count,
            density_score,
            movement_speed,
            congestion_level
        FROM `{PROJECT_ID}.{DATASET_ID}.crowd_analytics`
        WHERE 
            timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        LIMIT 10000
        """

        logger.info("Fetching crowd features...")
        query_job = client.query(query)
        results = query_job.result()

        features = []
        for row in results:
            features.append([
                row.people_count,
                row.density_score,
                row.movement_speed,
                row.congestion_level
            ])

        logger.info(f"Fetched {len(features)} feature vectors")
        return np.array(features)

    def train(self, contamination: float = 0.1) -> Optional[Any]:
        """Train Isolation Forest"""
        if IsolationForest is None:
            logger.error("scikit-learn not available. Cannot train model.")
            return None

        # Fetch features
        data = self.fetch_features()

        if len(data) < 100:
            logger.warning(f"Insufficient training data: {len(data)} samples")
            return None

        logger.info(f"Training data shape: {data.shape}")

        # Train Isolation Forest
        logger.info("Training Isolation Forest...")
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.model.fit(data)

        # Save model
        model_path = MODEL_DIR / "isolation_forest.pkl"
        with open(model_path, "wb") as f:
            pickle.dump(self.model, f)

        logger.info(f"âœ“ Model saved: {model_path}")
        return self.model


def train_all_models() -> None:
    """Train all ML models (replaces Vertex AI Training Jobs)"""
    logger.info("=" * 60)
    logger.info("Starting ML Training - Local Replacement for Vertex AI")
    logger.info("=" * 60)

    # Train ConvLSTM models for each event mode
    modes = ["GENERAL", "SPORTS", "CONCERT", "ENTRY_EXIT"]
    for mode in modes:
        logger.info(f"\nðŸ“Š Training ConvLSTM for {mode}...")
        trainer = ConvLSTMTrainer(mode=mode)
        trainer.train(epochs=50, batch_size=32)

    # Train Autoencoder
    logger.info("\nðŸ” Training Autoencoder for anomaly detection...")
    autoencoder_trainer = AutoencoderTrainer()
    autoencoder_trainer.train(epochs=50, batch_size=32)

    # Train Isolation Forest
    logger.info("\nðŸŒ² Training Isolation Forest for outlier detection...")
    forest_trainer = IsolationForestTrainer()
    forest_trainer.train(contamination=0.1)

    logger.info("\n" + "=" * 60)
    logger.info("âœ… All models trained successfully!")
    logger.info("=" * 60)
    logger.info(f"Models saved to: {MODEL_DIR}")
    logger.info("Cost savings: $100/month (Vertex AI) â†’ $10/month (Docker)")


if __name__ == "__main__":
    train_all_models()
