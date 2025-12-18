/**
 * 카카오 스킬 응답 빌더 유틸리티
 */

import type { KakaoSkillResponse, KakaoQuickReply, KakaoButton } from '../types/kakao';

/**
 * 단순 텍스트 응답 생성
 */
export function buildTextResponse(
  text: string,
  quickReplies?: KakaoQuickReply[]
): KakaoSkillResponse {
  return {
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }],
      ...(quickReplies && quickReplies.length > 0 && { quickReplies })
    }
  };
}

/**
 * 기본 카드 응답 생성
 */
export function buildCardResponse(
  title: string,
  description: string,
  options?: {
    thumbnailUrl?: string;
    buttons?: { label: string; url?: string; message?: string }[];
    quickReplies?: KakaoQuickReply[];
  }
): KakaoSkillResponse {
  const buttons: KakaoButton[] | undefined = options?.buttons?.map(btn => ({
    action: btn.url ? 'webLink' : 'message',
    label: btn.label,
    ...(btn.url && { webLinkUrl: btn.url }),
    ...(btn.message && { messageText: btn.message })
  }));

  return {
    version: '2.0',
    template: {
      outputs: [{
        basicCard: {
          title,
          description,
          ...(options?.thumbnailUrl && {
            thumbnail: { imageUrl: options.thumbnailUrl }
          }),
          ...(buttons && buttons.length > 0 && { buttons })
        }
      }],
      ...(options?.quickReplies && options.quickReplies.length > 0 && {
        quickReplies: options.quickReplies
      })
    }
  };
}

/**
 * 에러 응답 생성
 */
export function buildErrorResponse(
  message = '앗, 잠시 문제가 생겼어. 다시 말해줄래?'
): KakaoSkillResponse {
  return buildTextResponse(message);
}

/**
 * 기본 Quick Replies
 */
export const DEFAULT_QUICK_REPLIES: KakaoQuickReply[] = [
  {
    label: '더 이야기하기',
    action: 'message',
    messageText: '더 이야기할래'
  },
  {
    label: '오늘 정리해줘',
    action: 'message',
    messageText: '오늘 정리해줘'
  }
];

/**
 * 도움말 Quick Replies
 */
export const HELP_QUICK_REPLIES: KakaoQuickReply[] = [
  {
    label: '기록 시작하기',
    action: 'message',
    messageText: '안녕!'
  },
  {
    label: '오늘 정리',
    action: 'message',
    messageText: '오늘 정리해줘'
  }
];
