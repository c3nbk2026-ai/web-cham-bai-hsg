"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import Script from "next/script";

// Kiểu dữ liệu đề thi từ API
interface ExamItem {
  file: string;        // "1.docx"
  deFolderName: string; // "De01"
  problemName: string;  // "DIEM"
}

export default function ExamRoom() {
  const [structure, setStructure] = useState<any>({});
  const [className, setClassName] = useState("10A1");
  const [testFolder, setTestFolder] = useState("");
  const [examItem, setExamItem] = useState<ExamItem | null>(null);
  const [code, setCode] = useState("# Viết code tại đây\n");
  const [stdin, setStdin] = useState("");
  const [stdout, setStdout] = useState("");
  const [isOutputError, setIsOutputError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [studentClass, setStudentClass] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentsData, setStudentsData] = useState<Record<string, string[]>>({});
  const [isStudentLocked, setIsStudentLocked] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [violationCount, setViolationCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<any>(null);
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  
  // Security Layer States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [examConfig, setExamConfig] = useState<any>({});

  const handleAuth = async () => {
    if (!roomCodeInput) return setAuthError("Vui lòng nhập Mã Phòng Thi!");
    setIsCheckingCode(true);
    setAuthError("");
    try {
        const res = await fetch("/api/exam-config?t=" + Date.now());
        const data = await res.json();
        if (data.error) {
            setAuthError("Lỗi: " + data.error);
        } else {
            const cleanInput = (roomCodeInput || "").trim().toUpperCase();
            const cleanTarget = (data["MaPhongThi"] || "").trim().toUpperCase();
            if (cleanTarget && cleanInput === cleanTarget) {
                setExamConfig(data);
                if (data["ThoiGianThi"]) {
                    setTimeLeft(parseInt(data["ThoiGianThi"]) * 60);
                }
                if (data["LopDangThi"]) {
                    setClassName(data["LopDangThi"]);
                }
                setIsAuthorized(true);
            } else {
                setAuthError("Mã Phòng Thi không đúng!");
            }
        }
    } catch(e: any) {
        setAuthError("Lỗi kết nối máy chủ!");
    }
    setIsCheckingCode(false);
  };


  const classes = ["10A1","10A2","10A3","10A4","10A5","10A6","10A7","10A8","10A9","10A10"];

  useEffect(() => {
    // 1. Khôi phục trạng thái đã nộp từ localStorage để chống F5
    try {
      const savedSub = typeof window !== 'undefined' ? localStorage.getItem("exam_completed_submission") : null;
      if (savedSub) {
        const parsed = JSON.parse(savedSub);
        if (parsed && parsed.studentName) {
          setSubmissionSuccessData(parsed);
          setStudentName(parsed.studentName);
          if (parsed.className) setClassName(parsed.className);
          setIsAuthorized(true);
          setIsExamStarted(true);
          setIsFinished(true);
          return;
        }
      }
    } catch(e) {}

    fetch("/api/tests").then(r => r.json()).then(setStructure);
    
    const params = new URLSearchParams(window.location.search);
    const studentParam = params.get('student');
    const classParam = params.get('class');
    if (studentParam) { setStudentName(studentParam); setIsStudentLocked(true); }
    if (classParam) { setClassName(classParam); }

    fetch("/api/students?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.error) {
            console.error("Lỗi từ Google Sheets:", data.error);
            setStudentsData({"LỖI: Chưa cấp quyền": ["Vui lòng Share file cho email Bot"]});
            setStudentClass("LỖI: Chưa cấp quyền");
            setStudentName("Vui lòng Share file cho email Bot");
            return;
        }
        setStudentsData(data);
        const classes = Object.keys(data).sort();
        if (classes.length > 0) {
          if (classParam && data[classParam]) {
            setClassName(classParam);
            if (!studentParam && data[classParam].length > 0) {
              setStudentName(data[classParam][0]);
            }
          } else {
            setClassName(classes[0]);
            if (!studentParam && data[classes[0]].length > 0) {
              setStudentName(data[classes[0]][0]);
            }
          }
        }
        if (studentParam) {
          setStudentName(studentParam);
          setIsStudentLocked(true);
        }
      })
      .catch(() => console.log("Lỗi tải danh sách học sinh"));
  }, []);

  const findExamByProblemName = (pName: string) => {
    if (!pName) return null;
    const clean = pName.trim().toUpperCase();
    for (const folder of Object.keys(structure)) {
      if (Array.isArray(structure[folder]["DE_THI"])) {
        const found = structure[folder]["DE_THI"].find((it: ExamItem) => it.problemName.toUpperCase() === clean);
        if (found) return { folder, item: found };
      }
    }
    return null;
  };

  const checkStudentSubmissionStatus = async (targetStudent: string, targetClass: string) => {
    // 1. Kiểm tra máy tính này đã dùng nộp bài cho học sinh khác chưa (chống thi giùm trên cùng máy)
    try {
      const deviceStudent = localStorage.getItem("exam_device_locked_student");
      if (deviceStudent && deviceStudent.trim().toLowerCase() !== targetStudent.trim().toLowerCase()) {
        alert(`CẢNH BÁO: Máy tính này đã được dùng để thi bài cho học sinh "${deviceStudent}". Mỗi học sinh chỉ được làm bài trên máy của mình. Tuyệt đối không được thi giùm bạn!`);
        return { blocked: true, reason: "DEVICE_LOCKED" };
      }
    } catch (e) {}

    // 2. Tra cứu tab DanhSachHS (cột F: MaDe) để kiểm tra lệnh mở khóa của Giáo viên
    let assignInfo = { found: false, assignedExam: null as string | null, rowIndex: 0 };
    try {
      const resAssign = await fetch(`/api/exam-assign?studentName=${encodeURIComponent(targetStudent)}&className=${encodeURIComponent(targetClass)}&t=${Date.now()}`);
      const assignData = await resAssign.json();
      if (assignData.found) {
        assignInfo = assignData;
      }
    } catch(err) {
      console.error("Lỗi kiểm tra mã đề trên DanhSachHS:", err);
    }

    // NẾU GIÁO VIÊN ĐÃ XÓA MÃ ĐỀ Ở CỘT F TRÊN TAB DanhSachHS -> MỞ KHÓA CHO PHÉP THI LẠI!
    if (assignInfo.found && !assignInfo.assignedExam) {
      try {
        localStorage.removeItem("exam_completed_submission");
        localStorage.removeItem("exam_device_locked_student");
        localStorage.removeItem(getAssignedExamKey(targetClass, targetStudent));
      } catch(e) {}
      setSubmissionSuccessData(null);
      return { blocked: false, isUnlocked: true, rowIndex: assignInfo.rowIndex };
    }

    // 3. Nếu cột MaDe trên sheet vẫn còn -> Kiểm tra xem đã nộp bài trên sheet DiemThucHanh chưa
    try {
      const res = await fetch(`/api/sheets?studentName=${encodeURIComponent(targetStudent)}&className=${encodeURIComponent(targetClass)}&t=${Date.now()}`);
      const result = await res.json();
      if (result.submitted && result.data) {
        const d = result.data;
        alert(`CẢNH BÁO: Học sinh "${targetStudent}" (${targetClass}) ĐÃ NỘP BÀI THI vào lúc ${d.timestamp} (Đạt ${d.score}/3.0 điểm).\n\n(Nếu cần thi lại, vui lòng báo Giáo viên xóa ô Mã Đề tại cột F trong Google Sheet để mở khóa!)`);
        const subData = {
          score: d.score,
          maxScore: "3.0",
          problem: d.problem,
          passed: `${d.score}/3.0`,
          totalTests: 3,
          submittedAt: d.timestamp,
          studentName: targetStudent,
          className: targetClass
        };
        setSubmissionSuccessData(subData);
        try {
          localStorage.setItem("exam_completed_submission", JSON.stringify(subData));
          localStorage.setItem("exam_device_locked_student", targetStudent);
        } catch(e) {}
        return { blocked: true, reason: "ALREADY_SUBMITTED" };
      }
    } catch (err) {
      console.error("Lỗi tra cứu bài nộp:", err);
    }

    return { blocked: false, assignedExam: assignInfo.assignedExam, rowIndex: assignInfo.rowIndex };
  };

  useEffect(() => {
    if (!isExamStarted || isFinished) return;
    const handleVisibility = () => {
      if (document.hidden) { setViolationCount(c => c + 1); alert("CANH BAO GIAN LAN: Ban vua chuyen tab! Vi pham da duoc ghi lai."); }
    };
    const handleFullscreen = () => {
      if (!document.fullscreenElement) { setViolationCount(c => c + 1); alert("CANH BAO GIAN LAN: Ban vua thoat toan man hinh! Vi pham da duoc ghi lai."); }
    };
    const handleContext = (e: Event) => e.preventDefault();
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
        if (prev <= 1) { clearInterval(timer); alert("HET GIO! He thong tu dong thu bai."); submitCode(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamStarted, isFinished]);

  const getAssignedExamKey = (cls: string, name: string) => "assigned_exam_" + (cls || "").trim() + "_" + (name || "").trim().toLowerCase();

  // Tự động khôi phục đề thi đã bốc khi học sinh chọn lại tên hoặc F5 trang
  useEffect(() => {
    if (!className || !studentName) return;
    try {
      const savedExamStr = localStorage.getItem(getAssignedExamKey(className, studentName));
      if (savedExamStr) {
        const savedExam = JSON.parse(savedExamStr);
        if (savedExam && savedExam.item) {
          setExamItem(savedExam.item);
          setTestFolder(savedExam.folder);
          setHasDrawn(true);
          return;
        }
      }
    } catch(e) {}
    setHasDrawn(false);
    setExamItem(null);
  }, [className, studentName]);

  const drawExam = async () => {
    if (!studentName) return alert("Vui lòng chọn tên học sinh!");
    setIsCheckingStudent(true);
    const check = await checkStudentSubmissionStatus(studentName, className);
    setIsCheckingStudent(false);
    if (check.blocked) return;

    // 1. Nếu trên Google Sheet (cột F) ĐÃ CÓ MÃ ĐỀ: Cố định mã đề đó cho học sinh!
    if (check.assignedExam) {
      const found = findExamByProblemName(check.assignedExam);
      if (found) {
        setExamItem(found.item);
        setTestFolder(found.folder);
        setHasDrawn(true);
        alert(`Hệ thống ghi nhận bạn đã được giao bài: "${found.item.problemName}" (Đã lưu cố định trên Google Sheet).\nKhông thể đổi đề bằng cách tải lại trang!`);
        return;
      }
    }

    // 2. Nếu cột F trên Google Sheet ĐANG TRỐNG (chưa bốc lần nào hoặc vừa được Giáo viên xóa ô MaDe để mở khóa):
    let all: {folder: string, item: ExamItem}[] = [];
    const requiredTopic = examConfig["Chủ đề"];
    
    Object.keys(structure).forEach(folder => {
      let isMatch = false;
      if (requiredTopic) {
         isMatch = folder.includes(requiredTopic);
      } else {
         isMatch = folder.startsWith('DE_');
      }
      
      if (isMatch && Array.isArray(structure[folder]["DE_THI"])) {
        structure[folder]["DE_THI"].forEach((item: ExamItem) => all.push({folder, item}));
      }
    });
    
    if (all.length === 0) return alert(`Không tìm thấy bài thi nào ${requiredTopic ? 'cho chủ đề ' + requiredTopic : ''}!`);
    const r = all[Math.floor(Math.random() * all.length)];
    setExamItem(r.item); 
    setTestFolder(r.folder); 
    setHasDrawn(true);

    // Tự động đồng bộ mã đề vừa bốc lên cột F tab DanhSachHS trên Google Sheet của Giáo viên!
    fetch('/api/exam-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        className,
        examName: r.item.problemName,
        rowIndex: check.rowIndex
      })
    }).catch(err => console.error("Lỗi đồng bộ mã đề lên Google Sheet:", err));

    // Lưu dự phòng vào localStorage
    try {
      localStorage.setItem(getAssignedExamKey(className, studentName), JSON.stringify({ item: r.item, folder: r.folder }));
      localStorage.setItem("exam_device_locked_student", studentName);
    } catch(e) {}
  };

  const startExam = async () => {
    if (!studentName) return alert("Vui lòng chọn tên học sinh!");
    if (!examItem) return alert("Vui lòng bốc thăm đề thi trước!");
    setIsCheckingStudent(true);
    const check = await checkStudentSubmissionStatus(studentName, className);
    setIsCheckingStudent(false);
    if (check.blocked) return;

    document.documentElement.requestFullscreen().then(() => setIsExamStarted(true)).catch(() => setIsExamStarted(true));
  };

  const initPyodide = async () => {
    if (pyodide) return pyodide;
    if (!(window as any).loadPyodide) return null;
    const py = await (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
    setPyodide(py); return py;
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setIsLoading(true); setIsOutputError(false); setStdout("Dang chay code...");
    try {
      const py = await initPyodide();
      if (!py) throw new Error("Chua tai duoc Python.");
      py.globals.set("custom_input_data", stdin);
      py.globals.set("student_code", code);
      await py.runPythonAsync("import sys, io, traceback\nsys.stdin = io.StringIO(custom_input_data)\nsys.stdout = io.StringIO()");
      await py.runPythonAsync("try:\n    exec(student_code, {})\nexcept Exception as e:\n    print('\\n--- CHUONG TRINH BI LOI ---')\n    traceback.print_exc(file=sys.stdout)");
      const out = await py.runPythonAsync("sys.stdout.getvalue()");
      if (out.includes("--- CHUONG TRINH BI LOI ---")) setIsOutputError(true);
      setStdout(out || "<Chuong trinh khong in ra ket qua nao>");
    } catch(e: any) { setIsOutputError(true); setStdout("LOI HE THONG:\n" + e.toString()); }
    finally { setIsLoading(false); }
  };

  const tryFetch = async (url: string) => {
    try { const r = await fetch(url); if (r.ok) return await r.text(); } catch(e: any) {}
    return null;
  };

  const getPyodideWithTimeout = async (timeoutMs = 8000) => {
    try {
      return await Promise.race([
        initPyodide(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
      ]);
    } catch(e) {
      return null;
    }
  };

  const submitCode = async (isAutoSubmit = false) => {
    if (!examItem) return;
    if (!isAutoSubmit && !confirm("Bạn có chắc chắn muốn nộp bài? Hệ thống sẽ tự động chấm điểm và bạn KHÔNG THỂ sửa lại!")) return;
    setIsSubmitting(true); setIsFinished(true);

    const { deFolderName, problemName } = examItem;
    // Tìm test cases: /data/DE_KTGK/Test_Case/De01/Test01/DIEM.INP
    const testCaseBase = "/data/" + testFolder + "/Test_Case/" + deFolderName;
    
    const testCases = [];
    for (let i = 1; i <= 20; i++) {
      const pad = i.toString().padStart(2, "0");
      const base = testCaseBase + "/Test" + pad + "/" + problemName;
      const inp = await tryFetch(base + ".INP") ?? await tryFetch(base + ".inp");
      const out = await tryFetch(base + ".OUT") ?? await tryFetch(base + ".out");
      if (inp === null || out === null) break;
      testCases.push({ name: "Test" + pad, inp, out: out.trim() });
    }

    let finalScore = "Cho cham";
    let finalMax = "N/A";
    let finalMsg = "Vi pham: " + violationCount + " lan.";

    if (testCases.length > 0) {
      let passed = 0;
      try {
        const py = await getPyodideWithTimeout(8000);
        if (py) {
          for (const t of testCases) {
            try {
              let smartInp = t.inp;
              if (!code.includes('split(') && !code.includes('split()') && !code.includes('sys.stdin.read')) {
                  smartInp = (t.inp || "").trim().replace(/[ \t]+/g, '\n');
              }
              py.globals.set("test_input_data", smartInp);
              py.globals.set("student_code", code);

              const runPromise = (async () => {
                await py.runPythonAsync("import sys, io\nsys.stdin = io.StringIO(test_input_data)\nsys.stdout = io.StringIO()");
                await py.runPythonAsync("try:\n    exec(student_code, {})\nexcept:\n    pass");
                return await py.runPythonAsync("sys.stdout.getvalue()");
              })();

              // Mỗi test case tối đa 3 giây tránh treo nếu code học sinh lặp vô tận
              const actual = await Promise.race([
                runPromise,
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
              ]);

              const norm = (s: string) => (s || "").replace(/\r/g, "").split("\n").map((l: string) => l.trimEnd()).join("\n").trim();
              const extractNums = (s: string) => (s || "").match(/-?\d+(\.\d+)?/g) || [];
              const actualNums = extractNums(actual);
              const expectedNums = extractNums(t.out);
              const isSmartMatch = actualNums.length > 0 && actualNums.join(",") === expectedNums.join(",");

              if (norm(actual) === norm(t.out)) {
                passed++;
              } else if (isSmartMatch) {
                passed += 0.5; // Diem vot nếu sai định dạng nhưng đúng kết quả số
              }
            } catch(e: any) {}
          }
        }
      } catch(e: any) {}
      const scoreOnScale3 = (testCases.length > 0) ? (passed / testCases.length * 3).toFixed(1) : passed.toString();
      finalScore = scoreOnScale3;
      finalMax = "3";
      finalMsg += " (Tu dong cham: " + passed + "/" + testCases.length + " Test dung -> " + scoreOnScale3 + "/3.0 diem)";
    } else {
      finalMsg += " (Cham thu cong. Output: " + stdout.substring(0, 100).replace(/\n/g, " ") + ")";
    }

    const fullSub = "--- MA NGUON ---\n" + code + "\n\n--- KET QUA CHAY TAY ---\n" + stdout;
    let success = false;
    let lastError = "Lỗi mạng hoặc Server";

    for (let retries = 2; retries > 0; retries--) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch('/api/sheets', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ 
            studentName, 
            mode: 'DE_THI', 
            week: className, 
            category: 'DE_THI', 
            problem: problemName, 
            score: finalScore, 
            maxScore: finalMax, 
            errorMsg: finalMsg, 
            code: fullSub 
          })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          success = true;
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData.error || ("Lỗi HTTP " + res.status);
        }
      } catch(e: any) {
        lastError = e.name === 'AbortError' ? "Kết nối quá hạn (Timeout)" : e.message;
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!success) {
      alert("LỖI LƯU ĐIỂM LÊN MÁY CHỦ: " + lastError + "\n\nVui lòng báo Giám thị/Giáo viên để ghi nhận mã nguồn!");
    } else {
      const successObj = {
        score: finalScore,
        maxScore: finalMax,
        problem: problemName,
        passed: testCases.length > 0 ? (finalScore + "/3.0") : "Đã nộp",
        totalTests: testCases.length,
        submittedAt: new Date().toLocaleTimeString('vi-VN') + " - " + new Date().toLocaleDateString('vi-VN'),
        studentName,
        className
      };
      setSubmissionSuccessData(successObj);
      try {
        localStorage.setItem("exam_completed_submission", JSON.stringify(successObj));
        localStorage.setItem("exam_device_locked_student", studentName);
      } catch(e) {}
    }
    setIsSubmitting(false);
  };

  const formatTime = (s: number) => Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0');

  // MÀN HÌNH KHÓA CỨNG GIAO DIỆN SAU KHI NỘP BÀI THÀNH CÔNG
  if (submissionSuccessData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4 relative z-[999999] select-none">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>
          
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">ĐÃ NỘP BÀI THÀNH CÔNG!</h2>
          <div className="text-emerald-400 font-bold mb-6 flex items-center justify-center gap-2 bg-emerald-500/10 py-2 px-4 rounded-xl border border-emerald-500/20 max-w-fit mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            GIAO DIỆN PHÒNG THI ĐÃ ĐƯỢC KHÓA CỨNG
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 mb-6 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Học sinh:</span>
              <span className="font-bold text-white text-base">{submissionSuccessData.studentName || studentName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Lớp:</span>
              <span className="font-bold text-indigo-400">{submissionSuccessData.className || className}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Điểm Thực Hành:</span>
              <span className="font-bold text-emerald-400 text-lg">
                {submissionSuccessData.score} / 3.0 điểm
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
              <span className="text-slate-400 text-sm">Kết quả làm bài:</span>
              <span className="font-bold text-indigo-400">
                {submissionSuccessData.totalTests > 0 
                  ? `${submissionSuccessData.passed}/${submissionSuccessData.totalTests} Test đúng` 
                  : (submissionSuccessData.passed || 'Đã nộp bài')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Thời gian nộp:</span>
              <span className="font-mono text-slate-300 text-sm">{submissionSuccessData.submittedAt}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm leading-relaxed text-left">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <span>⚠️</span> LƯU Ý DÀNH CHO THÍ SINH:
            </div>
            Bài làm và kết quả của em đã được đồng bộ an toàn về máy chủ Google Sheets của giáo viên. Mọi thao tác chỉnh sửa đã bị khóa hoàn toàn. Em vui lòng giữ nguyên màn hình này và báo giám thị trước khi rời vị trí.
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button 
              onClick={() => {
                const code = prompt("DÀNH CHO GIÁM THỊ:\nNhập Mã Phòng Thi để mở khóa quyền thi lại trên máy này:");
                if (code && examConfig["MaPhongThi"] && code.trim().toUpperCase() === examConfig["MaPhongThi"].trim().toUpperCase()) {
                  try {
                    localStorage.removeItem("exam_completed_submission");
                    localStorage.removeItem("exam_device_locked_student");
                    localStorage.removeItem(getAssignedExamKey(className, studentName));
                  } catch(e) {}
                  setSubmissionSuccessData(null);
                  setIsExamStarted(false);
                  setIsFinished(false);
                  setHasDrawn(false);
                  setExamItem(null);
                  alert("Đã mở khóa phòng thi thành công!");
                } else if (code) {
                  alert("Mã Phòng Thi không đúng!");
                }
              }}
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors underline cursor-pointer"
            >
              Giám thị: Mở khóa quyền thi lại (cần Mã Phòng Thi)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500"></div>
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-center mb-2 tracking-tight text-white">LỚP BẢO MẬT</h2>
          <p className="text-slate-400 text-center mb-8">Vui lòng nhập Mã Phòng Thi do giáo viên cung cấp để truy cập.</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nhập mã phòng thi..." 
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500 uppercase shadow-inner"
            />
            
            {authError && <div className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{authError}</div>}
            
            <button 
              onClick={handleAuth}
              disabled={isCheckingCode}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-transform active:scale-95"
            >
              {isCheckingCode ? "ĐANG KIỂM TRA..." : "XÁC NHẬN VÀO PHÒNG"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isExamStarted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative z-[99999]">
      <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" />
      <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 text-rose-600">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Phong Thi Khep Kin</h1>
        <p className="text-slate-500 text-center text-sm font-medium mb-8">Moi hanh vi thoat toan man hinh hoac chuyen ung dung deu bi ghi lai va tru diem.</p>
        <div className="w-full space-y-4">
          <div className="flex gap-4 w-full">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CHỌN LỚP</label>
              {isStudentLocked ? (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between opacity-70">
                  <span>{className}</span>
                </div>
              ) : (
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={className} onChange={(e) => {
                  const newClass = e.target.value;
                  setClassName(newClass);
                  setHasDrawn(false);
                  if (studentsData[newClass] && studentsData[newClass].length > 0) {
                    setStudentName(studentsData[newClass][0]);
                  } else {
                    setStudentName("");
                  }
                }}>
                  {Object.keys(studentsData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">HỌC SINH</label>
              {isStudentLocked ? (
                <div className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 flex items-center justify-between">
                  <span>{studentName}</span>
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
              ) : (
                <>
                  {className && studentsData[className] && studentsData[className].length > 0 ? (
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none text-indigo-900 font-bold cursor-pointer shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)}>
                      {studentsData[className].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-indigo-900 font-semibold shadow-sm" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nhập tên..." />
                  )}
                </>
              )}
            </div>
          </div>
          {!hasDrawn ? (
            <button 
              onClick={drawExam} 
              disabled={isCheckingStudent}
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-95 text-lg flex justify-center items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              {isCheckingStudent ? "ĐANG KIỂM TRA BÀI THI..." : "BỐC THĂM ĐỀ THI"}
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4 text-center">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Đề thi của bạn:</div>
              <div className="text-2xl font-black text-emerald-700">{examItem?.problemName}</div>
              <div className="text-xs text-emerald-500 mt-1">{examItem?.file}</div>
              <button 
                onClick={startExam} 
                disabled={isCheckingStudent}
                className="w-full mt-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/30 transition-transform active:scale-95 text-lg"
              >
                {isCheckingStudent ? "ĐANG KIỂM TRA BÀI THI..." : "VÀO PHÒNG THI"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  let viewerUrl = "";
  if (examItem) {
    if (examItem.file.toLowerCase().endsWith('.docx')) {
      viewerUrl = "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(window.location.origin + "/data/" + testFolder + "/" + examItem.file) + "&wdZoom=110";
    } else {
      viewerUrl = "/data/" + testFolder + "/" + examItem.file + "#toolbar=0&navpanes=0&zoom=110";
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 p-4 font-sans text-white select-none relative z-[99999]">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4 h-[calc(100vh-2rem)]">
        <div className="bg-slate-800 rounded-2xl p-4 flex justify-between items-center border border-slate-700 shadow-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-indigo-500/20 text-indigo-300 font-bold rounded-xl border border-indigo-500/30">{studentName} - {className}</div>
            <div className="px-4 py-2 bg-slate-700/50 text-slate-300 font-bold font-mono rounded-xl border border-slate-600">Bài: {examItem?.problemName}</div>
            {violationCount > 0 && (
              <div className="px-4 py-2 bg-rose-500/20 text-rose-400 font-bold rounded-xl border border-rose-500/30 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Vi pham: {violationCount} lan
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className={"text-3xl font-mono font-black mr-4 " + (timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-emerald-400')}>{formatTime(timeLeft)}</div>
            <button onClick={runCode} disabled={isLoading || isFinished} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900 transition-all disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {isLoading ? 'Đang chạy...' : 'CHẠY CODE'}
            </button>
            <button onClick={() => submitCode(false)} disabled={isSubmitting || isFinished} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-900 transition-all disabled:opacity-50">
              {isSubmitting ? 'Đang chấm...' : (isFinished ? 'Đã nộp bài' : 'NỘP BÀI')}
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Code editor - full width, giảm kích thước vừa vặn cho bài làm ngắn */}
          <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl min-h-0">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 shrink-0">Trình soạn thảo Python (Pyodide)</div>
            <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 16,
                  wordWrap: 'on',
                  readOnly: isFinished,
                  scrollBeyondLastLine: false,
                  padding: { top: 16 }
                }}
              />
          </div>
          {/* Hàng dưới: Đề thi chiếm ưu thế không gian để đọc rõ ràng + STDIN + STDOUT */}
          <div className="flex-[2] flex gap-4 min-h-0">
            <div className="flex-[3] bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 flex items-center gap-2 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Nội dung Đề Thi — {examItem?.problemName}
              </div>
              <div className="w-full flex-1 relative overflow-hidden bg-white">
                <iframe src={viewerUrl} className="absolute top-0 left-[-15%] w-[130%] h-[calc(100%+38px)] border-0" title="Noi dung de thi" />
              </div>
            </div>
            <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 shrink-0">Dữ liệu nhập (STDIN)</div>
              <textarea className="w-full flex-1 p-4 bg-slate-900/50 text-slate-300 font-mono text-sm focus:outline-none resize-none" spellCheck={false} placeholder="Nhập dữ liệu đầu vào để thử..." value={stdin} onChange={e => setStdin(e.target.value)} disabled={isFinished} />
            </div>
            <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-400 shrink-0">Kết quả xuất (STDOUT)</div>
              <textarea className={"w-full flex-1 p-4 font-mono text-sm focus:outline-none resize-none " + (isOutputError ? 'bg-rose-900/20 text-rose-400' : 'bg-slate-900/50 text-emerald-400')} spellCheck={false} readOnly placeholder="Kết quả sẽ hiển thị ở đây sau khi bấm Chạy Code..." value={stdout} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
