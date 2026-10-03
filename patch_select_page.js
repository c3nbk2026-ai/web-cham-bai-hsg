const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add states
page = page.replace(
    'const [studentName, setStudentName] = useState("");',
    `const [studentClass, setStudentClass] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentsData, setStudentsData] = useState<Record<string, string[]>>({});`
);
page = page.replace(
    'const [students, setStudents] = useState<string[]>([]);\n',
    ''
);

// 2. Replace the fetch logic
page = page.replace(
    /fetch\("\/data\/students\.json"\)[\s\S]*?\}\);/g,
    `fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          setStudentClass(classes[0]);
          if (data[classes[0]].length > 0) {
            setStudentName(data[classes[0]][0]);
          }
        }
      })
      .catch(() => console.log("L?i t?i danh sách h?c sinh"));`
);

// 3. Replace the UI for Student Name
const oldSelect = /<label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">T[\s\S]*?<\/div>/;
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

page = page.replace(oldSelect, newSelect);
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
