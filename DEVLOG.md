# 개발 일지 (Development Log)

생각 기록 친구 프로젝트의 개발 과정과 의사결정을 기록합니다.

---

## Phase 1: 환경 세팅 & 기본 구조 ✅

### 완료일: 2024-12-18

### 구현 내용
- Serverless Framework 기반 프로젝트 구조 생성
- TypeScript 설정 (ES2022 타겟)
- 카카오 오픈빌더 타입 정의 (요청/응답)
- 기본 Echo 핸들러 구현
- 유틸리티 함수 (response, error, logger)

### 의사결정 기록

#### 1. Node.js 버전 선택
- **결정**: Node.js 22.x LTS
- **이유**: AWS Lambda가 nodejs22.x 런타임 지원, 최신 ES 기능 활용 가능
- **대안 고려**: Node.js 20.x도 안정적이지만 최신 LTS 선택

#### 2. 번들러 선택
- **결정**: esbuild (serverless-esbuild 플러그인)
- **이유**:
  - 빠른 빌드 속도 (webpack 대비 10-100배)
  - Lambda Cold Start 최적화
  - TypeScript 네이티브 지원
- **대안 고려**: webpack (설정 복잡), rollup (Lambda 최적화 부족)

#### 3. 응답 빌더 패턴
- **결정**: 함수형 빌더 패턴 (`buildTextResponse`, `buildCardResponse`)
- **이유**:
  - 카카오 응답 포맷이 복잡하여 추상화 필요
  - 테스트 용이성
  - 타입 안정성 보장

### 폴더 구조
```
src/
├── handlers/kakao.ts    # Lambda 진입점
├── types/               # 타입 정의
├── utils/               # 유틸리티
└── services/            # (Phase 2에서 추가)
```

---

## Phase 2: DynamoDB 연동 ✅

### 완료일: 2024-12-18

### 목표
- DynamoDB 서비스 레이어 구현
- 생각 기록 CRUD 기능
- 날짜별 조회 기능 (GSI 활용)

### 설계 고려사항

#### 1. 테이블 설계
```
PK: userId (카카오 plusfriendUserKey)
SK: timestamp (ISO8601)
GSI: userId + dateKey (날짜별 조회)
```

- **고민**: timestamp를 SK로 쓸지, UUID를 쓸지
- **결정**: timestamp 사용
- **이유**:
  - 시간순 정렬이 자연스럽게 됨
  - 같은 시간에 여러 메시지는 밀리초로 구분 가능
  - UUID는 추가 인덱스 필요

#### 2. SDK 선택
- **결정**: @aws-sdk/lib-dynamodb (DocumentClient)
- **이유**:
  - 마샬링/언마샬링 자동 처리
  - 타입 추론 개선
  - v3 SDK는 모듈화되어 번들 크기 최적화

### 구현 파일: `src/services/database.ts`

```typescript
// 주요 메서드
saveRecord(userId, content, aiResponse?)  // 생각 기록 저장
getRecordsByDate(params)                  // 날짜별 조회 (GSI)
getTodayRecords(userId)                   // 오늘 기록 조회
getRecentRecords(userId, limit)           // 최근 N개 조회
getRecordsByRange(userId, start, end)     // 기간별 조회
deleteRecord(userId, timestamp)           // 기록 삭제
getRecordCount(userId)                    // 기록 수 조회
```

### 개선점 및 변경사항
- 초기 명세의 `tags`, `emotion` 필드는 선택적 필드로 유지
- `removeUndefinedValues: true` 옵션으로 undefined 필드 자동 제거
- 에러 발생 시 AppError로 래핑하여 일관된 에러 처리

---

## Phase 3: Claude API 연동 ✅

### 완료일: 2024-12-18

### 목표
- Anthropic Claude API 서비스 구현
- 공감형 응답 생성
- 맥락 기반 대화

### 설계 고려사항

#### 1. 프롬프트 설계
- **고민**: 시스템 프롬프트를 어떻게 구성할까?
- **결정**: 친근한 친구 페르소나 + 질문 유도 + 적절한 이모지
- **이유**:
  - 기록 서비스지만 단순 저장이 아닌 대화형 경험 제공
  - 사용자가 더 많이 이야기하도록 유도
  - "AI입니다" 같은 표현 명시적 금지

#### 2. 토큰 제한
- **결정**: 일반 응답 300, 요약 500 토큰
- **이유**:
  - 카카오톡 말풍선 길이 제한 고려
  - 비용 최적화
  - 요약은 더 상세해야 하므로 토큰 증가

#### 3. 모델 선택
- **결정**: claude-sonnet-4-20250514
- **이유**:
  - 한국어 성능 우수
  - 비용 대비 품질 균형
  - 빠른 응답 속도

#### 4. 맥락 관리
- **결정**: 최근 5개 대화만 컨텍스트로 전달
- **이유**:
  - 토큰 비용 절감
  - 오래된 맥락은 관련성 낮음
  - 람다 타임아웃 방지

### 구현 파일: `src/services/ai.ts`

```typescript
// 주요 메서드
generateResponse(message, recentRecords?)  // 공감 응답 생성
generateSummary(records)                   // 하루 요약 생성
analyzeEmotion(message)                    // 감정 분석 (확장용)
```

### 프롬프트 파일: `src/constants/prompts.ts`

```typescript
SYSTEM_PROMPT      // 친구 페르소나 시스템 프롬프트
SUMMARY_PROMPT     // 하루 요약용 프롬프트
WELCOME_MESSAGE    // 첫 사용자 환영 메시지
HELP_MESSAGE       // 도움말 메시지
```

