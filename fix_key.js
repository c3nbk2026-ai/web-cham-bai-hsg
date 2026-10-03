const fs = require('fs');
let content = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');
content = content.replace('key={dIdx}', 'key={idx}');
fs.writeFileSync('src/app/tu-hoc/page.tsx', content, 'utf8');
