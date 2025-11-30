"""
Automated Model Deployment to Vertex AI
Deploys trained ML models to Vertex AI endpoints for inference

This script handles:
- Model upload to Vertex AI Model Registry
- Endpoint creation and configuration
- Model deployment with auto-scaling
- Health checks and validation

Requirements:
- google-cloud-aiplatform>=1.35.0
- google-cloud-storage>=2.10.0

Usage:
    # Deploy ConvLSTM model
    python scripts/deploy-models.py --model convlstm --model-path ./models/convlstm/model.keras

    # Deploy Isolation Forest model
    python scripts/deploy-models.py --model isolation-forest --model-path ./models/isolation-forest/model.joblib

    # Deploy Autoencoder model
    python scripts/deploy-models.py --model autoencoder --model-path ./models/autoencoder/model.keras

    # Deploy all models
    python scripts/deploy-models.py --all
"""

import os
import sys
import argparse
import json
import time
from pathlib import Path
try:
    from google.cloud import aiplatform
    from google.cloud import storage
except ImportError:
    aiplatform = None  # type: ignore
    storage = None  # type: ignore
from datetime import datetime
from typing import Any, Optional

# Configuration
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'your-gcp-project-id')
LOCATION = os.getenv('GCP_REGION', 'us-central1')
BUCKET_NAME = os.getenv('GCS_BUCKET_NAME', 'drishtix-data-storage')
STAGING_BUCKET = f"gs://{BUCKET_NAME}/model-staging"

# Model configurations
MODEL_CONFIGS = {
    'convlstm': {
        'display_name': 'drishtix-convlstm-crowd-prediction',
        'description': 'ConvLSTM model for crowd density forecasting (5-30 min ahead)',
        'serving_container_image_uri': 'us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-13:latest',
        'model_path': './models/convlstm/model.keras',
        'endpoint_name': 'drishtix-crowd-prediction-endpoint',
        'machine_type': 'n1-standard-4',
        'min_replica_count': 1,
        'max_replica_count': 3,
    },
    'isolation-forest': {
        'display_name': 'drishtix-isolation-forest-l2-anomaly',
        'description': 'Isolation Forest for L2 anomaly detection (outlier scoring)',
        'serving_container_image_uri': 'us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-3:latest',
        'model_path': './models/isolation-forest/model.joblib',
        'endpoint_name': 'drishtix-l2-anomaly-endpoint',
        'machine_type': 'n1-standard-2',
        'min_replica_count': 1,
        'max_replica_count': 2,
    },
    'autoencoder': {
        'display_name': 'drishtix-autoencoder-l3-anomaly',
        'description': 'Autoencoder for L3 visual anomaly detection (reconstruction error)',
        'serving_container_image_uri': 'us-docker.pkg.dev/vertex-ai/prediction/tf2-cpu.2-13:latest',
        'model_path': './models/autoencoder/model.keras',
        'endpoint_name': 'drishtix-l3-anomaly-endpoint',
        'machine_type': 'n1-standard-4',
        'min_replica_count': 1,
        'max_replica_count': 3,
    }
}


def upload_model_to_gcs(model_path: str, model_name: str) -> str:
    """
    Upload model artifacts to Google Cloud Storage

    Args:
        model_path: Local path to model file
        model_name: Name of the model (convlstm, isolation-forest, autoencoder)

    Returns:
        GCS URI of uploaded model
    """
    print(f"\n[Upload] Uploading {model_name} model to GCS...")

    if storage is None:
        raise ImportError(
            "google-cloud-storage is not installed. Run: pip install google-cloud-storage")

    storage_client = storage.Client(project=PROJECT_ID)
    bucket = storage_client.bucket(BUCKET_NAME)

    # Create timestamped model directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    gcs_model_dir = f"model-staging/{model_name}/{timestamp}"

    # Upload model file
    model_file = Path(model_path)
    blob_name = f"{gcs_model_dir}/{model_file.name}"
    blob = bucket.blob(blob_name)

    print(f"   Uploading {model_path} to gs://{BUCKET_NAME}/{blob_name}")
    blob.upload_from_filename(model_path)

    # Upload metadata files if they exist
    metadata_files = [
        model_file.parent / 'scaler.joblib',
        model_file.parent / 'metadata.json',
        model_file.parent / 'config.json',
    ]

    for metadata_file in metadata_files:
        if metadata_file.exists():
            metadata_blob_name = f"{gcs_model_dir}/{metadata_file.name}"
            metadata_blob = bucket.blob(metadata_blob_name)
            print(
                f"   Uploading {metadata_file} to gs://{BUCKET_NAME}/{metadata_blob_name}")
            metadata_blob.upload_from_filename(str(metadata_file))

    gcs_uri = f"gs://{BUCKET_NAME}/{gcs_model_dir}"
    print(f"   ✓ Model uploaded to {gcs_uri}")
    return gcs_uri


