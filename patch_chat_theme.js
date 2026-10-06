const fs = require('fs');
let page = fs.readFileSync('src/app/tu-hoc/page.tsx', 'utf8');

// Find the boundaries of the chat component
const chatStartTag = '{isChatOpen && (';
const startIdx = page.indexOf(chatStartTag);
if (startIdx === -1) throw new Error('Chat start not found');

// Find the corresponding closing of the chat block.
// It's the `)}` after `</form>\n                    </div>`.
const searchArea = page.substring(startIdx);
const endMatch = searchArea.match(/<\/form>\s*<\/div>\s*\)\}/);
if (!endMatch) throw new Error('Chat end not found');
const endIdx = startIdx + endMatch.index + endMatch[0].length;

const oldChatBlock = page.substring(startIdx, endIdx);

const newChatBlock = `{isChatOpen && (
                    <div className="w-full md:w-1/3 bg-[#1e293b] rounded-3xl shadow-2xl border border-[#334155] overflow-hidden flex flex-col h-[50vh] md:h-[calc(100vh-100px)] animate-in slide-in-from-right-8 duration-300 relative z-20 font-sans">
                        <div className="bg-[#0f172a] p-4 text-white shrink-0 shadow-md relative z-10 border-b border-[#334155]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#319b85] rounded-lg flex items-center justify-center shadow-inner">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </div>
                                    <h3 className="font-bold text-[#319b85]">Tr\u1EE3 gi\u1EA3ng AI</h3>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">H\u1ECFi b\u1EA5t c\u1EE9 \u0111i\u1EC1u g\u00EC v\u1EC1 t\u00E0i li\u1EC7u n\u00E0y</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#1e293b] scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent">
                            {chatMessages.length === 0 && (
                                <div className="text-center text-slate-400 mt-10 space-y-3">
                                    <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-4 text-[#319b85] shadow-inner border border-[#334155]">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    </div>
                                    <p className="font-medium text-sm text-slate-400">Ch\u00E0o em! C\u00F4 c\u00F3 th\u1EC3 gi\u00FAp g\u00EC cho em trong b\u00E0i h\u1ECDc n\u00E0y?</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={\`flex gap-3 w-full \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-lg bg-[#319b85] text-white font-black flex items-center justify-center shrink-0 mt-1 shadow-sm text-xs tracking-tighter">
                                            AI
                                        </div>
                                    )}
                                    <div className={\`max-w-[85%] \${msg.role === 'user' ? 'rounded-2xl px-4 py-2.5 text-sm shadow-md bg-[#319b85] text-white rounded-tr-sm' : 'text-slate-200 text-sm w-full pt-1'}\`}>
                                        {msg.role === 'model' ? (
                                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-3 prose-pre:bg-[#0f172a] prose-pre:text-slate-200 prose-pre:border prose-pre:border-[#334155] prose-pre:shadow-inner prose-code:text-[#319b85] prose-code:bg-[#0f172a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-strong:text-[#fbbf24] prose-strong:font-bold prose-a:text-[#319b85] marker:text-[#319b85]">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div>
                                                  {msg.attachment && (
                                                      <div className="mb-2">
                                                          {msg.attachment.mimeType.startsWith('image/') ? (
                                                              <img src={\`data:\${msg.attachment.mimeType};base64,\${msg.attachment.data}\`} className="max-w-[200px] rounded-lg border border-white/20 shadow-sm" alt="attachment" />
                                                          ) : (
                                                              <div className="bg-white/20 text-white p-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 border border-white/30 shadow-sm">
                                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                                  {msg.attachment.name}
                                                              </div>
                                                          )}
                                                      </div>
                                                  )}
                                                  <p className="whitespace-pre-wrap font-medium leading-relaxed">{msg.text}</p>
                                              </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start gap-3 w-full">
                                    <div className="w-8 h-8 rounded-lg bg-[#319b85] text-white font-black flex items-center justify-center shrink-0 mt-1 shadow-sm text-xs tracking-tighter">AI</div>
                                    <div className="px-1 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-[#319b85] rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-[#319b85] rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                            <div className="w-2 h-2 bg-[#319b85] rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-[#0f172a] border-t border-[#334155] shrink-0 shadow-lg relative z-10">
                            <div className="flex flex-col gap-2">
                                  {attachedFile && (
                                      <div className="relative inline-block self-start ml-12">
                                          {attachedFile.mimeType.startsWith('image/') ? (
                                              <img src={\`data:\${attachedFile.mimeType};base64,\${attachedFile.data}\`} className="h-16 max-w-[100px] object-cover rounded-lg border border-[#334155] shadow-sm" alt="Preview" />
                                          ) : (
                                              <div className="h-10 px-3 bg-[#1e293b] text-slate-200 rounded-lg flex items-center justify-center border border-[#334155] text-xs font-bold shadow-sm gap-2">
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
                                      <label className="cursor-pointer p-2 text-slate-400 hover:text-[#319b85] transition-colors bg-[#1e293b] border border-[#334155] rounded-xl shadow-sm shrink-0">
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                          <input type="file" accept="image/*,.docx,.txt" className="hidden" onChange={handleFileAttach} />
                                      </label>
                                      <input 
                                          type="text" 
                                          value={chatInput} 
                                          onChange={e => setChatInput(e.target.value)} 
                                          onPaste={handlePaste}
                                          placeholder="Nh\u1EADp tin nh\u1EAFn ho\u1EB7c d\u00E1n \u1EA3nh..." 
                                          className="w-full pl-4 pr-12 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#319b85] focus:border-[#319b85] transition-all shadow-inner text-slate-200 font-medium placeholder:text-slate-500"
                                      />
                                      <button type="submit" disabled={(!chatInput.trim() && !attachedFile) || isChatLoading} className="absolute right-2 p-2 bg-[#319b85] text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-[#319b85] transition-colors shadow-sm">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                      </button>
                                  </div>
                              </div>
                        </form>
                    </div>
                )}`;

page = page.replace(oldChatBlock, newChatBlock);
fs.writeFileSync('src/app/tu-hoc/page.tsx', page, 'utf8');
