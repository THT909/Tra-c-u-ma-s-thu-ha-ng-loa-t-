
export interface ResultRow {
    taxCode: string;
    companyName: string;
    address?: string;
    status: string;
}

export interface StatusInfo {
    message: string;
    progress: number;
    successCount: number;
    errorCount: number;
    total: number;
}
