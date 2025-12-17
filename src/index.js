#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'thoughts.json');

// 데이터 파일 읽기
function loadThoughts() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('데이터 파일을 읽는 중 오류 발생:', error.message);
  }
  return [];
}

// 데이터 파일 저장
function saveThoughts(thoughts) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(thoughts, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터 저장 중 오류 발생:', error.message);
  }
}

// 새로운 생각 추가
function addThought(content) {
  const thoughts = loadThoughts();
  const newThought = {
    id: Date.now(),
    content: content,
    createdAt: new Date().toISOString(),
  };
  thoughts.push(newThought);
  saveThoughts(thoughts);
  console.log('✅ 생각이 기록되었습니다!');
  console.log(`   "${content}"`);
}

// 모든 생각 목록 보기
function listThoughts() {
  const thoughts = loadThoughts();
  if (thoughts.length === 0) {
    console.log('📭 기록된 생각이 없습니다.');
    return;
  }

  console.log('\n💭 기록된 생각들:\n');
  console.log('─'.repeat(50));

  thoughts.forEach((thought, index) => {
    const date = new Date(thought.createdAt).toLocaleString('ko-KR');
    console.log(`[${index + 1}] ID: ${thought.id}`);
    console.log(`    📝 ${thought.content}`);
    console.log(`    🕐 ${date}`);
    console.log('─'.repeat(50));
  });

  console.log(`\n총 ${thoughts.length}개의 생각이 기록되어 있습니다.\n`);
}

// 키워드로 검색
function searchThoughts(keyword) {
  const thoughts = loadThoughts();
  const results = thoughts.filter(t =>
    t.content.toLowerCase().includes(keyword.toLowerCase())
  );

  if (results.length === 0) {
    console.log(`🔍 "${keyword}"에 대한 검색 결과가 없습니다.`);
    return;
  }

  console.log(`\n🔍 "${keyword}" 검색 결과: ${results.length}개\n`);
  console.log('─'.repeat(50));

  results.forEach((thought) => {
    const date = new Date(thought.createdAt).toLocaleString('ko-KR');
    console.log(`ID: ${thought.id}`);
    console.log(`📝 ${thought.content}`);
    console.log(`🕐 ${date}`);
    console.log('─'.repeat(50));
  });
}

// 생각 삭제
function deleteThought(id) {
  const thoughts = loadThoughts();
  const index = thoughts.findIndex(t => t.id === parseInt(id));

  if (index === -1) {
    console.log(`❌ ID ${id}에 해당하는 생각을 찾을 수 없습니다.`);
    return;
  }

  const deleted = thoughts.splice(index, 1)[0];
  saveThoughts(thoughts);
  console.log('🗑️  삭제되었습니다:');
  console.log(`   "${deleted.content}"`);
}

// 도움말 표시
function showHelp() {
  console.log(`
💭 Thought Recorder - 생각 기록 도구

사용법:
  node src/index.js <명령어> [옵션]

명령어:
  add <내용>      새로운 생각을 기록합니다
  list            모든 생각을 보여줍니다
  search <키워드>  키워드로 검색합니다
  delete <id>     특정 생각을 삭제합니다
  help            도움말을 표시합니다

예시:
  node src/index.js add "오늘 좋은 아이디어가 떠올랐다"
  node src/index.js list
  node src/index.js search "아이디어"
  node src/index.js delete 1234567890
`);
}

// 메인 실행
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args.slice(1).join(' ');

  switch (command) {
    case 'add':
      if (!param) {
        console.log('❌ 기록할 내용을 입력해주세요.');
        console.log('   예: node src/index.js add "나의 생각"');
      } else {
        addThought(param);
      }
      break;
    case 'list':
      listThoughts();
      break;
    case 'search':
      if (!param) {
        console.log('❌ 검색할 키워드를 입력해주세요.');
      } else {
        searchThoughts(param);
      }
      break;
    case 'delete':
      if (!param) {
        console.log('❌ 삭제할 생각의 ID를 입력해주세요.');
      } else {
        deleteThought(param);
      }
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

main();
