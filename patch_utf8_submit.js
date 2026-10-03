const fs = require('fs');
let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

thi = thi.replace(/L\?i m\?ng ho\?c Server/g, 'L\u1ED7i m\u1EA1ng ho\u1EB7c Server');
thi = thi.replace(/L\?i HTTP/g, 'L\u1ED7i HTTP');
thi = thi.replace(/L\?I LUU I\?M/g, 'L\u1ED6I L\u01AFU \u0110I\u1EC2M');
thi = thi.replace(/Hy copy code n\?p tr\?c ti\?p cho gio vin!/g, 'H\u00E3y copy code n\u1ED9p tr\u1EF1c ti\u1EBFp cho gi\u00E1o vi\u00EAn!');

fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
