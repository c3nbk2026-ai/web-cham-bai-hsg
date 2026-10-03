const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');
content = content.replace(/title: ".*?",/, 'title: "ProCoder VIP - N?n T?ng Thi Ðua HSG",');
content = content.replace(/description: ".*?",/, 'description: "N?n t?ng thi dua HSG môn Tin h?c",');
fs.writeFileSync('src/app/layout.tsx', content, 'utf8');
