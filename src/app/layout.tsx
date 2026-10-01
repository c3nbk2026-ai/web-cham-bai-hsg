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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen flex flex-col`}>
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div className="font-black text-xl tracking-tight text-slate-800">
                  ProCoder<span className="text-indigo-600">VIP</span>
                </div>
              </div>

              <nav className="flex items-center gap-6">
                <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                  Trình Chấm Code
                </Link>
                <Link href="/tu-hoc" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                  Tài Liệu Tự Học
                </Link>
                <a href="#" className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100 transition-colors">
                  Đăng nhập
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
