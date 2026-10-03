const fs = require('fs');

let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const oldDrawExam = `  const drawExam = () => {
    let all: {folder: string, item: ExamItem}[] = [];
    Object.keys(structure).forEach(folder => {
      if (folder.startsWith('DE_') && Array.isArray(structure[folder]["DE_THI"])) {
        structure[folder]["DE_THI"].forEach((item: ExamItem) => all.push({folder, item}));
      }
    });
    if (all.length === 0) return alert("Chua tim thay bai thi nao!");
    const r = all[Math.floor(Math.random() * all.length)];
    setExamItem(r.item); setTestFolder(r.folder); setHasDrawn(true);
  };`;

const newDrawExam = `  const drawExam = () => {
    let all: {folder: string, item: ExamItem}[] = [];
    const requiredTopic = examConfig["Ch\u1EE7 \u0111\u1EC1"];
    
    Object.keys(structure).forEach(folder => {
      let isMatch = false;
      if (requiredTopic) {
         isMatch = folder.includes(requiredTopic);
      } else {
         isMatch = folder.startsWith('DE_');
      }
      
      if (isMatch && Array.isArray(structure[folder]["DE_THI"])) {
        structure[folder]["DE_THI"].forEach((item: ExamItem) => all.push({folder, item}));
      }
    });
    if (all.length === 0) return alert("Kh\u00F4ng t\u00ECm th\u1EA5y b\u00E0i thi n\u00E0o cho ch\u1EE7 \u0111\u1EC1: " + (requiredTopic || 'T\u1EA5t c\u1EA3'));
    const r = all[Math.floor(Math.random() * all.length)];
    setExamItem(r.item); setTestFolder(r.folder); setHasDrawn(true);
  };`;

thi = thi.replace(oldDrawExam, newDrawExam);
fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
