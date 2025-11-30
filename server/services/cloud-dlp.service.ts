/**
 * Cloud DLP (Data Loss Prevention) Service
 * PII scrubbing and privacy compliance
 */

import { DlpServiceClient } from '@google-cloud/dlp';
import { gcpConfig } from '../config/gcp.config';

export interface DLPInspectResult {
  hasPII: boolean;
  findings: PIIFinding[];
  redactedText?: string;
}

export interface PIIFinding {
  infoType: string;
  likelihood: string;
  location: {
    byteStart: number;
    byteEnd: number;
  };
  quote: string;
}

class CloudDLPService {
  private client!: DlpServiceClient;
  private projectPath!: string;

  constructor() {
    if (!gcpConfig.dlp.enabled) {
      console.log('Cloud DLP is disabled');
      return;
    }

    this.client = new DlpServiceClient({
      keyFilename: gcpConfig.credentials,
    });
    this.projectPath = `projects/${gcpConfig.projectId}`;
  }

  /**
   * Inspect text for PII
   */
  async inspectText(text: string): Promise<DLPInspectResult> {
    if (!gcpConfig.dlp.enabled) {
      return { hasPII: false, findings: [] };
    }

    try {
      const [response] = await this.client.inspectContent({
        parent: this.projectPath,
        inspectConfig: {
          infoTypes: [
            { name: 'PHONE_NUMBER' },
            { name: 'EMAIL_ADDRESS' },
            { name: 'CREDIT_CARD_NUMBER' },
            { name: 'PASSPORT' },
            { name: 'NATIONAL_ID_NUMBER' },
            { name: 'PERSON_NAME' },
            { name: 'STREET_ADDRESS' },
            { name: 'DATE_OF_BIRTH' },
            { name: 'AGE' },
            { name: 'GENDER' },
          ],
          minLikelihood: 'POSSIBLE',
          limits: {
            maxFindingsPerRequest: 100,
          },
        },
        item: {
          value: text,
        },
      });

      const findings: PIIFinding[] = (response.result?.findings || []).map(finding => ({
        infoType: finding.infoType?.name || 'UNKNOWN',
        likelihood: finding.likelihood ? String(finding.likelihood) : 'UNKNOWN',
        location: {
          byteStart: Number(finding.location?.byteRange?.start || 0),
          byteEnd: Number(finding.location?.byteRange?.end || 0),
        },
        quote: finding.quote || '',
      }));

      return {
        hasPII: findings.length > 0,
        findings,
      };
    } catch (error) {
      console.error('DLP inspection error:', error);
      return { hasPII: false, findings: [] };
    }
  }

  /**
   * Redact PII from text
   */
  async redactText(text: string, replaceWith: string = '[REDACTED]'): Promise<string> {
    if (!gcpConfig.dlp.enabled) {
      return text;
    }

    try {
      const [response] = await this.client.deidentifyContent({
        parent: this.projectPath,
        deidentifyConfig: {
          infoTypeTransformations: {
            transformations: [
              {
                primitiveTransformation: {
                  replaceWithInfoTypeConfig: {},
                },
              },
            ],
          },
        },
        inspectConfig: {
          infoTypes: [
            { name: 'PHONE_NUMBER' },
            { name: 'EMAIL_ADDRESS' },
            { name: 'CREDIT_CARD_NUMBER' },
            { name: 'PASSPORT' },
            { name: 'NATIONAL_ID_NUMBER' },
            { name: 'PERSON_NAME' },
            { name: 'STREET_ADDRESS' },
          ],
        },
        item: {
          value: text,
        },
      });

      return response.item?.value || text;
    } catch (error) {
      console.error('DLP redaction error:', error);
      return text;
    }
  }

  /**
   * Anonymize crowd data
   */
  async anonymizeCrowdData(data: any): Promise<any> {
    if (!gcpConfig.dlp.enabled) {
      return data;
    }

    const anonymized = { ...data };

    // Remove or hash identifiable fields
    if (anonymized.userIds) {
      delete anonymized.userIds;
    }

    if (anonymized.phoneNumbers) {
      delete anonymized.phoneNumbers;
    }

    if (anonymized.emails) {
      delete anonymized.emails;
    }

    // Keep only aggregated data
    if (anonymized.individualLocations) {
      // Replace with grid-based aggregate
      anonymized.gridLocations = this.aggregateToGrid(anonymized.individualLocations);
      delete anonymized.individualLocations;
    }

    return anonymized;
  }

  /**
   * Aggregate individual locations to grid
   */
  private aggregateToGrid(locations: any[]): any[] {
    const gridSize = 0.001; // Approximately 100m
    const grid: Map<string, number> = new Map();

    for (const loc of locations) {
      const gridKey = `${Math.floor(loc.lat / gridSize)}_${Math.floor(loc.lon / gridSize)}`;
      grid.set(gridKey, (grid.get(gridKey) || 0) + 1);
    }

    return Array.from(grid.entries()).map(([key, count]) => {
      const [latGrid, lonGrid] = key.split('_').map(Number);
      return {
        lat: latGrid * gridSize,
        lon: lonGrid * gridSize,
        count,
      };
    });
  }

  /**
   * Create audit log entry (privacy compliant)
   */
  async createAuditLog(operation: string, data: any): Promise<void> {
    // Remove PII before logging
    const sanitized = await this.anonymizeCrowdData(data);

    console.log('AUDIT:', {
      timestamp: new Date().toISOString(),
      operation,
      data: sanitized,
    });
  }
}

export const cloudDLPService = new CloudDLPService();
export default cloudDLPService;
