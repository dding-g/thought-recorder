# 생각 기록 친구 (Thought Recorder)

카카오톡으로 일상의 생각을 빠르게 기록하고, AI가 공감하며 정리해주는 서비스

## 핵심 가치

- **Zero Friction**: 별도 앱 설치 없이 카카오톡에서 바로 사용
- **AI Empathy**: 단순 저장이 아닌 공감과 질문을 통한 생각 확장
- **Daily Reflection**: 하루 기록을 자동 요약하여 회고 지원

## 기술 스택

- **Runtime**: Node.js 22.x
- **Language**: TypeScript 5.x
- **Framework**: Serverless Framework 3.x
- **Database**: DynamoDB
- **AI**: Claude API (Anthropic)
- **Infrastructure**: AWS (Lambda, API Gateway, DynamoDB, CloudWatch)

## 설치

```bash
npm install
```

## 개발

```bash
# TypeScript 빌드
npm run build

# 로컬 테스트
npm run local

# 배포 (dev)
npm run deploy

# 배포 (prod)
npm run deploy:prod
```

## 환경 변수

`.env.example`을 참고하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

필수 환경 변수:
- `ANTHROPIC_API_KEY`: Claude API 키

## 프로젝트 구조

```
thought-recorder/
├── src/
│   ├── handlers/       # Lambda 핸들러
│   ├── services/       # 비즈니스 로직
│   ├── types/          # TypeScript 타입 정의
│   ├── utils/          # 유틸리티 함수
│   └── constants/      # 상수 정의
├── tests/
│   ├── unit/           # 단위 테스트
│   ├── integration/    # 통합 테스트
│   └── fixtures/       # 테스트 데이터
├── serverless.yml      # Serverless 설정
├── tsconfig.json       # TypeScript 설정
└── package.json
```

## 명령어

- `도움말` - 사용법 안내
- `오늘 정리해줘` - 하루 기록 요약

## 라이선스

MIT
