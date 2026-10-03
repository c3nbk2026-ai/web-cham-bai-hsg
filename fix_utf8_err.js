const fs = require('fs');
['src/app/page.tsx', 'src/app/thi/page.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/L\?I C\?P QUY\?N/g, 'L\u1ED6I C\u1EA4P QUY\u1EC0N');
    content = content.replace(/L\?I: Chua c\?p quy\?n/g, 'L\u1ED6I: Ch\u01B0a c\u1EA5p quy\u1EC1n');
    content = content.replace(/Chua Share/g, 'Ch\u01B0a Share');
    content = content.replace(/Vui l\?ng/g, 'Vui l\u00F2ng');
    content = content.replace(/L\?i t\? Google/g, 'L\u1ED7i t\u1EEB Google');
    fs.writeFileSync(file, content, 'utf8');
});
