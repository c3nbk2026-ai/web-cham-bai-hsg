const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove direct import
    content = content.replace('import Editor from "@monaco-editor/react";', '');
    
    // Add dynamic import
    if (!content.includes('import dynamic from "next/dynamic";')) {
        content = content.replace(
            'import { useState, useEffect } from "react";',
            'import { useState, useEffect } from "react";\nimport dynamic from "next/dynamic";\nconst Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });'
        );
    }
    
    fs.writeFileSync(file, content, 'utf8');
}

fixFile('src/app/page.tsx');
fixFile('src/app/thi/page.tsx');
console.log("Fixed dynamic imports!");
