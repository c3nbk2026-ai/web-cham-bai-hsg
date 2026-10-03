const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

// I will use \uXXXX unicode escapes to prevent powershell issues completely
content = content.replace(/placeholder="Nh.*?"/g, 'placeholder="Nh\u1EADp t\u00EAn..."');

fs.writeFileSync('src/app/thi/page.tsx', content, 'utf8');
