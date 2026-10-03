const fs = require('fs');
let content = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const regex = /fetch\("\/data\/students\.json"\)[\s\S]*?catch\(\(\) => \{\}\);/;

const newFetch = `fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          setClassName(classes[0]);
          if (data[classes[0]].length > 0) {
            setStudentName(data[classes[0]][0]);
          }
        }
      })
      .catch(() => console.log("L?i t?i danh sách h?c sinh"));`;

content = content.replace(regex, newFetch);

fs.writeFileSync('src/app/thi/page.tsx', content, 'utf8');
