const fs = require('fs');
let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');

const regex = /for \(let retries = 3; retries > 0; retries--\) \{[\s\S]*?\} catch\(e\) \{[\s\S]*?\}[\s\S]*?\}/;

const newSubmit = `      let success = false;
      let lastError = "L?i m?ng ho?c Server";
      for (let retries = 3; retries > 0; retries--) {
        try {
          const res = await fetch('/api/sheets', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName, mode: 'DE_THI', week: className, category: 'DE_THI', problem: problemName, score: finalScore, maxScore: finalMax, errorMsg: finalMsg, code: fullSub })
          });
          if (res.ok) {
            success = true;
            break;
          } else {
            const errData = await res.json();
            lastError = errData.error || ("L?i HTTP " + res.status);
          }
        } catch(e) {
          lastError = e.message;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!success) {
        alert("L?I LUU ÐI?M: " + lastError + "\\n\\nHãy copy code n?p tr?c ti?p cho giáo viên!");
      }`;

thi = thi.replace(regex, newSubmit);
fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
