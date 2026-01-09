/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
import { BigQuery } from '@google-cloud/bigquery'
import { gcpConfig } from '../config/gcp.config'

export interface FeatureVectorRow {
  event_id: string
  zone_id: string
  timestamp: string
  density_norm: number
  delta_t1: number
  delta_t5: number
  zone_type: string
  time_sin: number
  time_cos: number
}

class BigQueryFeatureService {
  private bq: BigQuery
  private dataset: string
  private table: string

  constructor() {
    this.bq = new BigQuery({ projectId: gcpConfig.projectId, keyFilename: gcpConfig.credentials })
    this.dataset = gcpConfig.bigquery.dataset
    // Allow override via env FEATURE_VECTOR_TABLE else reuse analytics table naming
    this.table = process.env.FEATURE_VECTOR_TABLE || 'event_feature_vectors'
  }

  async insertFeatures(rows: FeatureVectorRow[]) {
    const dataset = this.bq.dataset(this.dataset)
    const table = dataset.table(this.table)
    // Ensure table exists (schema minimal; prefer Terraform for prod)
    try {
      const [exists] = await table.exists()
      if (!exists) {
        await table.create({
          schema: {
            fields: [
              { name: 'event_id', type: 'STRING' },
              { name: 'zone_id', type: 'STRING' },
              { name: 'timestamp', type: 'TIMESTAMP' },
              { name: 'density_norm', type: 'FLOAT' },
              { name: 'delta_t1', type: 'FLOAT' },
              { name: 'delta_t5', type: 'FLOAT' },
              { name: 'zone_type', type: 'STRING' },
              { name: 'time_sin', type: 'FLOAT' },
              { name: 'time_cos', type: 'FLOAT' },
            ],
          },
        })
        console.log(`Created BigQuery table ${this.dataset}.${this.table}`)
      }
    } catch (e) {
      console.warn('BigQuery table ensure error (continuing):', e)
    }

    await table.insert(rows)
    console.log(`Inserted ${rows.length} feature rows into ${this.dataset}.${this.table}`)
  }
}

export const bigQueryFeatureService = new BigQueryFeatureService()
