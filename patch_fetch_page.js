const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /fetch\("\/data\/students\.json"\)[\s\S]*?setStudentName\(data\[0\]\);\s*\n\s*\}\)/;

const newFetch = `fetch("/api/students?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            setStudentsData({"L?I C?P QUY?N": ["Chua Share file sheet cho Bot"]});
            setStudentClass("L?I C?P QUY?N");
            return;
        }
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          setStudentClass(classes[0]);
          if (data[classes[0]].length > 0) {
            setStudentName(data[classes[0]][0]);
          }
        }
      })`;

page = page.replace(regex, newFetch);
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
