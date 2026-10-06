const fs = require('fs');
let page = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');

// Add imports
if (!page.includes('remark-math')) {
    page = page.replace(
        'import ReactMarkdown from "react-markdown";',
        `import ReactMarkdown from "react-markdown";\nimport remarkMath from 'remark-math';\nimport rehypeKatex from 'rehype-katex';\nimport 'katex/dist/katex.min.css';`
    );
}

// Update component
page = page.replace(
    /<ReactMarkdown>\{msg\.text\}<\/ReactMarkdown>/g,
    `<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>`
);

fs.writeFileSync('src/app/tu-hoc/page.tsx', page, 'utf8');
