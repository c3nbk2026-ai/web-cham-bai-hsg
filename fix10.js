const fs = require('fs');
let lines = fs.readFileSync('src/app/thi/page.tsx', 'utf8').split('\n');
lines[250] = '                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p tên..." />\r';
fs.writeFileSync('src/app/thi/page.tsx', lines.join('\n'), 'utf8');
