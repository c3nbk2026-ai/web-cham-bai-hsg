"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

export default function ExamRoom() {
  const [structure, setStructure] = useState<any>({});
  const [className, setClassName] = useState("10A1");
  const [testFolder, setTestFolder] = useState("");
  const [problem, setProblem] = useState("");
  const [code, setCode] = useState("# Viết code tại đây\n");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  
  const [studentName, setStudentName] = useState("");
  const [students, setStudents] = useState<string[]>([]);
  const [isStudentLocked, setIsStudentLocked] = useState(false);
  
  // Exam states
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [violationCount, setViolationCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const classes = ["10A1", "10A2", "10A3", "10A4", "10A5", "10A6", "10A7", "10A8", "10A9", "10A10"];

  useEffect(() => {
    fetch("/api/tests")
      .then((res) => res.json())
      .then((data) => {
        setStructure(data);
      });

    fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
          setStudents(data);
          if (data.length > 0 && !isStudentLocked) setStudentName(data[0]);
      })
      .catch(() => console.log("Không tìm thấy file danh sách học sinh"));
      
    // Đọc tên học sinh từ URL (tinhoc1026 truyền sang)
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student');
    if (studentParam) {
        setStudentName(studentParam);
        setIsStudentLocked(true);
    }
  }, []);

  // Anti-cheat & Timer
  useEffect(() => {
    if (!isExamStarted || isFinished) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setViolationCount(c => c + 1);
        alert("CẢNH BÁO GIAN LẬN: Bạn vừa chuyển tab hoặc thu nhỏ trình duyệt! Vi phạm đã được ghi lại.");
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        setViolationCount(c => c + 1);
        alert("CẢNH BÁO GIAN LẬN: Bạn vừa thoát toàn màn hình! Vui lòng quay lại chế độ toàn màn hình để làm bài.");
      }
    };

    const handleContext = (e: Event) => e.preventDefault(); // disable right click

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("contextmenu", handleContext);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("contextmenu", handleContext);
    };
  }, [isExamStarted, isFinished]);

  useEffect(() => {
    if (!isExamStarted || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("HẾT GIỜ! Hệ thống tự động thu bài.");
          submitCode(true); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, isFinished, problem, code]);

  const drawExam = () => {
      const examFolder = "NGAN_HANG_DE";
      const problems = structure[examFolder]?.["DE_THI"] || [];
      
      if (problems.length === 0) return alert("Hệ thống chưa tìm thấy bài thi nào! Vui lòng kiểm tra lại thư mục public/data/NGAN_HANG_DE/DE_THI/TestCases");
      
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      setProblem(randomProblem);
      setTestFolder(examFolder);
      setHasDrawn(true);
  };

  const startExam = () => {
    if (!studentName) return alert("Vui lòng nhập tên học sinh!");
    if (!problem) return alert("Vui lòng bốc thăm đề thi trước!");
    
    try {
        document.documentElement.requestFullscreen().then(() => {
            setIsExamStarted(true);
        }).catch(err => {
            alert("Lỗi: Không thể mở toàn màn hình. Vui lòng cho phép quyền toàn màn hình.");
        });
    } catch(e) {
        setIsExamStarted(true); // Fallback
    }
  };

  const initPyodide = async () => {
    if (pyodide) return pyodide;
    if (!(window as any).loadPyodide) return null;
    const py = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    });
    setPyodide(py);
    return py;
  };

  const getTestUrl = (testName: string, ext: string) => {
    const problemName = problem.replace("TEST_", "");
    return `/data/${testFolder}/DE_THI/TestCases/${problem}/${testName}/${problemName}.${ext}`;
  };

  const submitCode = async (isAutoSubmit = false) => {
    if (!problem) return;
    setIsLoading(true);
    setResults([]);

    try {
      const py = await initPyodide();
      if (!py) throw new Error("Chưa tải được trình biên dịch Python.");

      const testCases = [];
      const maxTests = 20; // Đề thi kiểm tra tối đa 20 test
      for (let i = 1; i <= maxTests; i++) {
        const testCaseFolder = `Test${i.toString().padStart(2, "0")}`;
        try {
          const inpRes = await fetch(getTestUrl(testCaseFolder, "INP"));
          const outRes = await fetch(getTestUrl(testCaseFolder, "OUT"));
          
          if (!inpRes.ok || !outRes.ok) break;
          
          testCases.push({
            name: testCaseFolder,
            inp: await inpRes.text(),
            out: (await outRes.text()).trim(),
          });
        } catch(e) {
          break;
        }
      }

      if (testCases.length === 0) {
        throw new Error("Không tìm thấy dữ liệu Test Case cho bài này.");
      }

      let passedCount = 0;
      const testResults = [];

      for (const t of testCases) {
        const pName = problem.replace("TEST_", "");
        
        try {
            py.globals.set("test_input_data", t.inp);
            await py.runPythonAsync(`
import sys
import io
sys.stdin = io.StringIO(test_input_data)
sys.stdout = io.StringIO()
            `);
            
            try { py.FS.writeFile(pName + ".INP", t.inp); } catch(e) {}
            try { py.FS.writeFile(pName + ".inp", t.inp); } catch(e) {}
            try { py.FS.writeFile(pName + ".OUT", ""); } catch(e) {}
            try { py.FS.writeFile(pName + ".out", ""); } catch(e) {}

            await py.runPythonAsync(code);

            let actualOut = "";
            try { actualOut = py.FS.readFile(pName + ".OUT", { encoding: "utf8" }).trim(); } catch(e) {}
            if (!actualOut) {
                try { actualOut = py.FS.readFile(pName + ".out", { encoding: "utf8" }).trim(); } catch(e) {}
            }
            if (!actualOut) {
                actualOut = await py.runPythonAsync("sys.stdout.getvalue().strip()");
            }
            
            const normalize = (s: string) => (s || "").replace(/\r/g, "").split("\n").map(l => l.trimEnd()).join("\n").trim();
            
            if (normalize(actualOut) === normalize(t.out)) {
                testResults.push({ name: t.name, status: "ĐÚNG", css: "bg-emerald-50 border-emerald-200 text-emerald-700" });
                passedCount++;
            } else {
                // EXAM MODE: Don't show the expected output to prevent reverse engineering!
                testResults.push({ name: t.name, status: "SAI", css: "bg-rose-50 border-rose-200 text-rose-700", expected: "---ẨN---", actual: actualOut });
            }
        } catch (e: any) {
            testResults.push({ name: t.name, status: "LỖI CHẠY CODE", css: "bg-amber-50 border-amber-200 text-amber-700", err: e.message });
        }
      }

      setResults(testResults);

      const firstError = testResults.find(r => r.err)?.err || (passedCount < testCases.length ? "Sai Logic / Không khớp Output" : "Hoàn hảo");

      // Auto Retry Fetch Logic
      let retries = 3;
      while(retries > 0) {
          try {
              const res = await fetch('/api/sheets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      studentName,
                      mode: 'DE_THI',
                      week: className, // Gửi tên LỚP vào cột TUẦN trên Google Sheet!
                      category: 'DE_THI',
                      problem,
                      score: passedCount,
                      maxScore: testCases.length,
                      errorMsg: `Vi phạm: ${violationCount} lần. Lỗi: ${firstError}`,
                      code: code
                  })
              });
              if(res.ok) break;
          } catch(e) {
              retries--;
              if(retries === 0) alert("Mạng yếu! Kết quả của bạn chưa được gửi về máy chủ. Vui lòng bấm Nộp lại hoặc copy code ra file .txt nộp cho Giám thị.");
              await new Promise(r => setTimeout(r, 2000));
          }
      }
      
      if (isAutoSubmit) {
          setIsFinished(true);
      }

    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isExamStarted) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative z-[99999]">
              <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" />
              <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center">
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 mb-2">Phòng Thi Khép Kín</h1>
                  <p className="text-slate-500 text-center text-sm font-medium mb-8">
                      Mọi hành vi thoát toàn màn hình hoặc chuyển sang ứng dụng khác đều sẽ bị ghi lại và trừ điểm.
                  </p>
                  
                  <div className="w-full space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên của bạn</label>
                          {isStudentLocked ? (
                              <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between">
                                  <span>{studentName}</span>
                                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                              </div>
                          ) : (
                              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700" value={studentName} onChange={e => setStudentName(e.target.value)}>
                                  {students.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chọn Lớp</label>
                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700" value={className} onChange={e => { setClassName(e.target.value); setHasDrawn(false); }}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {!hasDrawn ? (
                          <button onClick={drawExam} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-95 text-lg flex justify-center items-center gap-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                              BỐC THĂM ĐỀ THI
                          </button>
                      ) : (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4 text-center">
                              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Đề thi của bạn:</div>
                              <div className="text-xl font-black text-emerald-700">{problem}</div>
                              <button onClick={startExam} className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/30 transition-transform active:scale-95 text-lg">
                                  VÀO PHÒNG THI
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-4 font-sans text-white select-none relative z-[99999]">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4 h-[calc(100vh-2rem)]">
        
        {/* Top Header */}
        <div className="bg-slate-800 rounded-2xl p-4 flex justify-between items-center border border-slate-700 shadow-xl shrink-0">
            <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-indigo-500/20 text-indigo-300 font-bold rounded-xl border border-indigo-500/30">
                    {studentName} - {className}
                </div>
                <div className="px-4 py-2 bg-slate-700/50 text-slate-300 font-bold font-mono rounded-xl border border-slate-600">
                    Bài: {problem}
                </div>
                {violationCount > 0 && (
                    <div className="px-4 py-2 bg-rose-500/20 text-rose-400 font-bold rounded-xl border border-rose-500/30 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Vi phạm: {violationCount} lần
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div className={`text-3xl font-mono font-black ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                    {formatTime(timeLeft)}
                </div>
                <button 
                    onClick={() => submitCode(false)} 
                    disabled={isLoading || isFinished}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900 transition-all disabled:opacity-50">
                  {isLoading ? 'ĐANG CHẤM...' : (isFinished ? 'ĐÃ NỘP BÀI' : 'NỘP BÀI')}
                </button>
            </div>
        </div>

        {/* Main Workspace: Left (PDF) and Right (Editor + Results) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            
            {/* Left: Problem PDF Viewer */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Nội dung Đề Thi
                    </span>
                </div>
                {/* Quy ước: File PDF của đề thi được đặt trùng tên với bài toán (ví dụ: BAI1.pdf) và nằm trong thư mục DE_THI */}
                <iframe 
                    src={`/data/${testFolder}/DE_THI/${problem.replace("TEST_", "")}.pdf#toolbar=0&navpanes=0`} 
                    className="w-full flex-1 border-0 bg-white"
                    title="Nội dung đề thi"
                />
            </div>

            {/* Right: Editor & Results */}
            <div className="flex flex-col gap-4 min-h-0">
                {/* Editor */}
                <div className="flex-[2] bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>Trình soạn thảo Python (Pyodide)</span>
                    </div>
                    <textarea 
                    className="w-full flex-1 p-6 bg-[#1e1e1e] text-cyan-300 font-mono text-[16px] focus:outline-none resize-none leading-relaxed" 
                    spellCheck="false"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isFinished}
                    />
                </div>

                {/* Results */}
                <div className="flex-[1] bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-col overflow-hidden shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
                        Báo Cáo Test Cases
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {results.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-slate-500 font-medium italic">
                                Chưa có kết quả. Bấm Nộp bài để chấm điểm.
                            </div>
                        ) : (
                            results.map((res, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${res.status === 'ĐÚNG' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-900/20 border-rose-500/30 text-rose-400'} flex flex-col`}>
                                    <div className="font-bold flex items-center gap-2 text-sm mb-2">
                                        {res.name}: {res.status}
                                    </div>
                                    {res.status === 'SAI' && (
                                        <div className="text-xs bg-black/30 p-3 rounded-lg font-mono">
                                            <div className="opacity-70 mb-1">Output của bạn:</div>
                                            <div className="text-rose-300">{res.actual || "<trống>"}</div>
                                        </div>
                                    )}
                                    {res.err && <div className="text-xs font-mono bg-black/30 p-3 rounded-lg text-amber-400">{res.err}</div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}} />
    </main>
  );
}
