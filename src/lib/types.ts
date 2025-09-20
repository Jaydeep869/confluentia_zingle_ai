// Shared types used by client and server

export type SqlRow = Record<string, any>;

export interface SQLResponse {
  question: string;
  sql: string;
  explanation: string;
  executed: boolean;
  result?: SqlRow[];
  rowCount?: number;
  error?: string;
  timestamp?: string;
}

export interface UploadColumnSummary {
  name: string;
  type: string;
  sampleValues: string[];
}

export interface UploadResponse {
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: UploadColumnSummary[];
  analysis: string;
  sampleData: SqlRow[];
  timestamp: string;
  error?: string;
  datasetId?: string;
  tableName?: string;
}

export interface CsvAskResponse {
  datasetId: string;
  tableName: string;
  question: string;
  sql: string;
  python?: string;
  explanation?: string;
  error?: string;
}
