const fs = require('fs');
let content = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');

// 1. Flatten the docs tree
content = content.replace(
    'const filteredDocsTree: any = {};',
    `const filteredDocsTree: any = {};
    const allFlatDocs: any[] = [];`
);

content = content.replace(
    'filteredDocsTree[week] = filtered;',
    `filteredDocsTree[week] = filtered;
            filtered.forEach((d: any) => {
                allFlatDocs.push({ ...d, weekName: week });
            });`
);

// 2. Change the rendering from mapping weeks to mapping allFlatDocs
const oldRender = `<div className="space-y-12 pb-20">
                    {Object.keys(filteredDocsTree).sort().map((week, wIdx) => (
                        <div key={week} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: \`\${wIdx * 150}ms\` }}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-black text-slate-700 bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500">{week}</h2>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredDocsTree[week].map((doc: any, dIdx: number) => {
                                    const gradient = gradients[(wIdx * 3 + dIdx) % gradients.length];
                                    const cleanName = doc.name.replace(/^hs-hsg[-_ ]?/i, '').replace(/^hs-hs[-_ ]?/i, '').replace('.pdf', '').replace(/_/g, ' ');
                                    const isCompleted = completedDocs.includes(doc.url);

                                    return (`;

const newRender = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                    {allFlatDocs.map((doc: any, idx: number) => {
                        const gradient = gradients[idx % gradients.length];
                        const cleanName = doc.name.replace(/^hs-hsg[-_ ]?/i, '').replace(/^hs-hs[-_ ]?/i, '').replace('.pdf', '').replace(/_/g, ' ');
                        const isCompleted = completedDocs.includes(doc.url);

                        return (`;

content = content.replace(oldRender, newRender);

// 3. Add Week badge to the card
const oldBadge = `<div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black border border-white/30 uppercase tracking-widest shadow-sm">
                                                        PDF
                                                    </div>`;
const newBadge = `<div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black border border-white/30 uppercase tracking-widest shadow-sm flex items-center gap-1">
                                                        <span>{doc.weekName}</span>
                                                    </div>`;
content = content.replace(oldBadge, newBadge);

// 4. Clean up the closing tags
const oldClose = `                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}`;

const newClose = `                                        </div>
                                    );
                                })}`;
content = content.replace(oldClose, newClose);

// Increase max width container
content = content.replace('max-w-[1400px]', 'max-w-[1800px]');

fs.writeFileSync('src/app/tu-hoc/page.tsx', content, 'utf8');
