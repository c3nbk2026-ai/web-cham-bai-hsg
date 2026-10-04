const fs = require('fs');

let page = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');

// 1. State changes
page = page.replace(
    /const \[chatMessages, setChatMessages\] = useState<\{role: 'user'\|'model', text: string\}\[\]>\(\[\]\);/,
    `const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string, attachment?: {data: string, mimeType: string, name?: string}}[]>([]);`
);
page = page.replace(
    /const \[chatInput, setChatInput\] = useState\(""\);/,
    `const [chatInput, setChatInput] = useState("");\n    const [attachedFile, setAttachedFile] = useState<{data: string, mimeType: string, name: string} | null>(null);`
);

// 2. Add Handlers before handleSendMessage
const handlers = `    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            setAttachedFile({
                data: base64Data,
                mimeType: file.type,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        const base64Data = result.split(',')[1];
                        setAttachedFile({
                            data: base64Data,
                            mimeType: file.type,
                            name: "image_pasted.png"
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    const handleSendMessage = async (e?: any) => {`;
page = page.replace(`    const handleSendMessage = async (e?: any) => {`, handlers);

// 3. Update handleSendMessage logic
page = page.replace(
    /if \(!chatInput\.trim\(\) \|\| !selectedDoc\) return;/,
    `if ((!chatInput.trim() && !attachedFile) || !selectedDoc) return;`
);
page = page.replace(
    /const newMsg = \{ role: 'user' as const, text: chatInput\.trim\(\) \};/,
    `const newMsg = { role: 'user' as const, text: chatInput.trim(), attachment: attachedFile || undefined };`
);
page = page.replace(
    /setChatInput\(""\);\s*setIsChatLoading\(true\);/,
    `setChatInput("");\n        setAttachedFile(null);\n        setIsChatLoading(true);`
);
page = page.replace(
    /body: JSON\.stringify\(\{\s*message: newMsg\.text,\s*documentName: selectedDoc\.name,\s*history: chatMessages\s*\}\)/,
    `body: JSON.stringify({
                    message: newMsg.text,
                    documentName: selectedDoc.name,
                    history: chatMessages,
                    attachment: attachedFile || undefined
                })`
);

// 4. Render attachment in user messages
const oldMsgRender = `<p className="whitespace-pre-wrap font-medium">{msg.text}</p>`;
const newMsgRender = `<div>
                                                  {msg.attachment && (
                                                      <div className="mb-2">
                                                          {msg.attachment.mimeType.startsWith('image/') ? (
                                                              <img src={\`data:\${msg.attachment.mimeType};base64,\${msg.attachment.data}\`} className="max-w-[200px] rounded-lg border border-indigo-400 shadow-sm" alt="attachment" />
                                                          ) : (
                                                              <div className="bg-indigo-700 text-indigo-100 p-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 border border-indigo-500 shadow-sm">
                                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                                  {msg.attachment.name}
                                                              </div>
                                                          )}
                                                      </div>
                                                  )}
                                                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                              </div>`;
page = page.replace(oldMsgRender, newMsgRender);

// 5. Update input form
const oldForm = `<div className="relative flex items-center">
                                  <input 
                                      type="text" 
                                      value={chatInput} 
                                      onChange={e => setChatInput(e.target.value)} 
                                      placeholder="Nh\u1EADp c\u00E2u h\u1ECFi c\u1EE7a em..." 
                                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner text-slate-900 font-medium placeholder:text-slate-400"
                                  />
                                  <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                  </button>
                              </div>`;
                              
const newForm = `<div className="flex flex-col gap-2">
                                  {attachedFile && (
                                      <div className="relative inline-block self-start">
                                          {attachedFile.mimeType.startsWith('image/') ? (
                                              <img src={\`data:\${attachedFile.mimeType};base64,\${attachedFile.data}\`} className="h-16 max-w-[100px] object-cover rounded-lg border border-slate-200 shadow-sm" alt="Preview" />
                                          ) : (
                                              <div className="h-10 px-3 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-xs font-bold text-slate-600 shadow-sm gap-2">
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                  {attachedFile.name}
                                              </div>
                                          )}
                                          <button type="button" onClick={() => setAttachedFile(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-rose-600 z-10">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                          </button>
                                      </div>
                                  )}
                                  <div className="relative flex items-center gap-2">
                                      <label className="cursor-pointer p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 border border-slate-200 rounded-xl shadow-sm shrink-0">
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                          <input type="file" accept="image/*,.docx,.txt" className="hidden" onChange={handleFileAttach} />
                                      </label>
                                      <input 
                                          type="text" 
                                          value={chatInput} 
                                          onChange={e => setChatInput(e.target.value)} 
                                          onPaste={handlePaste}
                                          placeholder="Nh\u1EADp tin nh\u1EAFn ho\u1EB7c d\u00E1n (Ctrl+V) \u1EA3nh..." 
                                          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner text-slate-900 font-medium placeholder:text-slate-400"
                                      />
                                      <button type="submit" disabled={(!chatInput.trim() && !attachedFile) || isChatLoading} className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                      </button>
                                  </div>
                              </div>`;
// Careful replacement for the form part since it might contain unexpected characters.
page = page.replace(/<div className="relative flex items-center">[\s\S]*?<\/button>\s*<\/div>/, newForm);

// We should also replace the old placeholder text globally just in case.
fs.writeFileSync('src/app/tu-hoc/page.tsx', page, 'utf8');
console.log('Done replacement');
