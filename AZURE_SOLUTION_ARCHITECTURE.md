# 👁️ DrishtiX™ Azure AI Solution Architecture

**Enterprise Crowd Safety System**  
**Version**: 3.0.0  
**Last Updated**: January 10, 2026

---

## 🏗️ High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[👁️ Web App<br/>React + TypeScript]
        B[📱 Mobile App<br/>React Native]
        C[🎯 Admin Dashboard<br/>Organizer Portal]
    end

    subgraph "API Gateway & Load Balancing"
        D[⚡ Azure API Management<br/>Rate Limiting + Auth]
        E[🔒 Azure Front Door<br/>CDN + WAF]
    end

    subgraph "Application Layer"
        F[🚀 Node.js Backend<br/>Express + TypeScript]
        G[📡 Socket.IO Server<br/>Real-time Events]
        H[🤖 ML Service<br/>Python + FastAPI]
    end

    subgraph "Azure AI/ML Services"
        I[🧠 Azure Machine Learning<br/>Model Training + Deployment]
        J[👁️ Azure Computer Vision<br/>Crowd Analysis]
        K[📊 Azure Cognitive Services<br/>Queue Prediction]
        L[🌊 Azure Stream Analytics<br/>Real-time Processing]
        M[🔄 Azure ML Pipelines<br/>Automated MLOps]
    end

    subgraph "Data Layer"
        N[(🗄️ PostgreSQL<br/>Prisma ORM)]
        O[(📦 Azure Cosmos DB<br/>NoSQL)]
        P[📁 Azure Blob Storage<br/>Media Files]
        Q[🔐 Azure Key Vault<br/>Secrets]
    end

    subgraph "Messaging & Events"
        R[📨 Azure Service Bus<br/>Message Queue]
        S[📡 Azure Event Grid<br/>Event Routing]
        T[⚡ Azure SignalR<br/>WebSocket Scale]
    end

    subgraph "Monitoring & Analytics"
        U[📊 Azure Monitor<br/>Metrics + Logs]
        V[🔍 Application Insights<br/>APM]
        W[🛡️ Azure Security Center<br/>Threat Detection]
        X[📈 Azure Synapse Analytics<br/>Data Warehouse]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H

    F --> I
    F --> J
    F --> K
    F --> L
    F --> M

    F --> N
    F --> O
    F --> P
    F --> Q

    F --> R
    F --> S
    G --> T

    F --> U
    F --> V
    H --> U
    W -.Monitor.-> F
    W -.Monitor.-> H

    L --> X
```

---

## 🔍 Detailed Component Architecture

### 1. Client Layer

```mermaid
graph LR
    A[👁️ DrishtiX Web App]
    B[📱 DrishtiX Mobile]
    C[🎯 Admin Dashboard]

    A --> D{Authentication}
    B --> D
    C --> D

    D --> E[Azure AD B2C<br/>SSO + MFA]

    A --> F[React 18.3]
    A --> G[Vite 6.3]
    A --> H[TailwindCSS]
    A --> I[shadcn/ui]

    B --> J[React Native]
    B --> K[Expo]

    C --> L[Real-time Dashboard]
    C --> M[AI Insights]
    C --> N[Safety Alerts]
```

### 2. Azure AI/ML Services Integration

```mermaid
graph TB
    subgraph "Azure ML Workspace"
        A[🧠 Azure Machine Learning]
        A1[Model Training]
        A2[Model Registry]
        A3[Model Deployment]
        A4[Endpoint Safety]

        A --> A1
        A --> A2
        A --> A3
        A --> A4
    end

    subgraph "Computer Vision"
        B[👁️ Azure Computer Vision]
        B1[Person Detection]
        B2[Crowd Analysis]
        B3[Density Heatmap]
        B4[Anomaly Detection]

        B --> B1
        B --> B2
        B --> B3
        B --> B4
    end

    subgraph "Cognitive Services"
        C[📊 Azure Cognitive Queue]
        C1[Queue Prediction]
        C2[Wait Time Estimation]
        C3[M/M/c Optimization]

        C --> C1
        C --> C2
        C --> C3
    end

    subgraph "Stream Analytics"
        D[🌊 Azure Stream Analytics]
        D1[Real-time Aggregation]
        D2[Anomaly Detection]
        D3[Queue Metrics]
        D4[Event Processing]

        D --> D1
        D --> D2
        D --> D3
        D --> D4
    end

    subgraph "ML Pipelines"
        E[🔄 Azure ML Pipelines]
        E1[Data Preparation]
        E2[Model Training]
        E3[Validation]
        E4[Deployment]

        E --> E1
        E1 --> E2
        E2 --> E3
        E3 --> E4
    end

    A1 --> F[📊 Training Data]
    A3 --> G[🚀 Production Models]

    B --> H[📹 Video Streams]
    C --> I[📈 Queue Data]
    D --> J[📡 Event Streams]

    G --> K[🔮 Predictions API]
    K --> L[🌐 Client Applications]
