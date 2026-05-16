const fs = require('fs');

console.log('Vercel 배포를 위한 빌드를 시작합니다...');

// 환경 변수 맵핑
const content = `window.ENV = {
    GEMINI_API_KEY: '${process.env.GEMINI_API_KEY || ''}',
    SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
    SUPABASE_KEY: '${process.env.SUPABASE_KEY || ''}'
};`;

// public 폴더 생성
if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

// 기존 파일들을 public 폴더로 복사
fs.copyFileSync('index.html', 'public/index.html');
fs.copyFileSync('style.css', 'public/style.css');
fs.copyFileSync('app.js', 'public/app.js');

// env.js 파일 생성
fs.writeFileSync('public/env.js', content);

console.log('빌드가 성공적으로 완료되었습니다! public 폴더가 생성되었습니다.');
