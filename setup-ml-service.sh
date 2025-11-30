#!/bin/bash
# Setup ML Service - Replaces Vertex AI with Local Docker

echo "═══════════════════════════════════════════════════════════"
echo "  ML Service Setup - Replacing Vertex AI with Local Docker"
echo "  Cost Savings: \$100/month → \$10/month (90% reduction)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Create models directory
echo "📁 Creating models directory..."
mkdir -p ml-service/models
chmod 777 ml-service/models
echo "✓ Models directory created"

# Step 2: Check Docker
echo ""
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi
echo "✓ Docker found: $(docker --version)"

# Step 3: Build ML service
echo ""
echo "🔨 Building ML service Docker image..."
cd ml-service
docker build -t ml-service:latest .
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi
cd ..
echo "✓ ML service image built successfully"

# Step 4: Start services
echo ""
echo "🚀 Starting ML service..."
docker-compose up -d ml-service
if [ $? -ne 0 ]; then
    echo "❌ Failed to start ML service"
    exit 1
fi
echo "✓ ML service started"

# Step 5: Wait for service to be ready
echo ""
echo "⏳ Waiting for ML service to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health &> /dev/null; then
        echo "✓ ML service is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ ML service health check timeout"
        docker logs ml-service
        exit 1
    fi
    sleep 2
    echo -n "."
done

# Step 6: Display status
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ ML Service Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Service Status:"
docker ps | grep ml-service
echo ""
echo "Health Check:"
curl -s http://localhost:8000/health | python -m json.tool
echo ""
echo "API Endpoints:"
echo "  - http://localhost:8000/api/forecast"
echo "  - http://localhost:8000/api/detect-anomaly"
echo "  - http://localhost:8000/api/predict-risk"
echo "  - http://localhost:8000/health"
echo ""
echo "Next Steps:"
echo "  1. Train models: docker exec ml-service python train_models.py"
echo "  2. Set ML_SERVICE_ENDPOINT=http://ml-service:8000 in backend"
echo "  3. Remove VERTEX_AI_* environment variables"
echo ""
echo "Documentation: ML_SERVICE_README.md"
echo "═══════════════════════════════════════════════════════════"
