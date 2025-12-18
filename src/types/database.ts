/**
 * DynamoDB 엔티티 타입 정의
 */

export interface ThoughtRecord {
  userId: string;           // Partition Key
  timestamp: string;        // Sort Key (ISO8601)
  dateKey: string;          // GSI Sort Key (YYYY-MM-DD)
  content: string;          // 사용자 입력 메시지
  aiResponse?: string;      // AI 응답
  tags?: string[];          // 자동 추출 태그
  emotion?: string;         // 감정 태그
  createdAt: number;        // Unix timestamp
  updatedAt?: number;       // 수정 시간
}

export interface UserStats {
  userId: string;
  totalRecords: number;
  streakDays: number;
  lastActiveDate: string;
  createdAt: number;
}

// Query Parameters
export interface GetRecordsParams {
  userId: string;
  limit?: number;
  startKey?: Record<string, unknown>;
}

export interface GetRecordsByDateParams {
  userId: string;
  date: string;  // YYYY-MM-DD
}

export interface GetRecordsByRangeParams {
  userId: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}
