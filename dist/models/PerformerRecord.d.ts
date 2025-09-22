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
export declare class PerformerRecordModel {
    /**
     * Create a new performer record for 2257 compliance
     */
    static create(performerData: PerformerRecordData, changedBy: string): Promise<PerformerRecord>;
    /**
     * Get performer records by content ID for compliance verification
     */
    static getByContentId(contentId: string): Promise<PerformerRecord[]>;
    /**
     * Get all verified performer records
     */
    static getAllVerified(): Promise<PerformerRecord[]>;
    /**
     * Update verification status
     */
    static updateVerificationStatus(recordId: number, status: 'verified' | 'pending' | 'rejected', changedBy: string): Promise<PerformerRecord>;
    /**
     * Search performer records
     */
    static search(searchTerm: string): Promise<PerformerRecord[]>;
    /**
     * Get audit trail for a specific record
     */
    static getAuditTrail(recordId: number): Promise<any[]>;
    /**
     * Create audit log entry
     */
    private static createAuditLog;
    /**
     * Format database record to TypeScript interface
     */
    private static formatRecord;
}
export default PerformerRecordModel;
//# sourceMappingURL=PerformerRecord.d.ts.map