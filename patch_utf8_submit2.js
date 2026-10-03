const fs = require('fs');
let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

thi = thi.replace(/alert\("L\?I LUU .*?\\n\\n.*?"\);/g, 'alert("L\u1ED6I L\u01AFU \u0110I\u1EC2M: " + lastError + "\\n\\nH\u00E3y copy code n\u1ED9p tr\u1EF1c ti\u1EBFp cho gi\u00E1o vi\u00EAn!");');

fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
