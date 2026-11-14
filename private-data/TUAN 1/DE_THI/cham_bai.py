import os
import subprocess
import time
import sys
import glob
import shutil

# --- CẤU HÌNH ---
TIME_LIMIT = 1.0 # Thời gian chạy tối đa cho mỗi test (giây)

# Tự động tìm thư mục TestCases nằm trong cùng cấp hoặc cấp con
current_dir = os.path.dirname(os.path.abspath(__file__))
TEST_CASES_DIR = None
for root, dirs, files in os.walk(current_dir):
    if "TestCases" in dirs:
        TEST_CASES_DIR = os.path.join(root, "TestCases")
        break

def compare_outputs(expected_file, actual_file):
    """Hàm so sánh file kết quả chuẩn và file của học sinh"""
    if not os.path.exists(actual_file):
        return False
    
    try:
        with open(expected_file, 'r', encoding='utf-8') as f1, open(actual_file, 'r', encoding='utf-8') as f2:
            # Tách dòng, cắt khoảng trắng thừa ở 2 đầu mỗi dòng và bỏ qua các dòng rỗng cuối file
            exp_lines = [l.strip() for l in f1.read().strip().split('\n')]
            act_lines = [l.strip() for l in f2.read().strip().split('\n')]
            
            if len(exp_lines) != len(act_lines):
                return False
                
            for e, a in zip(exp_lines, act_lines):
                if e != a:
                    return False
        return True
    except Exception:
        return False

