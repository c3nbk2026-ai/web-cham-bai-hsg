"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

export default function ExamRoom() {
  const [structure, setStructure] = useState<any>({});
  const [className, setClassName] = useState("10A1");
  const [testFolder, setTestFolder] = useState("");
  const [problem, setProblem] = useState(""); // Lưu tên file đầy đủ (VD: BAI1.pdf, BAI1.docx)
  const [code, setCode] = useState("# Viết code tại đây\n");
  
  // Terminal I/O states
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("");
  const [isOutputError, setIsOutputError] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  }, [isExamStarted, isFinished, problem, code, stdout]);

  const drawExam = () => {
      let allProblems: {folder: string, problem: string}[] = [];
      Object.keys(structure).forEach(folder => {
          if(folder.startsWith('DE_') && structure[folder]["DE_THI"]) {
              structure[folder]["DE_THI"].forEach((p: string) => allProblems.push({folder, problem: p}));
          }
      });
      
      if (allProblems.length === 0) return alert("Hệ thống chưa tìm thấy bài thi nào! Hãy đảm bảo bạn đã copy file .pdf hoặc .docx vào thư mục data/DE_KTGK/");
      
      const randomProblem = allProblems[Math.floor(Math.random() * allProblems.length)];
      setProblem(randomProblem.problem);
      setTestFolder(randomProblem.folder); // VD: DE_KTGK
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

  // CHẠY CODE VỚI INPUT/OUTPUT TỰ DO (Bắt lỗi để không mất Output)
  const runCode = async () => {
      if (!code.trim()) return;
      setIsLoading(true);
      setIsOutputError(false);
      setStdout("Đang chạy code...");
      
      try {
          const py = await initPyodide();
          if (!py) throw new Error("Chưa tải được trình biên dịch Python.");

          py.globals.set("custom_input_data", stdin);
          py.globals.set("student_code", code);
          
          await py.runPythonAsync(`
import sys
import io
import traceback
sys.stdin = io.StringIO(custom_input_data)
sys.stdout = io.StringIO()
          `);

          // Chạy code trong block try-except của Python để bắt lỗi mà không làm mất STDOUT trước đó
          await py.runPythonAsync(`
try:
    exec(student_code, {})
except Exception as e:
    print("\\n--- CHƯƠNG TRÌNH DỪNG ĐỘT NGỘT DO LỖI ---")
    traceback.print_exc(file=sys.stdout)
          `);

          const actualOut = await py.runPythonAsync("sys.stdout.getvalue()");
          
          if (actualOut.includes("--- CHƯƠNG TRÌNH DỪNG ĐỘT NGỘT DO LỖI ---")) {
              setIsOutputError(true);
          }
          
          setStdout(actualOut || "<Chương trình không in ra kết quả nào>");
      } catch(e: any) {
          setIsOutputError(true);
          setStdout("LỖI HỆ THỐNG:\n" + e.toString());
      } finally {
          setIsLoading(false);
      }
  };

  // NỘP BÀI THỦ CÔNG
  const submitCode = async (isAutoSubmit = false) => {
    if (!problem) return;
    
    let totalQuestions = "N/A";
    if (!isAutoSubmit) {
        if (!confirm("Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ KHÔNG THỂ sửa lại!")) return;
        const userInput = prompt("Vui lòng nhập TỔNG SỐ CÂU HỎI có trong đề này (để giáo viên tính tỷ lệ điểm, ví dụ: 5):", "5");
        if (userInput !== null && userInput.trim() !== "") {
            totalQuestions = userInput.trim();
        }
    }

    setIsSubmitting(true);
    setIsFinished(true);
    
    // Lưu lại toàn bộ Code + Output vào Sheet để giáo viên tiện chấm điểm từng phần
    const fullSubmission = `--- MÃ NGUỒN ---
${code}

--- KẾT QUẢ CHẠY (STDOUT) ---
${stdout}`;

    try {
      // Gửi bài lên Google Sheets
      let retries = 3;
      while(retries > 0) {
          try {
              const res = await fetch('/api/sheets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      studentName,
                      mode: 'DE_THI',
                      week: className, // Gửi tên LỚP vào cột TUẦN
                      category: 'DE_THI',
                      problem: problem.replace(/\.[^/.]+$/, ""), // Bỏ đuôi mở rộng khi gửi
                      score: "Chờ chấm", // Không tự động chấm nữa
                      maxScore: totalQuestions, // Gửi tổng số câu hỏi vào đây
                      errorMsg: `Vi phạm: ${violationCount} lần. Học sinh tự nộp bài.`,
                      code: fullSubmission
                  })
              });
              if(res.ok) {
                  alert("Đã nộp bài thành công!");
                  break;
              }
          } catch(e) {
              retries--;
              if(retries === 0) alert("Mạng yếu! Kết quả của bạn chưa được gửi về máy chủ. Vui lòng copy code ra file .txt nộp cho Giám thị.");
              await new Promise(r => setTimeout(r, 2000));
          }
      }
    } catch (e: any) {
      alert("Lỗi khi nộp bài: " + e.message);
    } finally {
      setIsSubmitting(false);
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

  // Khởi tạo URL viewer cho Iframe
  let viewerUrl = "";
  if (problem) {
      if (problem.toLowerCase().endsWith('.docx')) {
          // Dùng Office Viewer của Microsoft (Yêu cầu URL tuyệt đối của web đã publish)
          const absoluteUrl = `${window.location.origin}/data/${testFolder}/${problem}`;
          viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
      } else {
          // Mặc định là PDF
          viewerUrl = `/data/${testFolder}/${problem}#toolbar=0&navpanes=0`;
      }
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
                    Bài: {problem.replace(/\.[^/.]+$/, "")}
                </div>
                {violationCount > 0 && (
                    <div className="px-4 py-2 bg-rose-500/20 text-rose-400 font-bold rounded-xl border border-rose-500/30 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Vi phạm: {violationCount} lần
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className={`text-3xl font-mono font-black mr-4 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
                    {formatTime(timeLeft)}
                </div>
                <button 
                    onClick={runCode}
                    disabled={isLoading || isFinished}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900 transition-all disabled:opacity-50">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {isLoading ? 'ĐANG CHẠY...' : 'CHẠY CODE'}
                </button>
                <button 
                    onClick={() => submitCode(false)} 
                    disabled={isSubmitting || isFinished}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-900 transition-all disabled:opacity-50">
                  {isSubmitting ? 'ĐANG NỘP...' : (isFinished ? 'ĐÃ NỘP BÀI' : 'NỘP BÀI')}
                </button>
            </div>
        </div>

        {/* Main Workspace: Left (PDF/DOCX) and Right (Editor + IO) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            
            {/* Left: Problem Viewer */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Nội dung Đề Thi
                    </span>
                </div>
                {/* Iframe thông minh hỗ trợ cả PDF và DOCX (qua Microsoft Viewer) */}
                <iframe 
                    src={viewerUrl} 
                    className="w-full flex-1 border-0 bg-white"
                    title="Nội dung đề thi"
                />
            </div>

            {/* Right: Editor & IO */}
            <div className="flex flex-col gap-4 min-h-0">
                {/* Editor */}
                <div className="flex-[3] bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
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

                {/* IO Terminal */}
                <div className="flex-[2] flex gap-4 min-h-0">
                    {/* Standard Input */}
                    <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>Dữ liệu nhập (STDIN)</span>
                        </div>
                        <textarea 
                            className="w-full flex-1 p-4 bg-slate-900/50 text-slate-300 font-mono text-sm focus:outline-none resize-none" 
                            spellCheck="false"
                            placeholder="Nhập dữ liệu đầu vào cho chương trình ở đây..."
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            disabled={isFinished}
                        />
                    </div>
                    
                    {/* Standard Output */}
                    <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>Kết quả xuất (STDOUT)</span>
                        </div>
                        <textarea 
                            className={`w-full flex-1 p-4 font-mono text-sm focus:outline-none resize-none ${isOutputError ? 'bg-rose-900/20 text-rose-400' : 'bg-slate-900/50 text-emerald-400'}`} 
                            spellCheck="false"
                            readOnly
                            placeholder="Kết quả chương trình sẽ hiển thị ở đây sau khi bạn bấm Chạy Code..."
                            value={stdout}
                        />
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}
