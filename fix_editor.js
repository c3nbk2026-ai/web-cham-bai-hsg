const fs = require('fs');

// PATCH thi/page.tsx
let thi = fs.readFileSync('src/app/thi/page.tsx', 'utf8');
if (!thi.includes('Editor from "@monaco-editor/react"')) {
    thi = thi.replace(
        'import { useState, useEffect } from "react";',
        'import { useState, useEffect } from "react";\nimport Editor from "@monaco-editor/react";'
    );
    
    const oldTextArea = `<textarea className="w-full flex-1 p-6 bg-[#1e1e1e] text-cyan-300 font-mono text-[16px] focus:outline-none resize-none leading-relaxed" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} disabled={isFinished} />`;
    const newMonaco = `<Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    wordWrap: 'on',
                    readOnly: isFinished,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 }
                  }}
                />`;
    thi = thi.replace(oldTextArea, newMonaco);
    fs.writeFileSync('src/app/thi/page.tsx', thi, 'utf8');
}

// PATCH page.tsx
let page = fs.readFileSync('src/app/page.tsx', 'utf8');
if (!page.includes('Editor from "@monaco-editor/react"')) {
    page = page.replace(
        'import { useState, useEffect, useRef } from "react";',
        'import { useState, useEffect, useRef } from "react";\nimport Editor from "@monaco-editor/react";'
    );
    
    // Find textarea in page.tsx
    const oldTextAreaPageRegex = /<textarea[\s\S]*?className="w-full h-80 p-6 bg-slate-900 text-cyan-300 font-mono text-\[15px\] focus:outline-none resize-none leading-relaxed"[\s\S]*?spellCheck="false"[\s\S]*?value=\{code\}[\s\S]*?onChange=\{e => setCode\(e\.target\.value\)\}[\s\S]*?\/>/g;
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
    
    page = page.replace(oldTextAreaPageRegex, newMonacoPage);
    fs.writeFileSync('src/app/page.tsx', page, 'utf8');
}