def register_model_to_vertex(model_name: str, gcs_uri: str) -> Any:
    """
    Register model to Vertex AI Model Registry

    Args:
        model_name: Name of the model (convlstm, isolation-forest, autoencoder)
        gcs_uri: GCS URI of uploaded model artifacts

    Returns:
        Vertex AI Model object
    """
    print(f"\n[Register] Registering {model_name} model to Vertex AI...")

    if aiplatform is None:
        raise ImportError(
            "google-cloud-aiplatform is not installed. Run: pip install google-cloud-aiplatform")

    config = MODEL_CONFIGS[model_name]

    # Initialize Vertex AI
    aiplatform.init(project=PROJECT_ID, location=LOCATION,
                    staging_bucket=STAGING_BUCKET)

    # Upload model to Vertex AI Model Registry
    model = aiplatform.Model.upload(
        display_name=config['display_name'],
        description=config['description'],
        serving_container_image_uri=config['serving_container_image_uri'],
        artifact_uri=gcs_uri,
        sync=True,
    )

    print(f"   ✓ Model registered: {model.resource_name}")
    return model


def create_endpoint(model_name: str) -> Any:
    """
    Create Vertex AI endpoint for model serving

    Args:
        model_name: Name of the model (convlstm, isolation-forest, autoencoder)

    Returns:
        Vertex AI Endpoint object
    """
    print(f"\n[Endpoint] Creating endpoint for {model_name}...")

    if aiplatform is None:
        raise ImportError(
            "google-cloud-aiplatform is not installed. Run: pip install google-cloud-aiplatform")

    config = MODEL_CONFIGS[model_name]

    # Initialize Vertex AI
    aiplatform.init(project=PROJECT_ID, location=LOCATION)

    # Check if endpoint already exists
    endpoints = aiplatform.Endpoint.list(
        filter=f'display_name="{config["endpoint_name"]}"',
        order_by="create_time desc",
    )

    if endpoints:
        endpoint = endpoints[0]
        print(f"   ℹ Using existing endpoint: {endpoint.display_name}")
    else:
        # Create new endpoint
        endpoint = aiplatform.Endpoint.create(
            display_name=config['endpoint_name'],
            description=f"Endpoint for {config['description']}",
            sync=True,
        )
        print(f"   ✓ Endpoint created: {endpoint.resource_name}")

    return endpoint


def deploy_model_to_endpoint(model: Any, endpoint: Any, model_name: str):
    """
    Deploy model to Vertex AI endpoint

    Args:
        model: Vertex AI Model object
        endpoint: Vertex AI Endpoint object
        model_name: Name of the model (convlstm, isolation-forest, autoencoder)
    """
    print(f"\n[Deploy] Deploying {model_name} model to endpoint...")

    config = MODEL_CONFIGS[model_name]

    # Deploy model to endpoint
    model.deploy(
        endpoint=endpoint,
        deployed_model_display_name=config['display_name'],
        machine_type=config['machine_type'],
        min_replica_count=config['min_replica_count'],
        max_replica_count=config['max_replica_count'],
        traffic_percentage=100,
        sync=True,
    )

    print(f"   ✓ Model deployed to endpoint")


def validate_deployment(endpoint: Any, model_name: str):
    """
    Validate model deployment with test predictions

    Args:
        endpoint: Vertex AI Endpoint object
        model_name: Name of the model (convlstm, isolation-forest, autoencoder)
    """
    print(f"\n[Validate] Testing {model_name} endpoint with sample data...")

    # Generate test data based on model type
    test_data = {"instances": []}
    if model_name == 'convlstm':
        # ConvLSTM: (1, 10, 32, 32, 8) - batch, timesteps, height, width, features
        test_data = {
            "instances": [
                {
                    "input": [[[[0.5] * 8 for _ in range(32)] for _ in range(32)] for _ in range(10)]
                }
            ]
        }
    elif model_name == 'isolation-forest':
        # Isolation Forest: (1, 7) - batch, features
        test_data = {
            "instances": [
                # density_norm, delta_t1, delta_t5, time_sin, time_cos, zone_type, is_outdoor
                [0.5, 0.1, 0.05, 0.707, 0.707, 1.0, 0.0]
            ]
        }
    elif model_name == 'autoencoder':
        # Autoencoder: (1, 128, 128, 3) - batch, height, width, channels
        test_data = {
            "instances": [
                {
                    "input": [[[0.5, 0.5, 0.5] for _ in range(128)] for _ in range(128)]
                }
            ]
        }

    try:
        # Make prediction
        response = endpoint.predict(instances=test_data["instances"])
        print(f"   ✓ Endpoint health check passed")
        print(f"   Sample prediction shape: {len(response.predictions)}")
        return True
    except Exception as e:
        print(f"   ✗ Endpoint health check failed: {str(e)}")
        return False