```

### 3. ML Model Pipeline

```mermaid
graph LR
    subgraph "Data Ingestion"
        A[📡 Event Streams]
        B[📹 Video Feeds]
        C[📍 GPS Data]
        D[👥 Attendee Data]
    end

    subgraph "Azure Data Processing"
        E[🌊 Azure Stream Analytics]
        F[📦 Azure Data Lake]
        G[🔄 Azure Data Factory]
    end

    subgraph "ML Training"
        H[🧠 Azure ML Compute]
        I[📊 Feature Engineering]
        J[🎯 Model Training]
        K[✅ Model Validation]
    end

    subgraph "Model Deployment"
        L[📦 Model Registry]
        M[🚀 Azure ML Endpoint]
        N[⚖️ Load Balancer]
        O[📈 Auto-scaling]
    end

    subgraph "Inference"
        P[🔮 Real-time Prediction]
        Q[📊 Batch Prediction]
        R[🎯 On-demand Prediction]
    end

    subgraph "Monitoring"
        S[📊 Azure Monitor]
        T[🔍 Model Performance]
        U[⚠️ Alert System]
        V[🔄 Retraining Trigger]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    F --> G
    G --> I

    I --> J
    J --> K
    K --> L

    L --> M
    M --> N
    N --> O

    M --> P
    M --> Q
    M --> R

    P --> S
    Q --> S
    R --> S

    S --> T
    T --> U
    U --> V
    V --> J
```

### 4. Data Flow Architecture

```mermaid
graph TB
    subgraph "Data Sources"
        A[👥 Attendees]
        B[📹 Cameras]
        C[📍 GPS Devices]
        D[🎪 Event Data]
    end

    subgraph "Ingestion Layer"
        E[⚡ Azure Event Hub]
        F[📨 Azure Service Bus]
        G[📡 Azure IoT Hub]
    end

    subgraph "Processing Layer"
        H[🌊 Azure Stream Analytics]
        I[⚙️ Azure Functions]
        J[🔄 Azure Logic Apps]
    end

    subgraph "Storage Layer"
        K[(🗄️ PostgreSQL)]
        L[(📦 Azure Cosmos DB)]
        M[📁 Azure Blob Storage]
        N[📊 Azure Synapse]
    end

    subgraph "AI Processing"
        O[👁️ Azure Computer Vision]
        P[🧠 Azure ML Models]
        Q[📊 Azure Cognitive Services]
    end

    subgraph "Application Layer"
        R[🚀 Backend API]
        S[📡 WebSocket Server]
        T[🎯 Admin Dashboard]
    end

    A --> E
    B --> G
    C --> G
    D --> F

    E --> H
    F --> H
    G --> H

    H --> I
    I --> J

    H --> O
    H --> P
    H --> Q

    J --> K
    J --> L
    J --> M
    H --> N

    K --> R
    L --> R
    M --> R

    R --> S
    R --> T

    O --> R
    P --> R
    Q --> R
