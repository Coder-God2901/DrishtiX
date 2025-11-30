"""
Autoencoder Training Pipeline for L3 Visual Anomaly Detection
Trains a convolutional autoencoder on crowd scene images

Requirements:
- tensorflow>=2.13.0
- google-cloud-bigquery>=3.11.0
- google-cloud-storage>=2.10.0
- google-cloud-aiplatform>=1.35.0
- opencv-python>=4.8.0
- numpy>=1.24.0
- pandas>=2.0.0
- pillow>=10.0.0

Usage:
    python scripts/train-autoencoder.py --mode fetch-data
    python scripts/train-autoencoder.py --mode train
    python scripts/train-autoencoder.py --mode deploy
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
    from google.cloud import bigquery, storage
    from google.cloud import aiplatform
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False
    warnings.warn(
        "Google Cloud libraries not installed. Using synthetic data mode.")
try:
    import tensorflow as tf
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, UpSampling2D, BatchNormalization, Dropout
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    warnings.warn(
        "TensorFlow not installed. Run: pip install tensorflow>=2.13.0")
try:
    from PIL import Image
    import cv2
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False
    warnings.warn(
        "OpenCV/PIL not installed. Run: pip install opencv-python pillow")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('train-autoencoder.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'your-gcp-project-id')
BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'drishtix-data-storage')
LOCATION = os.getenv('GCP_REGION', 'us-central1')
MODEL_DIR = './models/autoencoder'
DATA_DIR = './data/autoencoder'
IMAGE_DIR = os.path.join(DATA_DIR, 'images')

# Model hyperparameters
IMAGE_SIZE = (128, 128)  # Resize images to 128x128
IMAGE_CHANNELS = 3  # RGB
LATENT_DIM = 64  # Compressed representation size
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001
RECONSTRUCTION_THRESHOLD = 0.05  # MSE threshold for anomaly detection


def setup_directories():
    """Create necessary directories"""
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(IMAGE_DIR, exist_ok=True)
    os.makedirs(os.path.join(IMAGE_DIR, 'normal'), exist_ok=True)
    os.makedirs(os.path.join(IMAGE_DIR, 'anomaly'), exist_ok=True)
    print(f"✓ Directories created: {MODEL_DIR}, {DATA_DIR}, {IMAGE_DIR}")


def fetch_images_from_gcs(days_back=90):
    """
    Fetch crowd scene images from GCS

    Args:
        days_back: Number of days of historical images to fetch

    Returns:
        List of image paths
    """
    print(f"\n📊 Fetching {days_back} days of camera images from GCS...")

    try:
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(BUCKET_NAME)

        # List blobs in camera-frames folder
        blobs = bucket.list_blobs(prefix='camera-frames/')

        image_paths = []
        count = 0

        for blob in blobs:
            if blob.name.endswith(('.jpg', '.jpeg', '.png')):
                # Download to local
                local_path = os.path.join(
                    IMAGE_DIR, 'normal', os.path.basename(blob.name))
                blob.download_to_filename(local_path)
                image_paths.append(local_path)
                count += 1

                if count % 100 == 0:
                    print(f"   Downloaded {count} images...")

        print(f"✓ Fetched {len(image_paths)} images from GCS")
        return image_paths

    except Exception as e:
        print(f"⚠️  GCS fetch failed: {e}")
        print("⚠️  Using synthetic images for training demonstration...")
        return generate_synthetic_images()


def generate_synthetic_images(num_normal=1000, num_anomaly=100):
    """
    Generate synthetic crowd scene images

    This is used when real GCS images are not available.
    Replace with actual camera frames in production.

    Args:
        num_normal: Number of normal crowd images
        num_anomaly: Number of anomalous crowd images

    Returns:
        List of image paths
    """
    print(
        f"\n🔧 Generating {num_normal} normal + {num_anomaly} anomaly synthetic images...")

    image_paths = []

    # Generate normal crowd scenes
    for i in range(num_normal):
        img = np.random.randint(
            0, 256, (IMAGE_SIZE[0], IMAGE_SIZE[1], IMAGE_CHANNELS), dtype=np.uint8)

        # Add crowd-like patterns (circles for people)
        num_people = np.random.randint(10, 50)
        for _ in range(num_people):
            x = np.random.randint(0, IMAGE_SIZE[1])
            y = np.random.randint(0, IMAGE_SIZE[0])
            radius = np.random.randint(3, 8)
            color = (
                np.random.randint(100, 200),
                np.random.randint(100, 200),
                np.random.randint(100, 200)
            )
            cv2.circle(img, (x, y), radius, color, -1)

        # Add Gaussian noise
        noise = np.random.normal(0, 10, img.shape).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        # Save
        path = os.path.join(IMAGE_DIR, 'normal', f'normal_{i:04d}.jpg')
        cv2.imwrite(path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        image_paths.append(path)

        if (i + 1) % 200 == 0:
            print(f"   Generated {i + 1}/{num_normal} normal images...")

    # Generate anomalous crowd scenes
    for i in range(num_anomaly):
        img = np.random.randint(
            0, 256, (IMAGE_SIZE[0], IMAGE_SIZE[1], IMAGE_CHANNELS), dtype=np.uint8)

        # Add unusual patterns for anomalies
        # Pattern 1: Extreme overcrowding (dense circles)
        num_people = np.random.randint(80, 150)
        for _ in range(num_people):
            x = np.random.randint(0, IMAGE_SIZE[1])
            y = np.random.randint(0, IMAGE_SIZE[0])
            radius = np.random.randint(2, 5)
            color = (
                np.random.randint(50, 150),
                np.random.randint(50, 150),
                np.random.randint(50, 150)
            )
            cv2.circle(img, (x, y), radius, color, -1)

        # Pattern 2: Panic movement (motion blur)
        kernel_size = 15
        kernel = np.zeros((kernel_size, kernel_size))
        kernel[int((kernel_size - 1) / 2), :] = np.ones(kernel_size)
        kernel /= kernel_size
        img = cv2.filter2D(img, -1, kernel)

        # Pattern 3: Fire/smoke (red overlay)
        if np.random.rand() > 0.5:
            red_overlay = np.zeros_like(img)
            red_overlay[:, :, 0] = 255
            img = cv2.addWeighted(img, 0.7, red_overlay, 0.3, 0)
            red_overlay = np.zeros_like(img)
            red_overlay[:, :, 0] = 255
            img = cv2.addWeighted(img, 0.7, red_overlay, 0.3, 0)

        # Save
        path = os.path.join(IMAGE_DIR, 'anomaly', f'anomaly_{i:04d}.jpg')
        cv2.imwrite(path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        image_paths.append(path)

    print(f"✓ Generated {num_normal} normal + {num_anomaly} anomaly images")
    print(f"✓ Saved to {IMAGE_DIR}")

    return image_paths


def load_and_preprocess_images(image_paths):
    """
    Load and preprocess images for autoencoder training

    Args:
        image_paths: List of image file paths

    Returns:
        X: Preprocessed image array (samples, height, width, channels)
    """
    print(f"\n🔄 Loading and preprocessing {len(image_paths)} images...")

    images = []

    for i, path in enumerate(image_paths):
        try:
            # Load image
            img = cv2.imread(path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Resize
            img = cv2.resize(img, IMAGE_SIZE)

            # Normalize to [0, 1]
            img = img.astype(np.float32) / 255.0

            images.append(img)

            if (i + 1) % 200 == 0:
                print(f"   Processed {i + 1}/{len(image_paths)} images...")

        except Exception as e:
            print(f"⚠️  Failed to load {path}: {e}")
            continue

    X = np.array(images)

    print(f"✓ Preprocessed images: {X.shape}")
    print(f"   Mean: {X.mean():.4f}, Std: {X.std():.4f}")

    return X


def build_autoencoder(input_shape: Tuple[int, int, int]) -> Model:
    """
    Build convolutional autoencoder architecture

    Args:
        input_shape: (height, width, channels)

    Returns:
        Autoencoder model
    """
    if not TF_AVAILABLE:
        logger.error("TensorFlow not installed. Cannot build model.")
        raise ImportError(
            "TensorFlow required. Install with: pip install tensorflow>=2.13.0")
        logger.error("TensorFlow not installed. Cannot build model.")
        raise ImportError(
            "TensorFlow required. Install with: pip install tensorflow>=2.13.0")

    logger.info(f"\n🏗️  Building Convolutional Autoencoder...")
    logger.info(f"   Input shape: {input_shape}")
    logger.info(f"   Latent dimension: {LATENT_DIM}")

    # Encoder
    input_img = Input(shape=input_shape, name='input')

    # Encoder layers
    x = Conv2D(32, (3, 3), activation='relu', padding='same')(input_img)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2, 2), padding='same')(x)

    x = Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2, 2), padding='same')(x)

    x = Conv2D(128, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2, 2), padding='same')(x)

    x = Conv2D(LATENT_DIM, (3, 3), activation='relu',
               padding='same', name='latent')(x)

    # Decoder layers
    x = Conv2D(128, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = UpSampling2D((2, 2))(x)

    x = Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = UpSampling2D((2, 2))(x)

    x = Conv2D(32, (3, 3), activation='relu', padding='same')(x)
    x = BatchNormalization()(x)
    x = UpSampling2D((2, 2))(x)

    decoded = Conv2D(IMAGE_CHANNELS, (3, 3), activation='sigmoid',
                     padding='same', name='output')(x)

    # Autoencoder model
    autoencoder = Model(input_img, decoded, name='autoencoder')

    autoencoder.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='mse',
        metrics=['mae']
    )

    print("✓ Autoencoder built successfully")
    autoencoder.summary()

    return autoencoder


def train_model(X_train, X_val):
    """
    Train autoencoder model

    Args:
        X_train: Training images
        X_val: Validation images

    Returns:
        Trained model and history
    """
    print(f"\n🚀 Starting training...")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Validation samples: {len(X_val)}")
    print(f"   Batch size: {BATCH_SIZE}, Epochs: {EPOCHS}")

    # Build model
    input_shape = X_train.shape[1:]
    model = build_autoencoder(input_shape)

    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=os.path.join(MODEL_DIR, 'autoencoder_best.h5'),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            verbose=1,
            min_lr=1e-6
        ),
        TensorBoard(
            log_dir=os.path.join(MODEL_DIR, 'logs'),
            histogram_freq=1
        )
    ]

    # Train (autoencoder reconstructs input, so X = y)
    history = model.fit(
        X_train, X_train,
        validation_data=(X_val, X_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1
    )

    # Save final model
    model_path = os.path.join(MODEL_DIR, 'autoencoder_final.h5')
    model.save(model_path)
    print(f"\n✓ Model saved to {model_path}")

    # Calculate reconstruction error threshold
    print(f"\n📊 Calculating reconstruction error threshold...")
    train_reconstructions = model.predict(X_train, batch_size=BATCH_SIZE)
    train_mse = np.mean(
        np.square(X_train - train_reconstructions), axis=(1, 2, 3))

    threshold = np.percentile(train_mse, 95)  # 95th percentile
    print(
        f"✓ Reconstruction error threshold (95th percentile): {threshold:.6f}")

    # Save threshold
    threshold_path = os.path.join(MODEL_DIR, 'threshold.txt')
    with open(threshold_path, 'w') as f:
        f.write(f"{threshold:.6f}\n")
    print(f"✓ Threshold saved to {threshold_path}")

    return model, history, threshold


def evaluate_model(model, X_test, threshold):
    """
    Evaluate autoencoder on test set

    Args:
        model: Trained autoencoder
        X_test: Test images
        threshold: Anomaly detection threshold
    """
    print(f"\n📊 Evaluating on test set...")

    # Reconstruct test images
    X_reconstructed = model.predict(X_test, batch_size=BATCH_SIZE)

    # Calculate reconstruction errors
    mse = np.mean(np.square(X_test - X_reconstructed), axis=(1, 2, 3))

    print(f"   Test MSE - Mean: {mse.mean():.6f}, Std: {mse.std():.6f}")
    print(f"   Test MSE - Min: {mse.min():.6f}, Max: {mse.max():.6f}")
    print(f"   Anomaly threshold: {threshold:.6f}")

    # Detect anomalies
    anomalies = mse > threshold
    anomaly_rate = 100 * anomalies.sum() / len(X_test)

    print(f"   Detected anomalies: {anomalies.sum()} ({anomaly_rate:.1f}%)")

    # Save sample reconstructions
    num_samples = min(10, len(X_test))
    fig_path = os.path.join(MODEL_DIR, 'sample_reconstructions.npz')
    np.savez(
        fig_path,
        originals=X_test[:num_samples],
        reconstructions=X_reconstructed[:num_samples],
        mse=mse[:num_samples]
    )
    print(f"✓ Sample reconstructions saved to {fig_path}")


def deploy_to_vertex_ai():
    """
    Deploy trained autoencoder to Vertex AI endpoint
    """
    print(f"\n☁️  Deploying autoencoder to Vertex AI...")

    try:
        aiplatform.init(project=PROJECT_ID, location=LOCATION)

        # Upload model
        print("   Uploading model to Vertex AI Model Registry...")
        model = aiplatform.Model.upload(
            display_name=f"autoencoder-anomaly-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            artifact_uri=f"gs://{BUCKET_NAME}/models/autoencoder/",
            serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-13:latest",
            description="Convolutional autoencoder for L3 visual anomaly detection",
        )
        print(f"✓ Model uploaded: {model.resource_name}")

        # Create endpoint
        print("   Creating Vertex AI endpoint...")
        endpoint = aiplatform.Endpoint.create(
            display_name=f"autoencoder-endpoint-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            description="Autoencoder visual anomaly detection endpoint"
        )
        print(f"✓ Endpoint created: {endpoint.resource_name}")

        # Deploy model to endpoint
        print("   Deploying model to endpoint...")
        model.deploy(
            endpoint=endpoint,
            deployed_model_display_name="autoencoder-v1",
            machine_type="n1-standard-4",
            min_replica_count=1,
            max_replica_count=3,
        )

        print(f"\n✅ Model deployed successfully!")
        print(f"   Endpoint ID: {endpoint.name}")
        print(f"   Add to .env file:")
        print(f"   VERTEX_AI_AUTOENCODER_ENDPOINT={endpoint.name}")

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        print("   Make sure you have:")
        print("   1. Vertex AI API enabled")
        print("   2. GCS bucket created")
        print("   3. Proper IAM permissions")


def main():
    parser = argparse.ArgumentParser(
        description='Train Autoencoder for L3 visual anomaly detection')
    parser.add_argument(
        '--mode',
        choices=['fetch-data', 'train', 'deploy', 'full'],
        default='full',
        help='Execution mode'
    )
    parser.add_argument('--days-back', type=int, default=90,
                        help='Days of historical images to fetch')
    parser.add_argument('--use-synthetic', action='store_true',
                        help='Force use of synthetic images')

    args = parser.parse_args()

    print("=" * 60)
    print("Autoencoder L3 Visual Anomaly Detection - Training Pipeline")
    print("=" * 60)

    setup_directories()

    # Step 1: Fetch/Generate Data
    if args.mode in ['fetch-data', 'full']:
        if args.use_synthetic:
            image_paths = generate_synthetic_images()
        else:
            image_paths = fetch_images_from_gcs(args.days_back)

        # Load and preprocess
        X = load_and_preprocess_images(image_paths)

        # Train/val/test split
        train_size = int(0.7 * len(X))
        val_size = int(0.15 * len(X))

        X_train = X[:train_size]
        X_val = X[train_size:train_size + val_size]
        X_test = X[train_size + val_size:]

        # Save prepared data
        np.save(os.path.join(DATA_DIR, 'X_train.npy'), X_train)
        np.save(os.path.join(DATA_DIR, 'X_val.npy'), X_val)
        np.save(os.path.join(DATA_DIR, 'X_test.npy'), X_test)
        print(f"✓ Saved prepared data to {DATA_DIR}")

        if args.mode == 'fetch-data':
            print("\n✅ Data preparation complete. Run with --mode train to train model.")
            return

    # Step 2: Train Model
    if args.mode in ['train', 'full']:
        # Load prepared data
        X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
        X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
        X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))

        model, history, threshold = train_model(X_train, X_val)

        # Evaluate
        evaluate_model(model, X_test, threshold)

        if args.mode == 'train':
            print("\n✅ Training complete. Run with --mode deploy to deploy to Vertex AI.")
            return

    # Step 3: Deploy to Vertex AI
    if args.mode in ['deploy', 'full']:
        deploy_to_vertex_ai()
        if args.use_synthetic:
            image_paths = generate_synthetic_images()
        else:
            image_paths = fetch_images_from_gcs(args.days_back)

        # Load and preprocess
        X = load_and_preprocess_images(image_paths)

        # Train/val/test split
        train_size = int(0.7 * len(X))
        val_size = int(0.15 * len(X))

        X_train = X[:train_size]
        X_val = X[train_size:train_size + val_size]
        X_test = X[train_size + val_size:]

        # Save prepared data
        np.save(os.path.join(DATA_DIR, 'X_train.npy'), X_train)
        np.save(os.path.join(DATA_DIR, 'X_val.npy'), X_val)
        np.save(os.path.join(DATA_DIR, 'X_test.npy'), X_test)
        print(f"✓ Saved prepared data to {DATA_DIR}")

        if args.mode == 'fetch-data':
            print("\n✅ Data preparation complete. Run with --mode train to train model.")
            return

    # Step 2: Train Model
    if args.mode in ['train', 'full']:
        # Load prepared data
        X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
        X_val = np.load(os.path.join(DATA_DIR, 'X_val.npy'))
        X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))

        model, history, threshold = train_model(X_train, X_val)

        # Evaluate
        evaluate_model(model, X_test, threshold)

        if args.mode == 'train':
            print("\n✅ Training complete. Run with --mode deploy to deploy to Vertex AI.")
            return

    # Step 3: Deploy to Vertex AI
    if args.mode in ['deploy', 'full']:
        deploy_to_vertex_ai()

    print("\n" + "=" * 60)
    print("✅ Pipeline complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