def save_deployment_info(model_name: str, model: Any, endpoint: Any):
    """
    Save deployment information to JSON file

    Args:
        model_name: Name of the model
        model: Vertex AI Model object
        endpoint: Vertex AI Endpoint object
    """
    deployment_info = {
        'model_name': model_name,
        'model_id': model.name,
        'model_display_name': model.display_name,
        'model_resource_name': model.resource_name,
        'endpoint_id': endpoint.name,
        'endpoint_display_name': endpoint.display_name,
        'endpoint_resource_name': endpoint.resource_name,
        'deployed_at': datetime.now().isoformat(),
        'project_id': PROJECT_ID,
        'location': LOCATION,
    }

    output_file = f"./models/{model_name}/deployment_info.json"
    with open(output_file, 'w') as f:
        json.dump(deployment_info, f, indent=2)

    print(f"\n[Info] Deployment info saved to {output_file}")


def deploy_single_model(model_name: str, model_path: Optional[str] = None):
    """
    Deploy a single model to Vertex AI

    Args:
        model_name: Name of the model (convlstm, isolation-forest, autoencoder)
        model_path: Optional custom path to model file
    """
    print(f"\n{'='*60}")
    print(f"Deploying {model_name.upper()} Model to Vertex AI")
    print(f"{'='*60}")

    # Use default path if not provided
    if model_path is None:
        model_path = MODEL_CONFIGS[model_name]['model_path']

    # At this point, model_path is guaranteed to be a string
    assert isinstance(model_path, str), "model_path must be a string"

    # Validate model file exists
    if not Path(model_path).exists():
        print(f"✗ Model file not found: {model_path}")
        print(
            f"  Please train the model first using: python scripts/train-{model_name}.py --mode train")
        return False

    try:
        # Step 1: Upload model to GCS
        gcs_uri = upload_model_to_gcs(model_path, model_name)

        # Step 2: Register model to Vertex AI
        model = register_model_to_vertex(model_name, gcs_uri)

        # Step 3: Create endpoint
        endpoint = create_endpoint(model_name)

        # Step 4: Deploy model to endpoint
        deploy_model_to_endpoint(model, endpoint, model_name)

        # Step 5: Validate deployment
        is_valid = validate_deployment(endpoint, model_name)

        # Step 6: Save deployment info
        save_deployment_info(model_name, model, endpoint)

        if is_valid:
            print(f"\n{'='*60}")
            print(f"✓ {model_name.upper()} Model Deployed Successfully!")
            print(f"{'='*60}")
            print(f"Model ID: {model.name}")
            print(f"Endpoint ID: {endpoint.name}")
            print(
                f"Endpoint URL: https://{LOCATION}-aiplatform.googleapis.com/v1/{endpoint.resource_name}")
            return True
        else:
            print(f"\n✗ Deployment completed but validation failed")
            return False

    except Exception as e:
        print(f"\n✗ Deployment failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def deploy_all_models():
    """Deploy all ML models to Vertex AI"""
    print(f"\n{'='*60}")
    print(f"Deploying ALL Models to Vertex AI")
    print(f"{'='*60}")

    results = {}

    for model_name in MODEL_CONFIGS.keys():
        success = deploy_single_model(model_name)
        results[model_name] = success
        print("\n")
        time.sleep(2)  # Brief pause between deployments

    # Summary
    print(f"\n{'='*60}")
    print(f"Deployment Summary")
    print(f"{'='*60}")
    for model_name, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        print(f"{model_name:20} {status}")

    all_success = all(results.values())
    if all_success:
        print(f"\n✓ All models deployed successfully!")
    else:
        print(f"\n✗ Some deployments failed. Check logs above.")

    return all_success


def main():
    parser = argparse.ArgumentParser(
        description='Deploy ML models to Vertex AI')
    parser.add_argument(
        '--model',
        type=str,
        choices=['convlstm', 'isolation-forest', 'autoencoder'],
        help='Model to deploy (convlstm, isolation-forest, autoencoder)',
    )
    parser.add_argument(
        '--model-path',
        type=str,
        help='Custom path to model file (optional)',
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Deploy all models',
    )

    args = parser.parse_args()

    # Validate environment variables
    if PROJECT_ID == 'your-gcp-project-id':
        print("✗ Error: GOOGLE_CLOUD_PROJECT_ID environment variable not set")
        print("  Please set it in your .env file or export it:")
        print("  export GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id")
        sys.exit(1)

    if BUCKET_NAME == 'drishtix-data-storage':
        print("⚠ Warning: Using default GCS bucket name. Set GCS_BUCKET_NAME in .env if different.")

    # Execute deployment
    if args.all:
        success = deploy_all_models()
    elif args.model:
        success = deploy_single_model(args.model, args.model_path)
    else:
        print("✗ Error: Please specify --model or --all")
        parser.print_help()
        sys.exit(1)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
