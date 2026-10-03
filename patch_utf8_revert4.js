const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

const lines = page.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('placeholder="Nh')) {
        lines[i] = '                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh\u1EADp t\u00EAn..." />';
    }
}
fs.writeFileSync('src/app/page.tsx', lines.join('\n'), 'utf8');
