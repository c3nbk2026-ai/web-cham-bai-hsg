const fs = require('fs');
let content = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');

// Add import
if (!content.includes('react-markdown')) {
    content = content.replace(
        'import { useMode } from "@/components/ModeContext";',
        `import { useMode } from "@/components/ModeContext";\nimport ReactMarkdown from "react-markdown";`
    );
}

// Fix input color
content = content.replace(
    'className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"',
    'className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner text-slate-900 font-medium placeholder:text-slate-400"'
);

// Fix chat markdown
const oldChatRender = `<p className="whitespace-pre-wrap">{msg.text}</p>`;
const newChatRender = `{msg.role === 'model' ? (
                                            <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                        )}`;
content = content.replace(oldChatRender, newChatRender);

// Also make user bubble text slightly clearer just in case
content = content.replace(
    "'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'",
    "'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'"
);

fs.writeFileSync('src/app/tu-hoc/page.tsx', content, 'utf8');
