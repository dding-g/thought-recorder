/**
 * 타입 re-export
 */

export * from './kakao';
export * from './database';

// Common types
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  lastKey?: Record<string, unknown>;
  hasMore: boolean;
}
