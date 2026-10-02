"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useMode } from './ModeContext';

export default function Navbar() {
    const { mode, setMode } = useMode();
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (showHistory) {
            const h = JSON.parse(localStorage.getItem('submissionHistory') || '[]');
            setHistory(h);
        }
    }, [showHistory]);

    return (
        <header className="bg-white/70 backdrop-blur-2xl border-b border-white/50 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-colors ${mode === 'DOI_TUYEN' ? 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-rose-500/30' : 'bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-indigo-500/30'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div className={`font-black text-xl tracking-tight text-transparent bg-clip-text hidden sm:block ${mode === 'DOI_TUYEN' ? 'bg-gradient-to-r from-rose-600 to-amber-600' : 'bg-gradient-to-r from-indigo-600 to-cyan-600'}`}>
                  ProCoder VIP
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-200/50 rounded-xl p-1 shadow-inner border border-slate-200 mr-2">
                    <button 
                        onClick={() => setMode('DAI_TRA')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'DAI_TRA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Cơ Bản
                    </button>
                    <button 
                        onClick={() => setMode('DOI_TUYEN')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'DOI_TUYEN' ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Nâng Cao 🚀
                    </button>
                </div>

                <nav className="flex items-center gap-2 sm:gap-4">
                  <Link href="/" className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                    Chấm Code
                  </Link>
                  <a href="/tu-hoc" onClick={(e) => { 
                      if (window.location.pathname === '/tu-hoc') {
                          e.preventDefault();
                          window.dispatchEvent(new Event('resetTuHoc'));
                      }
                  }} className="cursor-pointer px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                    Tự Học
                  </a>
                  <button onClick={() => setShowHistory(true)} className="hidden sm:inline-flex px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm font-bold shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform">
                    Lịch sử nộp bài
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* History Modal */}
          {showHistory && (
              <div 
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => setShowHistory(false)}
              >
                  <div 
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="font-bold text-lg text-slate-800">Lịch sử chấm bài (Gần đây)</h3>
                          <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-rose-500">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                      </div>
                      <div className="p-6 overflow-y-auto flex-1">
                          {history.length === 0 ? (
                              <p className="text-center text-slate-500 italic py-10">Bạn chưa nộp bài nào trên trình duyệt này.</p>
                          ) : (
                              <div className="space-y-4">
                                  {history.map((item, idx) => (
                                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                          <div className="flex justify-between items-center mb-2">
                                              <div className="font-bold text-indigo-700">{item.problem}</div>
                                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.score === item.maxScore ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                  {item.score} / {item.maxScore} điểm
                                              </div>
                                          </div>
                                          <div className="text-xs text-slate-500 mb-2">{item.date} • {item.week}</div>
                                          <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto">
                                              {item.code}
                                          </pre>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}
        </header>
    );
}
