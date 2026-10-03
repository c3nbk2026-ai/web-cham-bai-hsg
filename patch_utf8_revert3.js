const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(/Kh.ng t.m th.y file danh s.ch h.c sinh/g, 'Kh\u00F4ng t\u00ECm th\u1EA5y file danh s\u00E1ch h\u1ECDc sinh');
content = content.replace(/Nh.p t\xEF\xBF\xBDn\.\.\./g, 'Nh\u1EADp t\u00EAn...');

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
