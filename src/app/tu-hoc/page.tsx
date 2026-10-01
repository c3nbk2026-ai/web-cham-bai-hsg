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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex gap-6">
            
            {/* Sidebar */}
            <div className="w-1/4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-full overflow-y-auto">
                <h2 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    Tài Liệu Tự Học
                </h2>

                <div className="space-y-6">
                    {Object.keys(docsTree).sort().map(week => (
                        <div key={week} className="space-y-3">
                            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                                {week}
                            </h3>
                            <div className="space-y-1">
                                {docsTree[week].length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">Chưa có tài liệu</p>
                                ) : (
                                    docsTree[week].map((doc: any) => (
                                        <button
                                            key={doc.url}
                                            onClick={() => setSelectedDoc(doc)}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                                                selectedDoc?.url === doc.url
                                                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                                                : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            <svg className={`w-4 h-4 shrink-0 ${selectedDoc?.url === doc.url ? "text-indigo-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                            <span className="truncate">{doc.name.replace('.pdf', '')}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Viewer */}
            <div className="w-3/4 bg-slate-200/50 rounded-2xl shadow-inner border border-slate-300 overflow-hidden relative flex flex-col">
                {selectedDoc ? (
                    <>
                        <div className="bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-slate-700 text-sm">{selectedDoc.name}</h3>
                            <a href={selectedDoc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                                Mở tab mới
                            </a>
                        </div>
                        <iframe 
                            src={selectedDoc.url} 
                            className="w-full flex-1 border-0"
                            title="PDF Viewer"
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        <p className="font-bold text-sm">Vui lòng chọn tài liệu bên trái để xem</p>
                    </div>
                )}
            </div>

        </div>
    );
}
