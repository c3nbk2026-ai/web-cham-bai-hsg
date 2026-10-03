const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

// I will use \uXXXX unicode escapes to prevent powershell issues completely
content = content.replace(/CH\?N L\?P/g, 'CH\u1ECCN L\u1EDAP');
content = content.replace(/H\?C SINH/g, 'H\u1ECCC SINH');
content = content.replace(/Nh\?p t\xEF\xBF\xBDn\.\.\./g, 'Nh\u1EADp t\u00EAn...');

fs.writeFileSync('src/app/thi/page.tsx', content, 'utf8');
