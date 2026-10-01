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

    // Khi chưa chọn tài liệu (Hiển thị Thư viện Thẻ)
    if (!selectedDoc) {
        const gradients = [
            "from-violet-500 to-purple-600 shadow-purple-500/30",
            "from-emerald-400 to-teal-500 shadow-teal-500/30",
            "from-rose-400 to-red-500 shadow-rose-500/30",
            "from-amber-400 to-orange-500 shadow-orange-500/30",
            "from-blue-500 to-indigo-600 shadow-blue-500/30",
            "from-fuchsia-500 to-pink-600 shadow-pink-500/30"
        ];

        return (
            <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 min-h-[calc(100vh-64px)] relative z-10">
                <div className="mb-10 text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600">
                        Thư Viện Bài Giảng
                    </h1>
                    <p className="text-slate-600 font-medium text-lg">Chọn một bài học dưới đây để bắt đầu hành trình chinh phục Tin học</p>
                </div>

                <div className="space-y-12">
                    {Object.keys(docsTree).sort().map((week, weekIdx) => (
                        <div key={week} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">{week}</h2>
                                <div className="h-1 bg-gradient-to-r from-slate-200 to-transparent flex-1 rounded-full"></div>
                            </div>
                            
                            {docsTree[week].length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-300 bg-white/50 backdrop-blur-sm rounded-3xl">
                                    <p className="text-slate-500 font-bold">Tuần này chưa có tài liệu, bạn quay lại sau nhé!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {docsTree[week].map((doc: any, docIdx: number) => {
                                        const gradient = gradients[(weekIdx * 10 + docIdx) % gradients.length];
                                        return (
                                            <button
                                                key={doc.url}
                                                onClick={() => setSelectedDoc(doc)}
                                                className={`group relative bg-gradient-to-br ${gradient} rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left flex flex-col h-56 overflow-hidden border border-white/20`}
                                            >
                                                {/* Trang trí nền góc phải */}
                                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full group-hover:scale-[2] transition-transform duration-700 blur-2xl pointer-events-none"></div>
                                                
                                                <div className="relative z-10 flex-1">
                                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-slate-800 transition-colors duration-300 shadow-inner border border-white/30">
                                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                                    </div>
                                                    <h3 className="font-bold text-white text-xl leading-tight drop-shadow-md line-clamp-3">
                                                        {doc.name.replace('.pdf', '').replace(/_/g, ' ')}
                                                    </h3>
                                                </div>
                                                
                                                <div className="relative z-10 flex items-center gap-2 text-sm font-black text-white/80 group-hover:text-white mt-4 transition-colors">
                                                    <span>Bấm để học ngay</span>
                                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Khi đã chọn tài liệu (Hiển thị PDF Full màn hình)
    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex-1 bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-200 overflow-hidden flex flex-col">
                
                {/* Thanh Header của Trình đọc PDF */}
                <div className="bg-slate-50/90 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 truncate">
                        <button 
                            onClick={() => setSelectedDoc(null)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Quay lại
                        </button>
                        <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
                        <h3 className="font-bold text-slate-800 text-sm truncate">
                            {selectedDoc.name.replace(/_/g, ' ')}
                        </h3>
                    </div>

                    <a href={selectedDoc.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-2 shrink-0 ml-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        Mở tab mới
                    </a>
                </div>

                {/* Khung Iframe PDF */}
                <iframe 
                    src={`${selectedDoc.url}#toolbar=1&navpanes=0&scrollbar=1`} 
                    className="w-full flex-1 border-0 bg-[#323639]"
                    title="PDF Viewer"
                />
            </div>
        </div>
    );
}
