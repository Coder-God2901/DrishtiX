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

### Phase 1: Authentication & Database ✅ COMPLETED

- [x] Replace Firebase Authentication with Azure AD B2C
- [x] Migrate Firestore to Azure Cosmos DB
- [x] Replace FCM with Azure Notification Hubs
- [x] Created `azure.service.ts` with full implementation

### Phase 2: Analytics & Data Services ✅ COMPLETED

- [x] Replace BigQuery with Azure Synapse Analytics
- [x] Created `azure-synapse-analytics.service.ts`
- [x] Implemented analytics queries and data streaming

### Phase 3: Geospatial & Imagery ✅ COMPLETED

- [x] Replace Google Earth Engine with Azure Planetary Computer
- [x] Created `azure-planetary-computer.service.ts`
- [x] Implemented STAC API integration

### Phase 4: Mapping Services ✅ COMPLETED

- [x] Replace Google Maps with Azure Maps
- [x] Created `azure-maps.service.ts`
- [x] Implemented geocoding, routing, and places search

### Phase 5: AI/ML Services ✅ COMPLETED

- [x] Replace Gemini with Azure OpenAI Service
- [x] Created `azure-openai.service.ts`
- [x] Implemented GPT-4 and GPT-4 Vision

### Phase 6: Infrastructure Services ✅ COMPLETED

- [x] Replace Pub/Sub with Azure Service Bus
- [x] Replace Cloud Storage with Azure Blob Storage
- [x] Created `azure-service-bus.service.ts`
- [x] Created `azure-blob-storage.service.ts`

### Phase 7: Configuration & Testing 🔄 IN PROGRESS

- [x] Created Azure configuration file
- [x] Created `.env.azure.example`
- [ ] Update deployment configurations
- [ ] Update CI/CD pipelines

### Phase 8: Documentation 🔄 IN PROGRESS

- [x] Created migration plan
- [ ] Update all technical documentation
- [ ] Create Azure deployment guides

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

- One commit per major service replacement ✅
- Clear commit messages indicating migration step ✅
- Branch: `version-3` ✅

## Migration Progress Summary

### ✅ Completed Services (6/6 Major Phases)
1. **Azure Service** - Authentication, Cosmos DB, Notification Hubs
2. **Azure Synapse Analytics** - Data warehouse and analytics
3. **Azure Planetary Computer** - Satellite imagery and geospatial
4. **Azure Maps** - Mapping and geocoding services
5. **Azure OpenAI** - AI and vision analysis
6. **Azure Service Bus & Blob Storage** - Messaging and storage

### 📦 New Service Files Created (8 files)
- `server/config/azure.config.ts`
- `server/services/azure.service.ts`
- `server/services/azure-synapse-analytics.service.ts`
- `server/services/azure-planetary-computer.service.ts`
- `server/services/azure-maps.service.ts`
- `server/services/azure-openai.service.ts`
- `server/services/azure-service-bus.service.ts`
- `server/services/azure-blob-storage.service.ts`

### 🔧 Configuration Files
- `.env.azure.example` - Complete Azure environment variables template

### 📝 Git Commits Made (7 commits)
1. Package.json Azure SDK packages
2. Azure configuration and service
3. Azure Synapse Analytics
4. Azure Planetary Computer
5. Azure Maps
6. Azure OpenAI
7. Azure Service Bus and Blob Storage

---

**Status**: ✅ Core Migration Complete - 6/6 Phases Done
**Last Updated**: January 8, 2026
**Next Steps**: Integration testing and documentation updates
