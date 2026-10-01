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
        return (
            <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 min-h-[calc(100vh-64px)]">
                <div className="mb-10 text-center space-y-3">
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">
                        Thư Viện Bài Giảng
                    </h1>
                    <p className="text-slate-500 font-medium">Chọn một bài học dưới đây để bắt đầu hành trình chinh phục Tin học</p>
                </div>

                <div className="space-y-12">
                    {Object.keys(docsTree).sort().map(week => (
                        <div key={week} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{week}</h2>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            
                            {docsTree[week].length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                    <p className="text-slate-400 italic">Tuần này chưa có tài liệu, bạn quay lại sau nhé!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {docsTree[week].map((doc: any) => (
                                        <button
                                            key={doc.url}
                                            onClick={() => setSelectedDoc(doc)}
                                            className="group relative bg-white rounded-3xl p-6 border border-slate-200 shadow-md shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1.5 transition-all duration-300 text-left flex flex-col h-48 overflow-hidden"
                                        >
                                            {/* Trang trí nền góc phải */}
                                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-full group-hover:scale-150 transition-transform duration-500 -z-0"></div>
                                            
                                            <div className="relative z-10 flex-1">
                                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                                </div>
                                                <h3 className="font-bold text-slate-700 text-lg leading-snug group-hover:text-indigo-700 line-clamp-2">
                                                    {doc.name.replace('.pdf', '').replace(/_/g, ' ')}
                                                </h3>
                                            </div>
                                            
                                            <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-indigo-500 mt-4 transition-colors">
                                                <span>Bấm để đọc</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                            </div>
                                        </button>
                                    ))}
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
