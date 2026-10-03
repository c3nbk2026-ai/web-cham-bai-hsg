const fs = require('fs');
['src/app/page.tsx', 'src/app/thi/page.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.split('L\uFFFDp').join('L?p');
    content = content.split('H\uFFFDc Sinh').join('H?c Sinh');
    content = content.split('Nh\uFFFDp t\uFFFDn...').join('Nh?p tên...');
    content = content.split('L\uFFFDi t\uFFFDi danh s\uFFFDch h\uFFFDc sinh').join('L?i t?i danh sách h?c sinh');
    fs.writeFileSync(file, content, 'utf8');
});