def main():
    print("="*50)
    print(" HỆ THỐNG CHẤM BÀI TỰ ĐỘNG (MINI-THEMIS)".center(50))
    print("="*50)
    
    if not os.path.exists(TEST_CASES_DIR):
        print(f"[!] Lỗi: Không tìm thấy thư mục Test Cases: {TEST_CASES_DIR}")
        input("Nhấn Enter để thoát...")
        return

    # Xác định các bài toán (Dựa trên tên thư mục TEST_XYZ)
    problems = []
    for d in os.listdir(TEST_CASES_DIR):
        if d.startswith("TEST_"):
            problems.append(d.replace("TEST_", ""))
            
    if not problems:
        print("[!] Lỗi: Không tìm thấy bài toán nào trong thư mục Test Cases.")
        return
        
    print(f"[*] Đã nhận diện được các bài thi: {', '.join(problems)}\n")
    
    # Quét TẤT CẢ file .py trong thư mục hiện tại VÀ CÁC THƯ MỤC CON (Trừ thư mục TestCases)
    py_files = []
    for root, dirs, files in os.walk(current_dir):
        # Không quét vào thư mục chứa TestCases hoặc các thư mục hệ thống
        if "TestCases" in root or ".gemini" in root or "__pycache__" in root:
            continue
        for f in files:
            if f.endswith('.py') and f != os.path.basename(__file__):
                # Lưu đường dẫn tương đối để hiển thị đẹp hơn
                rel_path = os.path.relpath(os.path.join(root, f), current_dir)
                py_files.append(rel_path)
    
    if not py_files:
        print("[-] Chưa có bài nộp nào (Không tìm thấy file .py).")
        print("    Vui lòng copy file code (hoặc thư mục chứa file code) của học sinh vào thư mục này.")
        input("Nhấn Enter để thoát...")
        return

    report_lines = []
    report_lines.append("="*90)
    report_lines.append(f"{'FILE BÀI LÀM':<30} | {'BÀI TẬP':<10} | {'ĐIỂM':<10} | {'CHI TIẾT LỖI'}")
    report_lines.append("="*90)
    
    for py_file in py_files:
        # Tên file gốc (không lấy đường dẫn) để xác định bài
        base_name = os.path.basename(py_file)
        matched_problem = None
        upper_name = base_name.upper()
        for p in problems:
            if p in upper_name:
                matched_problem = p
                break
                
        if not matched_problem:
            print(f"[?] Bỏ qua: {py_file} (Không xác định được đây là bài nào)")
            continue
            
        print(f"[*] Đang chấm bài: {py_file} (Chấm theo test của bài {matched_problem})...")
        problem_test_dir = os.path.join(TEST_CASES_DIR, f"TEST_{matched_problem}")
        
        test_folders = sorted([d for d in os.listdir(problem_test_dir) if os.path.isdir(os.path.join(problem_test_dir, d))])
        
        correct_count = 0
        total_tests = len(test_folders)
        failed_tests = []
        
        for t_folder in test_folders:
            t_path = os.path.join(problem_test_dir, t_folder)
            
            inp_file_src = os.path.join(t_path, f"{matched_problem}.INP")
            out_file_src = os.path.join(t_path, f"{matched_problem}.OUT")
            
            # Code học sinh sẽ đọc ghi file ở thư mục hiện tại
            inp_file_dest = os.path.join(current_dir, f"{matched_problem}.INP")
            out_file_dest = os.path.join(current_dir, f"{matched_problem}.OUT")
            
            # Chuẩn bị INP
            if os.path.exists(inp_file_src):
                shutil.copy2(inp_file_src, inp_file_dest)
            
            # Xóa OUT cũ (nếu có) để tránh ghi đè nhầm
            if os.path.exists(out_file_dest):
                os.remove(out_file_dest)
                
            status = ""
            py_file_path = os.path.join(current_dir, py_file)
            try:
                # Gọi tiến trình chạy file code
                process = subprocess.run(
                    [sys.executable, py_file_path],
                    cwd=current_dir,
                    capture_output=True,
                    timeout=TIME_LIMIT,
                    text=True
                )
                
                if process.returncode != 0:
                    status = "RE" # Runtime Error (Lỗi Code / Biểu thức)
                else:
                    if compare_outputs(out_file_src, out_file_dest):
                        status = "AC" # Accepted (Đúng)
                        correct_count += 1
                    else:
                        status = "WA" # Wrong Answer (Sai kết quả hoặc không sinh file OUT)
            except subprocess.TimeoutExpired:
                status = "TLE" # Time Limit Exceeded (Quá thời gian / Treo)
            except Exception as e:
                status = "ERR" # Lỗi hệ thống khác
                
            if status != "AC":
                failed_tests.append(f"{t_folder}({status})")
                
            # Dọn dẹp sau khi chấm xong test case đó
            if os.path.exists(inp_file_dest): os.remove(inp_file_dest)
            if os.path.exists(out_file_dest): os.remove(out_file_dest)
            
        score = correct_count * (10.0 / total_tests) if total_tests > 0 else 0
        error_str = ", ".join(failed_tests) if failed_tests else "Hoàn hảo (ALL AC)"
        
        print(f"    -> Đạt {correct_count}/{total_tests} test. Điểm: {score:.1f}/10")
        report_lines.append(f"{py_file:<30} | {matched_problem:<10} | {score:>4.1f}/10.0 | {error_str}")
        
    report_lines.append("="*90)
    report_lines.append("\nCHÚ THÍCH:")
    report_lines.append(" - AC (Accepted) : Test đúng")
    report_lines.append(" - WA (Wrong Answer) : Sai kết quả (Sai đáp số, sai định dạng, hoặc chưa xuất file .OUT)")
    report_lines.append(" - TLE (Time Limit Exceeded): Code chạy quá chậm (Quá 1 giây) hoặc bị treo lặp vô hạn")
    report_lines.append(" - RE (Runtime Error) : Bị lỗi (Chia 0, tràn mảng, lỗi cú pháp...)")
    
    # Xuất file kết quả
    report_path = os.path.join(current_dir, "BANG_DIEM.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print(f"\n[+] Chấm xong! Bảng điểm chi tiết đã được lưu tại: BANG_DIEM.txt")
    input("\nNhấn Enter để kết thúc...")

if __name__ == "__main__":
    main()
