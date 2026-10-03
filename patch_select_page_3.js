const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /<div>\s*<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">[\s\S]*?<\/div>/;

const newSelect = `<div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">L?p</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentClass} onChange={(e) => {
                      const newClass = e.target.value;
                      setStudentClass(newClass);
                      if (studentsData[newClass] && studentsData[newClass].length > 0) {
                        setStudentName(studentsData[newClass][0]);
                      } else {
                        setStudentName("");
                      }
                    }}>
                      {Object.keys(studentsData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">H?c Sinh</label>
                    {studentClass && studentsData[studentClass] && studentsData[studentClass].length > 0 ? (
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                        {studentsData[studentClass].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p tên..." />
                    )}
                  </div>
                </div>`;

page = page.replace(regex, newSelect);
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
