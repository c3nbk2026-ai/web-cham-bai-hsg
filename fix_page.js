const fs = require('fs');
let page = fs.readFileSync('src/app/page.tsx', 'utf8');

const targetStr = `<textarea 
              className="w-full h-80 p-6 bg-slate-900 text-cyan-300 font-mono text-[15px] focus:outline-none resize-none leading-relaxed" 
              spellCheck="false"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />`;

const newMonacoPage = `<div className="h-96 w-full relative">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 16 }
                }}
              />
            </div>`;

if (page.includes(targetStr)) {
    page = page.replace(targetStr, newMonacoPage);
    fs.writeFileSync('src/app/page.tsx', page, 'utf8');
    console.log("SUCCESS");
} else {
    console.log("NOT FOUND, looking for generic textarea");
    const r = /<textarea[\s\S]*?onChange=\{\(e\) => setCode\(e\.target\.value\)\}[\s\S]*?\/>/;
    if (r.test(page)) {
       page = page.replace(r, newMonacoPage);
       fs.writeFileSync('src/app/page.tsx', page, 'utf8');
       console.log("SUCCESS WITH REGEX");
    } else {
       console.log("COMPLETELY FAILED");
    }
}
