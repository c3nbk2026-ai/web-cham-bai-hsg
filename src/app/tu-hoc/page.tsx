"use client";
import { useState, useEffect, useRef } from "react";
import { useMode } from "@/components/ModeContext";
import ReactMarkdown from "react-markdown";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function TuHocPage() {
    const { mode } = useMode();
    const [docsTree, setDocsTree] = useState<any>({});
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Progress tracking
    const [completedDocs, setCompletedDocs] = useState<string[]>([]);
    
    // Chat feature
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string, attachment?: {data: string, mimeType: string, name?: string}}[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [attachedFile, setAttachedFile] = useState<{data: string, mimeType: string, name: string} | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/docs")
            .then(res => res.json())
            .then(data => {
                setDocsTree(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
            
        const savedProgress = localStorage.getItem(`completedDocs_${mode}`);
        if (savedProgress) {
            try { setCompletedDocs(JSON.parse(savedProgress)); } catch(e) {}
        }
    }, [mode]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const toggleComplete = (docUrl: string, e?: any) => {
        if (e) e.stopPropagation();
        setCompletedDocs(prev => {
            const newProgress = prev.includes(docUrl) ? prev.filter(u => u !== docUrl) : [...prev, docUrl];
            localStorage.setItem(`completedDocs_${mode}`, JSON.stringify(newProgress));
            return newProgress;
        });
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleSendMessage = async (e?: any) => {
        if (e) e.preventDefault();
        if ((!chatInput.trim() && !attachedFile) || !selectedDoc) return;

        const newMsg = { role: 'user' as const, text: chatInput.trim(), attachment: attachedFile || undefined };
        const newHistory = [...chatMessages, newMsg];
        setChatMessages(newHistory);
        setChatInput("");
        setAttachedFile(null);
        setIsChatLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMsg.text,
                    documentName: selectedDoc.name,
                    history: chatMessages,
                    attachment: attachedFile || undefined
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            setChatMessages([...newHistory, { role: 'model', text: data.reply }]);
        } catch (err: any) {
            setChatMessages([...newHistory, { role: 'model', text: "Lỗi: " + err.message }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const filteredDocsTree: any = {};
    const allFlatDocs: any[] = [];
    let totalDocs = 0;
    let completedCount = 0;

    Object.keys(docsTree).sort().forEach(week => {
        const filtered = docsTree[week].filter((doc: any) => !doc.mode || doc.mode === 'ALL' || doc.mode === mode);
        if (filtered.length > 0) {
            filteredDocsTree[week] = filtered;
            filtered.forEach((d: any) => {
                allFlatDocs.push({ ...d, weekName: week });
            });
            totalDocs += filtered.length;
            completedCount += filtered.filter((d:any) => completedDocs.includes(d.url)).length;
        }
    });

    const progressPercent = totalDocs === 0 ? 0 : Math.round((completedCount / totalDocs) * 100);

    const gradients = [
        "from-indigo-500 to-purple-500",
        "from-emerald-400 to-teal-500",
        "from-rose-400 to-orange-500",
        "from-blue-500 to-cyan-500",
        "from-fuchsia-500 to-pink-500",
        "from-amber-400 to-orange-500"
    ];

    // RENDER DOCUMENT VIEWER + CHAT
    if (selectedDoc) {
        return (
            <div className="w-full max-w-[1800px] mx-auto p-4 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-4">
                {/* Left: Document Viewer */}
                <div className={`flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${isChatOpen ? 'md:w-2/3' : 'w-full'}`}>
                    <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setSelectedDoc(null); setIsChatOpen(false); setChatMessages([]); }} className="p-2 hover:bg-slate-200 rounded-xl transition text-slate-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <h3 className="font-bold text-slate-800 text-sm truncate max-w-[200px] sm:max-w-md">
                                {selectedDoc.name.replace(/^hs-hsg[-_ ]?/i, '').replace(/^hs-hs[-_ ]?/i, '').replace('.pdf', '').replace(/_/g, ' ')}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleComplete(selectedDoc.url)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${completedDocs.includes(selectedDoc.url) ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span className="hidden sm:inline">{completedDocs.includes(selectedDoc.url) ? 'Đã hoàn thành' : 'Đánh dấu xong'}</span>
                            </button>
                            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${isChatOpen ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                <span className="hidden sm:inline">Trợ giảng AI</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full h-full relative bg-slate-100">
                        <iframe src={`${selectedDoc.url}#toolbar=1&navpanes=0&scrollbar=1`} className="absolute inset-0 w-full h-full border-0" title="PDF Viewer" />
                    </div>
                </div>

                {/* Right: AI Chat */}
                {isChatOpen && (
                    <div className="w-full md:w-1/3 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[50vh] md:h-auto animate-in slide-in-from-right-8 duration-300 relative z-20">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shrink-0 shadow-md relative z-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </div>
                                    <h3 className="font-bold">Trợ giảng AI</h3>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <p className="text-xs text-white/80 mt-1.5 opacity-90 font-medium">Hỏi bất cứ điều gì về tài liệu này</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {chatMessages.length === 0 && (
                                <div className="text-center text-slate-400 mt-10 space-y-2">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300 shadow-inner">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    </div>
                                    <p className="font-medium text-sm text-slate-500">Chào em! Cô/Thầy có thể giúp gì cho em trong bài học này?</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                                        {msg.role === 'model' ? (
                                            <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div>
                                                  {msg.attachment && (
                                                      <div className="mb-2">
                                                          {msg.attachment.mimeType.startsWith('image/') ? (
                                                              <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} className="max-w-[200px] rounded-lg border border-indigo-400 shadow-sm" alt="attachment" />
                                                          ) : (
                                                              <div className="bg-indigo-700 text-indigo-100 p-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 border border-indigo-500 shadow-sm">
                                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                                  {msg.attachment.name}
                                                              </div>
                                                          )}
                                                      </div>
                                                  )}
                                                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                              </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-10">
                            <div className="flex flex-col gap-2">
                                  {attachedFile && (
                                      <div className="relative inline-block self-start">
                                          {attachedFile.mimeType.startsWith('image/') ? (
                                              <img src={`data:${attachedFile.mimeType};base64,${attachedFile.data}`} className="h-16 max-w-[100px] object-cover rounded-lg border border-slate-200 shadow-sm" alt="Preview" />
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
                                          placeholder="Nhập tin nhắn hoặc dán (Ctrl+V) ảnh..." 
                                          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner text-slate-900 font-medium placeholder:text-slate-400"
                                      />
                                      <button type="submit" disabled={(!chatInput.trim() && !attachedFile) || isChatLoading} className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                      </button>
                                  </div>
                              </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // RENDER MAIN DASHBOARD
    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 min-h-[calc(100vh-64px)] relative z-10">
            {/* Header & Progress */}
            <div className="mb-10 text-center space-y-6">
                <div className="inline-flex items-center justify-center p-1.5 bg-white/60 backdrop-blur-md rounded-full shadow-sm border border-white">
                    <span className="px-4 py-1.5 bg-white rounded-full text-indigo-600 font-bold text-sm shadow-sm">
                        {mode === 'DAI_TRA' ? 'Lớp Cơ Bản' : 'Lớp Nâng Cao'}
                    </span>
                    <span className="px-4 py-1.5 text-slate-500 font-medium text-sm">
                        Hành trình học tập
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 leading-tight py-2">
                    Thư Viện Bài Giảng
                </h1>
                
                <div className="max-w-xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-end mb-3 relative z-10">
                        <div className="text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tiến độ hoàn thành</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-3xl font-black text-slate-700">{progressPercent}<span className="text-xl">%</span></p>
                            </div>
                        </div>
                        <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                            <p className="text-sm font-bold text-indigo-600">{completedCount} / {totalDocs} bài</p>
                        </div>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner relative z-10 border border-slate-200/50">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progressPercent}%` }}>
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
                </div>
            ) : totalDocs === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-300 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <p className="text-slate-500 font-bold text-lg">Chưa có tài liệu nào cho chế độ này!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                    {allFlatDocs.map((doc: any, idx: number) => {
                        const gradient = gradients[idx % gradients.length];
                        const cleanName = doc.name.replace(/^hs-hsg[-_ ]?/i, '').replace(/^hs-hs[-_ ]?/i, '').replace('.pdf', '').replace(/_/g, ' ');
                        const isCompleted = completedDocs.includes(doc.url);

                        return (
                                        <div key={idx} className="group relative bg-white rounded-3xl p-2 shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-indigo-100 flex flex-col hover:-translate-y-1">
                                            {isCompleted && (
                                                <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-in zoom-in border-2 border-white">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            )}
                                            
                                            <div className={`relative h-36 rounded-2xl p-5 overflow-hidden flex-shrink-0 bg-gradient-to-br ${gradient} shadow-inner cursor-pointer`} onClick={() => setSelectedDoc(doc)}>
                                                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-700 blur-2xl pointer-events-none"></div>
                                                <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/10 rounded-full group-hover:scale-150 transition-transform duration-700 blur-xl pointer-events-none"></div>
                                                <div className="relative z-10 flex justify-between items-start">
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-sm border border-white/30 group-hover:bg-white group-hover:text-slate-800 transition-colors duration-300">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                                    </div>
                                                    <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-black border border-white/30 uppercase tracking-widest shadow-sm flex items-center gap-1">
                                                        <span>{doc.weekName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 flex flex-col flex-1">
                                                <h3 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                                                    {cleanName}
                                                </h3>
                                                <p className="text-slate-500 text-xs line-clamp-2 mb-5 flex-1 font-medium">
                                                    Tài liệu lý thuyết, ví dụ và bài tập thực hành.
                                                </p>
                                                <div className="flex items-center gap-2 mt-auto">
                                                    <button 
                                                        onClick={() => setSelectedDoc(doc)}
                                                        className="flex-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-center shadow-sm hover:shadow-md"
                                                    >
                                                        Vào học ngay
                                                    </button>
                                                    <button 
                                                        onClick={(e) => toggleComplete(doc.url, e)}
                                                        className={`p-2.5 rounded-xl border transition-all shadow-sm hover:shadow-md ${isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-emerald-500 hover:border-emerald-200'}`}
                                                        title={isCompleted ? "Bỏ đánh dấu" : "Đánh dấu hoàn thành"}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
}
