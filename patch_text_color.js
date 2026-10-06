const fs = require('fs');
let page = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');

const oldClass = 'className="prose prose-sm max-w-none prose-p:leading-relaxed';
const newClass = 'className="prose prose-sm prose-invert text-slate-200 max-w-none prose-p:leading-relaxed prose-p:text-slate-200 prose-li:text-slate-200';

page = page.replace(oldClass, newClass);
fs.writeFileSync('src/app/tu-hoc/page.tsx', page, 'utf8');
