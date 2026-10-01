import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ProCoder VIP - Nền Tảng Thi Đua HSG",
  description: "Nền tảng thi đua HSG môn Tin học",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen flex flex-col selection:bg-indigo-500/20 relative overflow-x-hidden`}>
        
        {/* Colorful Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/20 blur-[120px]"></div>
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[50%] rounded-full bg-cyan-500/20 blur-[120px]"></div>
            <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] rounded-full bg-amber-500/20 blur-[120px]"></div>
        </div>

        {/* Navigation Bar */}
        <header className="bg-white/70 backdrop-blur-2xl border-b border-white/50 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div className="font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 hidden sm:block">
                  ProCoder VIP
                </div>
              </div>

              <nav className="flex items-center gap-2 sm:gap-6">
                <Link href="/" className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Trình Chấm Code
                </Link>
                <Link href="/tu-hoc" className="px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Tài Liệu Tự Học
                </Link>
                <a href="#" className="hidden sm:inline-flex px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm font-bold shadow-md shadow-indigo-500/20 hover:scale-105 transition-transform">
                  Học Sinh
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
