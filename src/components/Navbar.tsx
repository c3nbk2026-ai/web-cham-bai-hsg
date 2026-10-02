"use client";
import Link from 'next/link';
import { useMode } from './ModeContext';

export default function Navbar() {
    const { mode, setMode } = useMode();

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
                {/* Mode Toggle Switch */}
                <div className="flex items-center bg-slate-200/50 rounded-xl p-1 shadow-inner border border-slate-200 mr-2">
                    <button 
                        onClick={() => setMode('DAI_TRA')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'DAI_TRA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Đại Trà
                    </button>
                    <button 
                        onClick={() => setMode('DOI_TUYEN')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'DOI_TUYEN' ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Đội Tuyển 🏆
                    </button>
                </div>

                <nav className="flex items-center gap-2 sm:gap-4">
                  <Link href="/" className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                    Chấm Code
                  </Link>
                  <a href="/tu-hoc" className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                    Tự Học
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </header>
    );
}
