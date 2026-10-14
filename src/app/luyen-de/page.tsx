"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMode } from "@/components/ModeContext";
import ReactMarkdown from "react-markdown";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ExamItem {
    week: string;
    weekNum: number;
    title: string;
    docxFile: string | null;
    pdfFile: string | null;
    docxUrl: string | null;
    pdfUrl: string | null;
    problems: string[];
}

export default function LuyenDePage() {
    const router = useRouter();
    const { setMode } = useMode();
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // AI Chat
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{role: 'user'|'model', text: string, attachment?: {data: string, mimeType: string, name?: string}}[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [attachedFile, setAttachedFile] = useState<{data: string, mimeType: string, name: string} | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMode('LUYEN_DE');
        fetch("/api/exams", { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setExams(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Lỗi tải đề thi:", err);
                setIsLoading(false);
            });
    }, [setMode]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

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
        e.target.value = '';
    };

    const handleSendMessage = async (e?: any) => {
        if (e) e.preventDefault();
        if ((!chatInput.trim() && !attachedFile) || !selectedExam) return;

        const newMsg = { role: 'user' as const, text: chatInput.trim(), attachment: attachedFile || undefined };
        const newHistory = [...chatMessages, newMsg];
        setChatMessages(newHistory);
        setChatInput("");
        setAttachedFile(null);
        setIsChatLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newHistory,
                    documentName: selectedExam.title + " (Tuần " + selectedExam.weekNum + ")"
                })
            });
            const data = await res.json();
            if (data.reply) {
                setChatMessages([...newHistory, { role: 'model', text: data.reply }]);
            } else {
                setChatMessages([...newHistory, { role: 'model', text: "Lỗi kết nối hoặc AI không phản hồi." }]);
            }
        } catch (error) {
            setChatMessages([...newHistory, { role: 'model', text: "Đã xảy ra lỗi khi gửi tin nhắn." }]);
        }
        setIsChatLoading(false);
    };

    const goToSubmitCode = (week: string) => {
        // Chuyển sang trang chủ với tuần và loại bài là DE_THI
        router.push(`/?week=${encodeURIComponent(week)}&cat=DE_THI`);
    };

    const gradients = [
        "from-emerald-500 to-teal-600",
        "from-teal-500 to-cyan-600",
        "from-cyan-500 to-blue-600",
        "from-blue-600 to-indigo-600",
        "from-indigo-500 to-violet-600",
        "from-violet-500 to-purple-600"
    ];

    // GIAO DIỆN XEM CHI TIẾT ĐỀ THI
    if (selectedExam) {
        return (
            <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100 p-2 md:p-4 gap-4 relative z-10">
                {/* Panel Đọc Đề */}
                <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200/80 flex flex-col overflow-hidden">
                    {/* Header Thanh Công Cụ */}
                    <div className="p-3 md:p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shadow-sm z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSelectedExam(null);
                                    setIsChatOpen(false);
                                }}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                <span>Thư Viện Đề</span>
                            </button>
                            <div>
                                <h2 className="text-sm md:text-base font-black text-slate-800 line-clamp-1">{selectedExam.title}</h2>
                                <p className="text-[11px] font-semibold text-emerald-600">{selectedExam.week} • Đề thi chính thức HSG</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Nút vào chấm code */}
                            <button
                                onClick={() => goToSubmitCode(selectedExam.week)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs md:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                                <span>Nộp Code & Chấm Bài</span>
                            </button>

                            {/* Tải bản docx nếu có */}
                            {selectedExam.docxUrl && (
                                <a
                                    href={selectedExam.docxUrl}
                                    download
                                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                                    title="Tải tệp Word .docx"
                                >
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <span>Tải Word</span>
                                </a>
                            )}

                            {/* Trợ giảng AI */}
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm ${isChatOpen ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                <span className="hidden sm:inline">Trợ giảng AI</span>
                            </button>
                        </div>
                    </div>

                    {/* Khung nhúng PDF Viewer */}
                    <div className="flex-1 w-full h-full relative bg-slate-800">
                        {selectedExam.pdfUrl ? (
                            <iframe
                                src={`${selectedExam.pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=100`}
                                className="absolute inset-0 w-full h-full border-0 bg-white"
                                title="Nội dung đề thi"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                <p className="font-bold text-lg text-slate-200 mb-2">Đang xử lý tài liệu PDF đề thi...</p>
                                <p className="text-sm mb-4">Bạn có thể tải file Word gốc về máy để đọc:</p>
                                {selectedExam.docxUrl && (
                                    <a href={selectedExam.docxUrl} download className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow">
                                        Tải file Word (.docx)
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel AI Chat */}
                {isChatOpen && (
                    <div className="w-full md:w-1/3 bg-[#1e293b] rounded-3xl shadow-2xl border border-[#334155] overflow-hidden flex flex-col h-[50vh] md:h-[calc(100vh-100px)] animate-in slide-in-from-right-8 duration-300 relative z-20 font-sans">
                        <div className="bg-[#0f172a] p-4 text-white shrink-0 shadow-md relative z-10 border-b border-[#334155]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-inner">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </div>
                                    <h3 className="font-bold text-emerald-400">Trợ giảng AI HSG</h3>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Hỏi gợi ý thuật toán, subtask, hoặc phân tích đề thi này</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#1e293b] scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent">
                            {chatMessages.length === 0 && (
                                <div className="text-center text-slate-400 mt-10 space-y-3">
                                    <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner border border-[#334155]">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                    </div>
                                    <p className="font-medium text-sm text-slate-400">Chào em! Em cần gợi ý ý tưởng hay phân tích subtask nào trong đề này?</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 mt-1 shadow-sm text-xs tracking-tighter">
                                            AI
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'rounded-2xl px-4 py-2.5 text-sm shadow-md bg-emerald-600 text-white rounded-tr-sm' : 'text-slate-200 text-sm w-full pt-1'}`}>
                                        {msg.role === 'model' ? (
                                            <div className="prose prose-sm prose-invert text-slate-200 max-w-none prose-p:leading-relaxed prose-p:text-slate-200 prose-li:text-slate-200 prose-p:mb-3 prose-pre:bg-[#0f172a] prose-pre:text-slate-200 prose-pre:border prose-pre:border-[#334155] prose-pre:shadow-inner prose-code:text-emerald-400 prose-code:bg-[#0f172a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-strong:text-[#fbbf24] prose-strong:font-bold prose-a:text-emerald-400 marker:text-emerald-400">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div>
                                                {msg.attachment && (
                                                    <div className="mb-2">
                                                        {msg.attachment.mimeType.startsWith('image/') ? (
                                                            <img src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} className="max-w-[200px] rounded-lg border border-white/20 shadow-sm" alt="attachment" />
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
                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 mt-1 shadow-sm text-xs tracking-tighter">AI</div>
                                    <div className="px-1 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 bg-[#0f172a] border-t border-[#334155] shrink-0 shadow-lg relative z-10">
                            {attachedFile && (
                                <div className="mb-2 p-2 bg-[#1e293b] border border-[#334155] rounded-xl flex items-center justify-between text-xs text-slate-300">
                                    <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                                    <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-rose-400">✕</button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    <input type="file" className="hidden" onChange={handleFileAttach} accept="image/*,.txt,.py" />
                                </label>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Hỏi trợ giảng AI..."
                                    className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <button type="submit" disabled={(!chatInput.trim() && !attachedFile) || isChatLoading} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-40 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // GIAO DIỆN CHÍNH: DANH SÁCH ĐỀ THI THEO TUẦN
    return (
        <div className="w-full max-w-[1700px] mx-auto p-4 md:p-8 min-h-[calc(100vh-64px)] relative z-10">
            {/* Header Trang Luyện Đề */}
            <div className="mb-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center p-1.5 bg-white/70 backdrop-blur-md rounded-full shadow-sm border border-white">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs md:text-sm rounded-full shadow-sm">
                        Luyện Đề Thi HSG
                    </span>
                    <span className="px-4 py-1.5 text-slate-600 font-semibold text-xs md:text-sm">
                        Cấu trúc đề Tỉnh Lâm Đồng (Dạng 1 & 2)
                    </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 leading-tight py-2">
                    Thư Viện Đề Thi Theo Tuần
                </h1>
                
                <p className="max-w-2xl mx-auto text-slate-500 text-sm md:text-base font-medium">
                    Học sinh có thể đọc toàn bộ đề thi chính thức từng tuần, xem các bài toán, bấm nộp bài để chấm trực tiếp trên hệ thống hoặc tải file Word về máy.
                </p>
            </div>

            {/* Danh sách đề thi */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin shadow-lg"></div>
                </div>
            ) : exams.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-300 bg-white/50 backdrop-blur-sm rounded-3xl shadow-sm max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <p className="text-slate-600 font-bold text-base">Chưa tìm thấy đề thi nào trong hệ thống!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {exams.map((exam, idx) => {
                        const gradient = gradients[idx % gradients.length];
                        return (
                            <div
                                key={exam.week}
                                className="bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-emerald-200 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden group"
                            >
                                {/* Dải trang trí trên đỉnh */}
                                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradient}`}></div>

                                <div>
                                    {/* Tuần & Huy hiệu */}
                                    <div className="flex justify-between items-center mb-4 pt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {exam.week}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400">
                                                Đề số {exam.weekNum}
                                            </span>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                    </div>

                                    {/* Tiêu đề đề thi */}
                                    <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                                        {exam.title}
                                    </h3>

                                    {/* Danh sách các bài toán */}
                                    {exam.problems.length > 0 && (
                                        <div className="mb-6 space-y-2">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Các bài trong đề:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {exam.problems.map((prob, pIdx) => (
                                                    <span
                                                        key={prob}
                                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs rounded-lg border border-slate-200 transition-colors"
                                                    >
                                                        Bài {pIdx + 1}: {prob}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Hành động */}
                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSelectedExam(exam)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                            <span>Đọc Đề Thi</span>
                                        </button>

                                        <button
                                            onClick={() => goToSubmitCode(exam.week)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs border border-slate-200 hover:border-emerald-200 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                                            <span>Chấm Code</span>
                                        </button>
                                    </div>

                                    {exam.docxUrl && (
                                        <a
                                            href={exam.docxUrl}
                                            download
                                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            <span>Tải tệp Word (.docx)</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
