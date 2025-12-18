/**
 * 카카오 오픈빌더 스킬 서버 핸들러
 * Phase 1: Echo 테스트 버전
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { KakaoSkillRequest } from '../types/kakao';
import { buildTextResponse, buildErrorResponse, DEFAULT_QUICK_REPLIES } from '../utils/response';
import { logger } from '../utils/logger';
import { logError } from '../utils/error';

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

    // 3. 명령어 분기
    const response = await processMessage(userId, utterance);

    // 4. 응답 로깅
    const duration = Date.now() - startTime;
    logger.info('Response sent', { userId, duration });

    return createResponse(response);

  } catch (error) {
    logError(error, { event: event.body });
    return createResponse(buildErrorResponse());
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
 * 메시지 처리 (Phase 1: Echo)
 */
async function processMessage(userId: string, utterance: string) {
  // 명령어 체크
  if (isHelpCommand(utterance)) {
    return handleHelp();
  }

  if (isSummaryCommand(utterance)) {
    return handleSummary(userId);
  }

  // Phase 1: Echo 응답
  return buildTextResponse(
    `받은 메시지: "${utterance}"\n\nEcho 테스트 성공!\n(Phase 2에서 저장 기능 추가 예정)`,
    DEFAULT_QUICK_REPLIES
  );
}

/**
 * 도움말 명령어 체크
 */
function isHelpCommand(text: string): boolean {
  const commands = ['도움말', '사용법', '도움', 'help', '?'];
  return commands.some(cmd => text.toLowerCase().includes(cmd));
}

/**
 * 요약 명령어 체크
 */
function isSummaryCommand(text: string): boolean {
  const commands = ['오늘 정리해줘', '오늘 정리', '정리해줘', '하루 정리', '오늘 요약'];
  return commands.some(cmd => text.includes(cmd));
}

/**
 * 도움말 응답
 */
function handleHelp() {
  const helpText = `생각 기록 친구 사용법

아무 생각이나 편하게 말해줘!
예시:
- "오늘 기분 좋아"
- "회의가 너무 길었어"
- "좋은 아이디어 떠올랐어"

명령어
- "오늘 정리해줘" - 하루 기록 요약
- "도움말" - 이 안내 보기

그냥 친구한테 말하듯이 편하게 해`;

  return buildTextResponse(helpText);
}

/**
 * 요약 응답 (Phase 1: 준비 중)
 */
function handleSummary(_userId: string) {
  return buildTextResponse(
    '오늘 정리 기능\n\n아직 준비 중이야! Phase 2에서 만나',
    DEFAULT_QUICK_REPLIES
  );
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
