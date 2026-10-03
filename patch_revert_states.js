const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const s1 = 'const [studentClass, setStudentClass] = useState("");';
const s2 = 'const [studentsData, setStudentsData] = useState<Record<string, string[]>>({});';
content = content.replace(s1, '');
content = content.replace(s2, 'const [students, setStudents] = useState<string[]>([]);');

const f1 = /fetch\("\/api\/students\?t="\s*\+\s*Date\.now\(\)\)[\s\S]*?\}\)\n\s*\.catch\(\(\) => console\.log\("Không tìm th?y file danh sách h?c sinh"\)\);/;
const nf = `fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
          setStudents(data);
          if (data.length > 0) setStudentName(data[0]);
      })
      .catch(() => console.log("Không tìm th?y file danh sách h?c sinh"));`;
content = content.replace(f1, nf);

// Fix unicode for labels I just injected
content = content.replace(/H\?c Sinh/g, 'H\u1ECCC SINH');
content = content.replace(/Nh\?p t\xEF\xBF\xBDn\.\.\./g, 'Nh\u1EADp t\u00EAn...');

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
