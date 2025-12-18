/**
 * DynamoDB 서비스
 * Phase 2: 생각 기록 저장 및 조회
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import type { ThoughtRecord, GetRecordsByDateParams, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';
import { AppError, ErrorCodes } from '../utils/error';

// DynamoDB 클라이언트 초기화
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'thought-recorder-dev';

/**
 * 새 기록 저장
 */
export async function saveRecord(
  userId: string,
  content: string,
  aiResponse?: string
): Promise<ThoughtRecord> {
  const now = new Date();
  const record: ThoughtRecord = {
    userId,
    timestamp: now.toISOString(),
    dateKey: now.toISOString().split('T')[0], // YYYY-MM-DD
    content,
    aiResponse,
    createdAt: now.getTime()
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: record
    }));

    logger.info('Record saved', { userId, timestamp: record.timestamp });
    return record;
  } catch (error) {
    logger.error('Failed to save record', { error, userId });
    throw new AppError('기록 저장 실패', ErrorCodes.DB_ERROR);
  }
}

/**
 * 날짜별 기록 조회 (GSI 사용)
 */
export async function getRecordsByDate(
  params: GetRecordsByDateParams
): Promise<ThoughtRecord[]> {
  const { userId, date } = params;

  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'byDate',
      KeyConditionExpression: 'userId = :userId AND dateKey = :dateKey',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':dateKey': date
      },
      ScanIndexForward: true // 시간순 정렬
    }));

    logger.info('Records fetched by date', { userId, date, count: result.Items?.length || 0 });
    return (result.Items || []) as ThoughtRecord[];
  } catch (error) {
    logger.error('Failed to fetch records by date', { error, userId, date });
    throw new AppError('기록 조회 실패', ErrorCodes.DB_ERROR);
  }
}

/**
 * 오늘 기록 조회
 */
export async function getTodayRecords(userId: string): Promise<ThoughtRecord[]> {
  const today = new Date().toISOString().split('T')[0];
  return getRecordsByDate({ userId, date: today });
}

/**
 * 최근 N개 기록 조회
 */
export async function getRecentRecords(
  userId: string,
  limit: number = 10
): Promise<PaginatedResponse<ThoughtRecord>> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // 최신순
      Limit: limit
    }));

    const items = (result.Items || []) as ThoughtRecord[];

    logger.info('Recent records fetched', { userId, count: items.length });
    return {
      items,
      lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
      hasMore: !!result.LastEvaluatedKey
    };
  } catch (error) {
    logger.error('Failed to fetch recent records', { error, userId });
    throw new AppError('기록 조회 실패', ErrorCodes.DB_ERROR);
  }
}

/**
 * 특정 기록 조회
 */
export async function getRecord(
  userId: string,
  timestamp: string
): Promise<ThoughtRecord | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, timestamp }
    }));

    return (result.Item as ThoughtRecord) || null;
  } catch (error) {
    logger.error('Failed to get record', { error, userId, timestamp });
    throw new AppError('기록 조회 실패', ErrorCodes.DB_ERROR);
  }
}

/**
 * 기록 삭제
 */
export async function deleteRecord(
  userId: string,
  timestamp: string
): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId, timestamp }
    }));

    logger.info('Record deleted', { userId, timestamp });
  } catch (error) {
    logger.error('Failed to delete record', { error, userId, timestamp });
    throw new AppError('기록 삭제 실패', ErrorCodes.DB_ERROR);
  }
}

/**
 * 기간별 기록 조회
 */
export async function getRecordsByRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ThoughtRecord[]> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId AND #ts BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':start': `${startDate}T00:00:00.000Z`,
        ':end': `${endDate}T23:59:59.999Z`
      },
      ScanIndexForward: true
    }));

    return (result.Items || []) as ThoughtRecord[];
  } catch (error) {
    logger.error('Failed to fetch records by range', { error, userId, startDate, endDate });
    throw new AppError('기록 조회 실패', ErrorCodes.DB_ERROR);
  }
}

/**
 * 사용자 기록 수 조회
 */
export async function getRecordCount(userId: string): Promise<number> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Select: 'COUNT'
    }));

    return result.Count || 0;
  } catch (error) {
    logger.error('Failed to get record count', { error, userId });
    return 0;
  }
}
