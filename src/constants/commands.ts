/**
 * 명령어 정의
 */

export type CommandType = 'help' | 'summary' | 'none';

/**
 * 명령어 패턴 정의
 */
const COMMAND_PATTERNS: Record<Exclude<CommandType, 'none'>, string[]> = {
  help: ['도움말', '사용법', '도움', 'help', '?', '뭐야', '어떻게'],
  summary: ['오늘 정리해줘', '오늘 정리', '정리해줘', '하루 정리', '오늘 요약', '요약해줘']
};

/**
 * 입력 텍스트에서 명령어 감지
 */
export function detectCommand(text: string): CommandType {
  const normalizedText = text.toLowerCase().trim();

  for (const [command, patterns] of Object.entries(COMMAND_PATTERNS)) {
    if (patterns.some(pattern => normalizedText.includes(pattern))) {
      return command as CommandType;
    }
  }

  return 'none';
}

/**
 * 특수 인사 감지 (첫 사용자용)
 */
export function isGreeting(text: string): boolean {
  const greetings = ['안녕', '하이', 'hi', 'hello', '반가워', '처음이야'];
  const normalizedText = text.toLowerCase().trim();
  return greetings.some(g => normalizedText.includes(g));
}
