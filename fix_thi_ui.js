const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const regex = /<div className="w-full space-y-4">[\s\S]*?\{\!hasDrawn \? \(/;

const newBlock = `<div className="w-full space-y-4">
          <div className="flex gap-4 w-full">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CH?N L?P</label>
              {isStudentLocked ? (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between opacity-70">
                  <span>{className}</span>
                </div>
              ) : (
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={className} onChange={(e) => {
                  const newClass = e.target.value;
                  setClassName(newClass);
                  setHasDrawn(false);
                  if (studentsData[newClass] && studentsData[newClass].length > 0) {
                    setStudentName(studentsData[newClass][0]);
                  } else {
                    setStudentName("");
                  }
                }}>
                  {Object.keys(studentsData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">H?C SINH</label>
              {isStudentLocked ? (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between">
                  <span>{studentName}</span>
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
              ) : (
                <>
                  {className && studentsData[className] && studentsData[className].length > 0 ? (
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                      {studentsData[className].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nh?p tên..." />
                  )}
                </>
              )}
            </div>
          </div>
          {!hasDrawn ? (`;

content = content.replace(regex, newBlock);

fs.writeFileSync('src/app/thi/page.tsx', content, 'utf8');