```

---

## 🔒 Security Architecture

```mermaid
graph TB
    subgraph "Security Perimeter"
        A[🛡️ Azure Front Door<br/>WAF + DDoS Protection]
        B[🔐 Azure API Management<br/>Rate Limiting + OAuth2]
    end

    subgraph "Authentication & Authorization"
        C[👤 Azure AD B2C<br/>User Authentication]
        D[🔑 Azure AD<br/>Service Authentication]
        E[🎫 JWT Tokens<br/>Session Safety]
    end

    subgraph "Data Protection"
        F[🔐 Azure Key Vault<br/>Secrets Safety]
        G[🔒 Azure Disk Encryption<br/>Data at Rest]
        H[🔐 TLS 1.3<br/>Data in Transit]
    end

    subgraph "Network Security"
        I[🌐 Azure VNet<br/>Network Isolation]
        J[🚫 NSG Rules<br/>Firewall]
        K[🔗 Private Endpoints<br/>Service Connection]
    end

    subgraph "Monitoring & Compliance"
        L[🛡️ Azure Security Center<br/>Threat Detection]
        M[📊 Azure Sentinel<br/>SIEM]
        N[✅ Azure Policy<br/>Compliance]
    end

    A --> B
    B --> C
    B --> D
    C --> E

    B --> F
    F --> G
    F --> H

    I --> J
    J --> K

    L --> M
    M --> N
```

---

## ⚡ Real-time Processing Architecture

```mermaid
graph LR
    subgraph "Event Sources"
        A[📹 Video Streams]
        B[📍 GPS Data]
        C[👥 Attendee Actions]
        D[🚨 Incident Reports]
    end

    subgraph "Azure Stream Analytics"
        E[🌊 Stream Input]
        F[🔄 Transformations]
        G[🎯 Aggregations]
        H[⚠️ Anomaly Detection]
    end

    subgraph "Real-time ML"
        I[🧠 Azure ML Endpoint]
        J[👁️ Computer Vision]
        K[📊 Queue Prediction]
    end

    subgraph "Action Layer"
        L[🚨 Alert Generation]
        M[📨 Notification Service]
        N[📊 Dashboard Update]
        O[📡 WebSocket Broadcast]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    F --> G
    F --> H

    G --> I
    G --> J
    G --> K

    I --> L
    J --> L
    K --> L

    L --> M
    L --> N
    L --> O
```

---

## 📊 ML Model Architecture

### ConvLSTM Crowd Forecasting

```mermaid
graph TB
    A[📥 Input:<br/>Crowd Density Grid<br/>10x10x5 frames]

    B[🔄 Conv3D Layer 1<br/>32 filters, 3x3x3]
    C[🔄 Conv3D Layer 2<br/>64 filters, 3x3x3]
    D[🔄 ConvLSTM Layer<br/>64 units]
    E[🔄 Conv3D Layer 3<br/>32 filters, 3x3x3]
    F[🔄 Conv3D Layer 4<br/>1 filter, 1x1x1]

    G[📤 Output:<br/>Predicted Density Grid<br/>10x10x1 frame]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G

    H[📊 Training Data:<br/>Azure ML Datastore]
    I[🚀 Deployment:<br/>Azure ML Endpoint]

    H -.Trains.-> B
    F -.Deploys.-> I
    I -.Serves.-> G
```

### Autoencoder Anomaly Detection

```mermaid
graph LR
    A[📥 Input:<br/>Crowd Features<br/>64 dimensions]

    subgraph "Encoder"
        B[Dense 32]
        C[Dense 16]
        D[Dense 8<br/>Latent Space]
    end

    subgraph "Decoder"
        E[Dense 16]
        F[Dense 32]
        G[Dense 64]
    end

    H[📤 Reconstructed<br/>Features]
    I[📊 Reconstruction Error]
    J[⚠️ Anomaly Score]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H

    H --> I
    I --> J

    K[🧠 Azure ML Training]
    L[🚀 Azure ML Endpoint]

    K -.Trains.-> B
    G -.Deploys.-> L
    L -.Serves.-> J
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        A[💻 Local Development]
        B[🧪 Unit Tests]
        C[🔍 Linting]
    end

    subgraph "CI/CD Pipeline"
        D[🔄 GitHub Actions]
        E[🏗️ Build Docker Image]
        F[🧪 Integration Tests]
        G[🔐 Security Scan]
    end

    subgraph "Staging Environment"
        H[🎭 Azure Container Apps<br/>Staging]
        I[🧪 E2E Tests]
        J[📊 Performance Tests]
    end

    subgraph "Production Environment"
        K[🚀 Azure Container Apps<br/>Production]
        L[⚖️ Load Balancer]
        M[🌍 Multi-region Deployment]
        N[🔄 Auto-scaling]
    end

    subgraph "Monitoring"
        O[📊 Azure Monitor]
        P[🔍 Application Insights]
        Q[⚠️ Alert System]
    end

    A --> B
    B --> C
    C --> D

    D --> E
    E --> F
    F --> G

    G --> H
    H --> I
    I --> J

    J --> K
    K --> L
    L --> M
    M --> N

    N --> O
    N --> P
    P --> Q
