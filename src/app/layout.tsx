import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ModeProvider } from "@/components/ModeContext";

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

        <ModeProvider>
            <Navbar />
            {/* Main Content */}
            <main className="flex-1 relative z-10">
                {children}
            </main>
        </ModeProvider>

      </body>
    </html>
  );
}
