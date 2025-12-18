/**
 * 카카오 오픈빌더 스킬 서버 핸들러
 * 전체 통합 버전 (Phase 1-4)
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { KakaoSkillRequest, KakaoSkillResponse } from '../types/kakao';
import { buildTextResponse, buildErrorResponse, DEFAULT_QUICK_REPLIES } from '../utils/response';
import { logger } from '../utils/logger';
import { logError, getErrorMessage } from '../utils/error';
import { saveRecord, getTodayRecords, getRecentRecords } from '../services/database';
import { generateResponse, generateSummary } from '../services/ai';
import { detectCommand, isGreeting } from '../constants/commands';
import { HELP_MESSAGE, WELCOME_MESSAGE, NO_RECORDS_MESSAGE } from '../constants/prompts';

/**
 * Lambda 핸들러
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();

  try {
    // 1. 요청 파싱
    const body = parseRequest(event);
    if (!body) {
      return createResponse(buildErrorResponse('요청을 이해하지 못했어'));
    }

    // 2. 사용자 정보 추출
    const userId = extractUserId(body);
    const utterance = body.userRequest.utterance.trim();

    logger.info('Received message', { userId, utterance });

    // 3. 메시지 처리
    const response = await processMessage(userId, utterance);

    // 4. 응답 로깅
    const duration = Date.now() - startTime;
    logger.info('Response sent', { userId, duration });

    return createResponse(response);

  } catch (error) {
    logError(error, { event: event.body });
    const errorMessage = getErrorMessage(error);
    return createResponse(buildErrorResponse(errorMessage));
  }
}

/**
 * 요청 파싱
 */
function parseRequest(event: APIGatewayProxyEvent): KakaoSkillRequest | null {
  try {
    if (!event.body) return null;
    return JSON.parse(event.body) as KakaoSkillRequest;
  } catch {
    logger.error('Failed to parse request body');
    return null;
  }
}

/**
 * 사용자 ID 추출
 */
function extractUserId(body: KakaoSkillRequest): string {
  return body.userRequest.user.properties.plusfriendUserKey
      || body.userRequest.user.id;
}

/**
 * 메시지 처리 (통합)
 */
async function processMessage(
  userId: string,
  utterance: string
): Promise<KakaoSkillResponse> {
  // 1. 명령어 감지
  const command = detectCommand(utterance);

  switch (command) {
    case 'help':
      return handleHelp();

    case 'summary':
      return handleSummary(userId);

    default:
      // 2. 인사 체크 (첫 사용자 환영)
      if (isGreeting(utterance)) {
        return handleGreeting(userId, utterance);
      }

      // 3. 일반 대화 처리
      return handleConversation(userId, utterance);
  }
}

/**
 * 도움말 응답
 */
function handleHelp(): KakaoSkillResponse {
  return buildTextResponse(HELP_MESSAGE);
}

/**
 * 인사 처리
 */
async function handleGreeting(
  userId: string,
  utterance: string
): Promise<KakaoSkillResponse> {
  try {
    // 기존 기록 확인
    const { items: records } = await getRecentRecords(userId, 1);

    if (records.length === 0) {
      // 첫 사용자: 환영 메시지
      return buildTextResponse(WELCOME_MESSAGE, DEFAULT_QUICK_REPLIES);
    }

    // 기존 사용자: 일반 대화로 처리
    return handleConversation(userId, utterance);
  } catch {
    // DB 에러 시 기본 환영 메시지
    return buildTextResponse(WELCOME_MESSAGE, DEFAULT_QUICK_REPLIES);
  }
}

/**
 * 일반 대화 처리
 */
async function handleConversation(
  userId: string,
  utterance: string
): Promise<KakaoSkillResponse> {
  try {
    // 1. 최근 대화 맥락 조회
    const { items: recentRecords } = await getRecentRecords(userId, 5);

    // 2. AI 응답 생성
    const aiResponse = await generateResponse(utterance, recentRecords);

    // 3. 기록 저장
    await saveRecord(userId, utterance, aiResponse);

    // 4. 응답 반환
    return buildTextResponse(aiResponse, DEFAULT_QUICK_REPLIES);

  } catch (error) {
    logger.error('Conversation handling failed', { error, userId });

    // AI나 DB 에러 시에도 기록은 시도
    try {
      await saveRecord(userId, utterance);
    } catch {
      // 저장 실패도 무시
    }

    throw error;
  }
}

/**
 * 오늘 정리 (하루 요약)
 */
async function handleSummary(userId: string): Promise<KakaoSkillResponse> {
  try {
    // 1. 오늘 기록 조회
    const todayRecords = await getTodayRecords(userId);

    // 2. 기록 없으면 안내 메시지
    if (todayRecords.length === 0) {
      return buildTextResponse(NO_RECORDS_MESSAGE, DEFAULT_QUICK_REPLIES);
    }

    // 3. AI 요약 생성
    const summary = await generateSummary(todayRecords);

    // 4. 응답 반환
    return buildTextResponse(summary, DEFAULT_QUICK_REPLIES);

  } catch (error) {
    logger.error('Summary generation failed', { error, userId });
    throw error;
  }
}

/**
 * API Gateway 응답 생성
 */
function createResponse(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}
