# Azure Migration Plan - DrishtiX Platform

## Overview

Comprehensive migration from Google Cloud Platform (GCP) to Microsoft Azure services.

## Current GCP Services Detected

### 1. **Firebase Admin SDK** (`firebase-admin.service.ts`)

- Used for: Authentication, Firestore, Cloud Messaging (FCM)
- Files affected: `firebase-admin.service.ts`, `auth.routes.ts`, `facial-recognition.service.ts`, `gcp-orchestrator.service.ts`

### 2. **Google BigQuery** (`bigquery-analytics.service.ts`)

- Used for: Historical analytics, event metrics, crowd trends
- Files affected: `bigquery-analytics.service.ts`, `bigquery-feature.service.ts`, `weather.service.ts`, `video-analytics.service.ts`

### 3. **Google Earth Engine** (`earth-engine.service.ts`)

- Used for: Satellite imagery, venue mapping, synthetic crowd data
- Files affected: `earth-engine.service.ts`

### 4. **Google Maps Platform**

- Package: `@googlemaps/google-maps-services-js`, `@react-google-maps/api`
- Used for: Mapping, geocoding, places API

### 5. **Google Generative AI (Gemini)**

- Package: `@google/generative-ai`
- Used for: AI/ML features, agent builder

### 6. **Google Cloud Services**

- `@google-cloud/storage` - Cloud Storage
- `@google-cloud/pubsub` - Pub/Sub messaging
- `@google-cloud/speech` - Speech-to-text
- `@google-cloud/logging` - Cloud Logging
- `@google-cloud/monitoring` - Cloud Monitoring
- `@google-cloud/dlp` - Data Loss Prevention
- `@google-cloud/aiplatform` - AI Platform

## Azure Migration Mapping

| GCP Service              | Azure Replacement                      |
| ------------------------ | -------------------------------------- |
| Firebase Authentication  | Microsoft Entra ID (Azure AD B2C)      |
| Firestore                | Azure Cosmos DB (NoSQL)                |
| Firebase Cloud Messaging | Azure Notification Hubs                |
| Firebase Hosting         | Azure Static Web Apps / App Service    |
| Google BigQuery          | Azure Synapse Analytics                |
| Google Earth Engine      | Azure Planetary Computer               |
| Google Maps Platform     | Azure Maps                             |
| Google Gemini AI         | Azure OpenAI Service                   |
| Google Cloud Storage     | Azure Blob Storage                     |
| Google Pub/Sub           | Azure Service Bus / Event Hubs         |
| Google Cloud Speech      | Azure Speech Services                  |
| Google Cloud Logging     | Azure Monitor Logs                     |
| Google Cloud Monitoring  | Azure Monitor                          |
| Google Cloud DLP         | Azure Purview / Information Protection |
| Vertex AI Platform       | Azure Machine Learning                 |

## Migration Phases

### Phase 1: Authentication & Database (CURRENT)

- [ ] Replace Firebase Authentication with Azure AD B2C
- [ ] Migrate Firestore to Azure Cosmos DB
- [ ] Replace FCM with Azure Notification Hubs
- [ ] Update auth routes and middleware

### Phase 2: Analytics & Data Services

- [ ] Replace BigQuery with Azure Synapse Analytics
- [ ] Migrate data pipelines and ETL processes
- [ ] Update analytics queries and dashboards

### Phase 3: Geospatial & Imagery

- [ ] Replace Google Earth Engine with Azure Planetary Computer
- [ ] Migrate satellite imagery processing
- [ ] Update venue mapping features

### Phase 4: Mapping Services

- [ ] Replace Google Maps with Azure Maps
- [ ] Update frontend map components
- [ ] Migrate geocoding and places API

### Phase 5: AI/ML Services

- [ ] Replace Gemini with Azure OpenAI Service
- [ ] Update AI agent builder
- [ ] Migrate ML models to Azure ML

### Phase 6: Infrastructure Services

- [ ] Replace Pub/Sub with Azure Service Bus
- [ ] Replace Cloud Storage with Azure Blob Storage
- [ ] Replace Cloud Speech with Azure Speech Services
- [ ] Replace Cloud Logging/Monitoring with Azure Monitor

### Phase 7: Configuration & Testing

- [ ] Update all environment variables
- [ ] Update deployment configurations
- [ ] Update CI/CD pipelines
- [ ] Comprehensive testing

### Phase 8: Documentation

- [ ] Update all technical documentation
- [ ] Create Azure deployment guides
- [ ] Update API references

## Package Changes Required

### Remove (GCP packages)

```json
"@google-cloud/aiplatform"
"@google-cloud/bigquery"
"@google-cloud/dlp"
"@google-cloud/pubsub"
"@google-cloud/storage"
"@google-cloud/speech"
"@google-cloud/logging"
"@google-cloud/monitoring"
"@google/earthengine"
"@google/generative-ai"
"@googlemaps/google-maps-services-js"
"@react-google-maps/api"
"firebase"
"firebase-admin"
"google-auth-library"
```

### Add (Azure packages)

```json
"@azure/identity"
"@azure/cosmos"
"@azure/storage-blob"
"@azure/service-bus"
"@azure/event-hubs"
"@azure/synapse-analytics"
"@azure/communication-common"
"@azure/notification-hubs"
"@azure/openai"
"@azure/maps-search"
"@azure/maps-render"
"@azure/cognitiveservices-speech-sdk"
"@azure/monitor-query"
"@azure/msal-node"
"@azure/msal-react"
"azure-maps-control"
"azure-maps-react"
```

## Timeline

- Each phase will be completed with incremental commits
- Testing after each major service replacement
- Documentation updated continuously

## Git Commit Strategy

- One commit per major service replacement
- Clear commit messages indicating migration step
- Branch: `azure-migration`

---

**Status**: Phase 1 - Starting Firebase to Azure Migration
**Last Updated**: January 8, 2026
