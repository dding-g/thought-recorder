/**
 * 에러 핸들링 유틸리티
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 코드 정의
export const ErrorCodes = {
  // AI 관련
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_ERROR: 'AI_ERROR',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',

  // DB 관련
  DB_ERROR: 'DB_ERROR',
  DB_NOT_FOUND: 'DB_NOT_FOUND',

  // 요청 관련
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_PARAM: 'MISSING_PARAM',

  // 일반
  UNKNOWN: 'UNKNOWN'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case ErrorCodes.AI_TIMEOUT:
        return '생각하는 데 시간이 좀 걸리네... 다시 말해줄래?';
      case ErrorCodes.AI_RATE_LIMIT:
        return '지금 많이 바빠서... 잠시 후에 다시 말해줘!';
      case ErrorCodes.AI_ERROR:
        return '생각이 잠깐 꼬였어. 다시 말해줄래?';
      case ErrorCodes.DB_ERROR:
        return '기록하다가 문제가 생겼어. 다시 시도해볼게!';
      case ErrorCodes.INVALID_REQUEST:
        return '음... 뭔가 이상해. 다시 한번 말해줄래?';
      default:
        return '앗, 잠시 문제가 생겼어. 다시 말해줄래?';
    }
  }

  return '앗, 잠시 문제가 생겼어. 다시 말해줄래?';
}

/**
 * 에러 로깅
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    }),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context
  };

  console.error('[ERROR]', JSON.stringify(errorInfo));
}
