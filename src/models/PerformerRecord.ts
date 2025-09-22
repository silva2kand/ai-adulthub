import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface PerformerRecordData {
  performerName: string;
  idType: 'passport' | 'drivers_license' | 'state_id' | 'other';
  idNumber: string;
  issueDate: Date;
  expiryDate?: Date;
  dateOfBirth: Date;
  idImageUrl: string;
  signatureUrl: string;
  producerName?: string;
  producerAddress?: string;
  contentIds: string[];
  verificationStatus?: 'verified' | 'pending' | 'rejected';
}

export interface PerformerRecord extends PerformerRecordData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PerformerRecordModel {
  /**
   * Create a new performer record for 2257 compliance
   */
  static async create(performerData: PerformerRecordData, changedBy: string): Promise<PerformerRecord> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert the performer record
      const query = `
        INSERT INTO performer_records (
          performer_name, id_type, id_number, issue_date, expiry_date,
          date_of_birth, id_image_url, signature_url, producer_name,
          producer_address, content_ids, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        performerData.performerName,
        performerData.idType,
        performerData.idNumber,
        performerData.issueDate,
        performerData.expiryDate,
        performerData.dateOfBirth,
        performerData.idImageUrl,
        performerData.signatureUrl,
        performerData.producerName || 'Adult Video Aggregator LLC',
        performerData.producerAddress || '123 Main St, Los Angeles, CA 90210',
        JSON.stringify(performerData.contentIds),
        performerData.verificationStatus || 'pending'
      ];
      
      const result = await client.query(query, values);
      const record = result.rows[0];
      
      // Create audit trail
      await this.createAuditLog(client, record.id, 'created', changedBy, null, record);
      
      await client.query('COMMIT');
      return this.formatRecord(record);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get performer records by content ID for compliance verification
   */
  static async getByContentId(contentId: string): Promise<PerformerRecord[]> {
    const query = `
      SELECT * FROM performer_records 
      WHERE content_ids @> $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [JSON.stringify([contentId])]);
    return result.rows.map(this.formatRecord);
  }

  /**
   * Get all verified performer records
   */
  static async getAllVerified(): Promise<PerformerRecord[]> {
    const query = `
      SELECT * FROM performer_records 
      WHERE verification_status = 'verified'
      ORDER BY performer_name ASC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(this.formatRecord);
  }

  /**
   * Update verification status
   */
  static async updateVerificationStatus(
    recordId: number, 
    status: 'verified' | 'pending' | 'rejected',
    changedBy: string
  ): Promise<PerformerRecord> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get old record for audit
      const oldRecord = await client.query('SELECT * FROM performer_records WHERE id = $1', [recordId]);
      
      // Update the record
      const query = `
        UPDATE performer_records 
        SET verification_status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await client.query(query, [status, recordId]);
      const newRecord = result.rows[0];
      
      // Create audit trail
      await this.createAuditLog(client, recordId, 'updated', changedBy, oldRecord.rows[0], newRecord);
      
      await client.query('COMMIT');
      return this.formatRecord(newRecord);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search performer records
   */
  static async search(searchTerm: string): Promise<PerformerRecord[]> {
    const query = `
      SELECT * FROM performer_records 
      WHERE performer_name ILIKE $1 OR id_number ILIKE $1
      ORDER BY performer_name ASC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows.map(this.formatRecord);
  }

  /**
   * Get audit trail for a specific record
   */
  static async getAuditTrail(recordId: number) {
    const query = `
      SELECT * FROM performer_record_audit 
      WHERE record_id = $1
      ORDER BY changed_at DESC
    `;
    
    const result = await pool.query(query, [recordId]);
    return result.rows;
  }

  /**
   * Create audit log entry
   */
  private static async createAuditLog(
    client: any,
    recordId: number,
    action: string,
    changedBy: string,
    oldData: any,
    newData: any
  ) {
    const query = `
      INSERT INTO performer_record_audit 
      (record_id, action, changed_by, old_data, new_data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    await client.query(query, [
      recordId,
      action,
      changedBy,
      oldData ? JSON.stringify(oldData) : null,
      JSON.stringify(newData)
    ]);
  }

  /**
   * Format database record to TypeScript interface
   */
  private static formatRecord(record: any): PerformerRecord {
    return {
      id: record.id,
      performerName: record.performer_name,
      idType: record.id_type,
      idNumber: record.id_number,
      issueDate: record.issue_date,
      expiryDate: record.expiry_date,
      dateOfBirth: record.date_of_birth,
      idImageUrl: record.id_image_url,
      signatureUrl: record.signature_url,
      producerName: record.producer_name,
      producerAddress: record.producer_address,
      contentIds: JSON.parse(record.content_ids),
      verificationStatus: record.verification_status,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}

export default PerformerRecordModel;