```

---

## 📊 Cost Optimization Architecture

```mermaid
graph TB
    subgraph "Compute Strategy"
        A[☁️ Azure Container Apps<br/>Auto-scale 1-10 instances]
        B[🧠 Azure ML<br/>Spot Instances for Training]
        C[⚡ Azure Functions<br/>Consumption Plan]
    end

    subgraph "Storage Strategy"
        D[🗄️ Azure SQL<br/>General Purpose Tier]
        E[📦 Azure Cosmos DB<br/>Serverless Mode]
        F[📁 Azure Blob Storage<br/>Hot/Cool Tiers]
    end

    subgraph "AI Cost Optimization"
        G[🎯 Local ML Inference<br/>YOLO + ConvLSTM]
        H[☁️ Azure AI Services<br/>Pay-per-use]
        I[📊 Hybrid Approach<br/>70% Cost Reduction]
    end

    A --> J[💰 $150/month]
    B --> K[💰 $100/month]
    C --> L[💰 $50/month]

    D --> M[💰 $40/month]
    E --> N[💰 $30/month]
    F --> O[💰 $20/month]

    G --> P[💰 $0/month]
    H --> Q[💰 $50/month]

    J --> R[📊 Total: $400/month]
    K --> R
    L --> R
    M --> R
    N --> R
    O --> R
    P --> R
    Q --> R

    R --> S[✅ 60% Savings vs Full Cloud]
```

---

## 🔄 Disaster Recovery Architecture

```mermaid
graph TB
    subgraph "Primary Region - East US"
        A[🌐 Primary App Service]
        B[🗄️ Primary Database<br/>PostgreSQL]
        C[📦 Primary Cosmos DB]
    end

    subgraph "Secondary Region - West US"
        D[🌐 Secondary App Service<br/>Read-only]
        E[🗄️ Geo-replica Database]
        F[📦 Multi-region Cosmos DB]
    end

    subgraph "Backup & Recovery"
        G[💾 Azure Backup<br/>Daily Snapshots]
        H[📁 Blob Storage<br/>Geo-redundant]
        I[🔄 Azure Site Recovery]
    end

    subgraph "Traffic Management"
        J[🌍 Azure Traffic Manager<br/>Priority Routing]
        K[⚖️ Health Checks]
        L[🔄 Automatic Failover]
    end

    A --> J
    D --> J

    J --> K
    K --> L

    B --> E
    C --> F

    B --> G
    C --> H

    I -.Monitors.-> A
    I -.Monitors.-> D
    L -.Triggers.-> D
```

---

## 📈 Scalability Architecture

```mermaid
graph LR
    subgraph "Load Distribution"
        A[👥 Users<br/>1K - 100K]
        B[🌍 Azure Front Door<br/>Global CDN]
        C[⚖️ Load Balancer]
    end

    subgraph "Application Tier"
        D[🚀 Container App 1]
        E[🚀 Container App 2]
        F[🚀 Container App 3]
        G[🚀 Container App N<br/>Auto-scale]
    end

    subgraph "Data Tier"
        H[🗄️ PostgreSQL<br/>Read Replicas]
        I[📦 Cosmos DB<br/>Partitioned]
        J[📁 Blob Storage<br/>CDN-backed]
    end

    subgraph "Cache Layer"
        K[⚡ Azure Redis Cache]
        L[🔥 Hot Data]
    end

    A --> B
    B --> C

    C --> D
    C --> E
    C --> F
    C --> G

    D --> K
    E --> K
    F --> K
    G --> K

    K --> H
    K --> I
    K --> J

    D --> H
    E --> H
    F --> I
    G --> J
```

---

## 📞 Contact & Support

**Maintainer**: Jagan Hotta  
**Email**: jaganhotta357@outlook.com  
**Repository**: https://github.com/techySPHINX/DrishtiX

For architecture questions, improvements, or Azure integration support, please reach out via email or GitHub issues.

---

**© 2026 DrishtiX. All Rights Reserved.**

**Last Updated**: January 10, 2026  
**Architecture Version**: 3.0.0
