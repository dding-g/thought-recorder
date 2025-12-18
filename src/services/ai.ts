/**
 * Claude AI 서비스
 * Phase 3: 공감형 응답 및 요약 생성
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ThoughtRecord } from '../types';
import { logger } from '../utils/logger';
import { AppError, ErrorCodes } from '../utils/error';
import { SYSTEM_PROMPT, SUMMARY_PROMPT } from '../constants/prompts';

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '300', 10);

/**
 * 공감형 응답 생성
 */
export async function generateResponse(
  message: string,
  recentRecords?: ThoughtRecord[]
): Promise<string> {
  try {
    // 최근 대화 맥락 구성
    const contextMessages = buildContextMessages(recentRecords);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        ...contextMessages,
        { role: 'user', content: message }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    logger.info('AI response generated', {
      inputLength: message.length,
      outputLength: responseText.length,
      model: MODEL
    });

    return responseText;
  } catch (error) {
    logger.error('AI generation failed', { error, message });

    // 에러 타입별 처리
    if (error instanceof Anthropic.RateLimitError) {
      throw new AppError('API 요청 한도 초과', ErrorCodes.AI_RATE_LIMIT);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw new AppError('API 연결 실패', ErrorCodes.AI_TIMEOUT);
    }

    throw new AppError('AI 응답 생성 실패', ErrorCodes.AI_ERROR);
  }
}

/**
 * 하루 요약 생성
 */
export async function generateSummary(records: ThoughtRecord[]): Promise<string> {
  if (records.length === 0) {
    return '오늘은 아직 기록이 없네! 뭐든 편하게 말해봐 :)';
  }

  try {
    // 기록들을 시간순으로 정리
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 요약용 컨텍스트 생성
    const recordsText = sortedRecords
      .map((r, i) => {
        const time = new Date(r.timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        return `[${time}] ${r.content}`;
      })
      .join('\n');

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500, // 요약은 좀 더 길게
      system: SUMMARY_PROMPT,
      messages: [
        {
          role: 'user',
          content: `오늘 하루 기록이야. 정리해줘!\n\n${recordsText}`
        }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    const summaryText = textContent?.type === 'text' ? textContent.text : '';

    logger.info('Summary generated', {
      recordCount: records.length,
      outputLength: summaryText.length
    });

    return summaryText;
  } catch (error) {
    logger.error('Summary generation failed', { error, recordCount: records.length });
    throw new AppError('요약 생성 실패', ErrorCodes.AI_ERROR);
  }
}

/**
 * 최근 대화 맥락 메시지 구성
 */
function buildContextMessages(
  recentRecords?: ThoughtRecord[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!recentRecords || recentRecords.length === 0) {
    return [];
  }

  // 최근 5개만 사용 (컨텍스트 길이 제한)
  const recent = recentRecords.slice(-5);

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const record of recent) {
    messages.push({ role: 'user', content: record.content });
    if (record.aiResponse) {
      messages.push({ role: 'assistant', content: record.aiResponse });
    }
  }

  return messages;
}

/**
 * 감정 분석 (향후 확장용)
 */
export async function analyzeEmotion(message: string): Promise<string | null> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `다음 문장의 주요 감정을 한 단어로 답해줘 (기쁨, 슬픔, 분노, 불안, 평온, 설렘, 피곤 중 하나): "${message}"`
        }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent?.type === 'text' ? textContent.text.trim() : null;
  } catch {
    // 감정 분석 실패는 무시
    return null;
  }
}
