"use client";
import { useState, useEffect } from "react";

export default function TuHocPage() {
    const [docsTree, setDocsTree] = useState<any>({});
    const [selectedDoc, setSelectedDoc] = useState<{name: string, url: string} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/docs")
            .then(res => res.json())
            .then(data => {
                setDocsTree(data);
                setIsLoading(false);
                // Auto-select first doc
                const firstWeek = Object.keys(data).sort()[0];
                if (firstWeek && data[firstWeek].length > 0) {
                    setSelectedDoc(data[firstWeek][0]);
                }
            })
            .catch(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="p-10 text-center font-bold text-slate-500">Đang tải tài liệu...</div>;

    return (
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 h-[calc(100vh-64px)] flex gap-4 md:gap-6">
            
            {/* Sidebar (Cố định chiều rộng 320px, không bị bóp méo) */}
            <div className="w-[320px] shrink-0 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-xl shadow-indigo-100/50 p-5 flex flex-col h-full overflow-y-auto">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    Hệ Thống Bài Giảng
                </h2>

                <div className="space-y-6">
                    {Object.keys(docsTree).sort().map(week => (
                        <div key={week} className="space-y-3">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                {week}
                            </h3>
                            <div className="space-y-1.5">
                                {docsTree[week].length === 0 ? (
                                    <p className="text-xs text-slate-400 italic px-2">Chưa cập nhật tài liệu</p>
                                ) : (
                                    docsTree[week].map((doc: any) => (
                                        <button
                                            key={doc.url}
                                            onClick={() => setSelectedDoc(doc)}
                                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all flex items-start gap-3 ${
                                                selectedDoc?.url === doc.url
                                                ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 shadow-sm border border-indigo-100/50"
                                                : "text-slate-600 hover:bg-slate-50 border border-transparent"
                                            }`}
                                        >
                                            <svg className={`w-4 h-4 shrink-0 mt-0.5 ${selectedDoc?.url === doc.url ? "text-indigo-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                            <span className="whitespace-normal break-words leading-tight">
                                                {doc.name.replace('.pdf', '').replace(/_/g, ' ')}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Viewer (Chiếm toàn bộ không gian còn lại) */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-indigo-100/40 border border-slate-200 overflow-hidden relative flex flex-col">
                {selectedDoc ? (
                    <>
                        {/* Thanh tiêu đề nhỏ xíu để tiết kiệm diện tích */}
                        <div className="bg-slate-50/80 backdrop-blur-md px-4 py-2 border-b border-slate-200 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-slate-700 text-xs truncate mr-4">
                                {selectedDoc.name.replace(/_/g, ' ')}
                            </h3>
                            <a href={selectedDoc.url} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-1.5 shrink-0">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                Phóng to
                            </a>
                        </div>
                        <iframe 
                            src={`${selectedDoc.url}#toolbar=1&navpanes=0&scrollbar=1`} 
                            className="w-full flex-1 border-0 bg-[#323639]"
                            title="PDF Viewer"
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <svg className="w-20 h-20 mb-6 opacity-30 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        <p className="font-bold text-slate-500">Vui lòng chọn bài giảng bên trái để bắt đầu học</p>
                    </div>
                )}
            </div>

        </div>
    );
}