### 에러 처리 전략
- `RateLimitError`: 사용자에게 잠시 후 재시도 안내
- `APIConnectionError`: 타임아웃 에러로 처리
- 기타 에러: 일반 AI 에러 메시지

---

## Phase 4: Daily Summary ✅

### 완료일: 2024-12-18

### 목표
- "오늘 정리해줘" 명령어 완전 구현
- 하루 기록 요약 및 인사이트 제공

### 설계 고려사항

#### 1. 요약 포맷
- **결정**:
  ```
  [오늘 하루 한 줄]
  [주요 기록] - 불릿 포인트
  [오늘의 감정]
  [친구의 한마디]
  ```
- **이유**: 카카오톡 환경에서 읽기 편한 구조화된 형식

#### 2. 기록이 없을 때
- **결정**: 친근한 안내 메시지로 기록 유도
- **메시지**: "오늘은 아직 기록이 없네! 뭐든 편하게 말해봐 :)"

#### 3. 시간 표시
- **결정**: 한국어 시간 형식 (HH:MM)
- **구현**: `toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })`

### 통합 핸들러 흐름

```
사용자 메시지
    ↓
명령어 감지 (detectCommand)
    ├── 'help' → 도움말 반환
    ├── 'summary' → 오늘 기록 조회 → AI 요약 생성
    └── 'none'
          ↓
      인사 감지?
          ├── Yes (첫 사용자) → 환영 메시지
          └── No → 일반 대화 처리
                    ↓
              최근 기록 조회 → AI 응답 생성 → 기록 저장
```

---

## 최종 프로젝트 구조

```
thought-recorder/
├── src/
│   ├── handlers/
│   │   └── kakao.ts           # 메인 Lambda 핸들러
│   ├── services/
│   │   ├── database.ts        # DynamoDB 서비스
│   │   ├── ai.ts              # Claude AI 서비스
│   │   └── index.ts           # 서비스 re-export
│   ├── types/
│   │   ├── kakao.ts           # 카카오 API 타입
│   │   ├── database.ts        # DB 엔티티 타입
│   │   └── index.ts           # 타입 re-export
│   ├── utils/
│   │   ├── response.ts        # 응답 빌더
│   │   ├── error.ts           # 에러 핸들링
│   │   └── logger.ts          # 로깅
│   └── constants/
│       ├── prompts.ts         # AI 프롬프트
│       ├── commands.ts        # 명령어 정의
│       └── index.ts           # 상수 re-export
├── tests/
│   └── fixtures/              # 테스트 데이터
├── serverless.yml             # Serverless 설정
├── tsconfig.json              # TypeScript 설정
├── package.json               # 의존성
├── DEVLOG.md                  # 개발 일지 (이 파일)
└── README.md                  # 프로젝트 설명
```

---

## 기술적 개선 사항

### 1. 에러 핸들링 강화
- AppError 클래스로 에러 타입 구분
- 사용자 친화적 에러 메시지 매핑
- CloudWatch 로깅 구조화 (JSON 형식)

### 2. 타입 안정성
- 모든 서비스 메서드에 명시적 반환 타입
- 카카오 API 타입 완전 정의 (210+ 라인)
- DynamoDB 엔티티 타입 분리

### 3. 성능 최적화
- AWS SDK v3 모듈화 (번들 크기 감소)
- esbuild 외부 모듈 제외 (`@aws-sdk/*`)
- 최근 5개 대화만 컨텍스트로 전달

### 4. 코드 품질
- 단일 책임 원칙: 핸들러 / 서비스 / 유틸 분리
- 의존성 주입 가능한 구조
- 테스트 용이한 순수 함수 위주

---

## 명세 대비 변경사항

| 항목 | 초기 명세 | 실제 구현 | 이유 |
|------|----------|----------|------|
| Node.js | 20.x | 22.x | 최신 LTS, Lambda 지원 확인 |
| 요약 토큰 | 300 | 500 | 요약 품질 향상 |
| 맥락 전달 | 전체 | 최근 5개 | 토큰 절약 |
| 감정 분석 | Phase 2 | 확장용 메서드만 | MVP 범위 조정 |
| 태그 추출 | 자동 | 미구현 | Phase 5로 이관 |

---

## 향후 개선 계획

### 단기 (Phase 5)
- [ ] 단위 테스트 작성 (Jest)
- [ ] 통합 테스트 (로컬 DynamoDB)
- [ ] 배포 파이프라인 구성 (GitHub Actions)

### 중기
- [ ] 감정 분석 자동 태깅
- [ ] 주간/월간 리포트 (EventBridge 스케줄링)
- [ ] 대화 내보내기 기능

### 장기
- [ ] 멀티 플랫폼 (Slack, Discord)
- [ ] 음성 메시지 지원
- [ ] 데이터 내보내기 (PDF, Notion API)

---

## 배포 가이드

### 사전 요구사항
```bash
# AWS CLI 설정
aws configure

# Anthropic API 키 설정
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 배포 명령어
```bash
# 개발 환경
npm run deploy

# 프로덕션 환경
npm run deploy:prod
```

### 카카오 오픈빌더 설정
1. 스킬 서버 URL: `https://{api-gateway-url}/kakao/skill`
2. 폴백 블록에 스킬 연결
3. 테스트 후 배포

---

## 참고 자료

- [카카오 i 오픈빌더 문서](https://i.kakao.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [AWS DynamoDB 모범 사례](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Serverless Framework 문서](https://www.serverless.com/framework/docs)
