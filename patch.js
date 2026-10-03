const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');
content = content.replace(/export const metadata: Metadata = {[\s\S]*?};/, 
    'export const metadata: Metadata = {\n  title: "ProCoder VIP - Nền Tảng Thi Đua HSG",\n  description: "Nền tảng thi đua HSG môn Tin học",\n};'
);
fs.writeFileSync('src/app/layout.tsx', content, 'utf8');