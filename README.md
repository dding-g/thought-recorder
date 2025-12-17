# Thought Recorder 💭

간단한 CLI 도구로 생각과 아이디어를 기록하고 관리하세요.

## 설치

```bash
npm install -g .
```

또는 직접 실행:

```bash
npm start
```

## 사용법

### 새로운 생각 기록하기

```bash
node src/index.js add "오늘 떠오른 좋은 아이디어"
```

### 모든 생각 보기

```bash
node src/index.js list
```

### 특정 키워드로 검색

```bash
node src/index.js search "아이디어"
```

### 생각 삭제하기

```bash
node src/index.js delete <id>
```

## 기능

- ✅ 생각/아이디어 빠르게 기록
- ✅ 기록된 내용 목록 조회
- ✅ 키워드 검색
- ✅ 삭제 기능
- ✅ JSON 파일로 로컬 저장

## 라이선스

MIT
