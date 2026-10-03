const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

page = page.replace(/Kh\xEF\xBF\xBDng t\xEF\xBF\xBDm th\?y file danh s\xEF\xBF\xBDch h\?c sinh/g, 'Kh\u00F4ng t\u00ECm th\u1EA5y file danh s\u00E1ch h\u1ECDc sinh');
page = page.replace(/Nh\?p t\xEF\xBF\xBDn\.\.\./g, 'Nh\u1EADp t\u00EAn...');

fs.writeFileSync('src/app/page.tsx', page, 'utf8');
