@echo off
chcp 65001 >nul
color 0A
echo ==================================================
echo HỆ THỐNG TỰ ĐỘNG CẬP NHẬT BÀI TẬP LÊN TRANG WEB
echo ==================================================
echo.
echo Dang quet thu muc public/data de tim cac Tuan hoc moi...
echo Dang tach dap an (.OUT) ra khoi thu muc cong khai...
node scripts\tach-dap-an.js
echo Dang tao ma PIN cho hoc sinh moi (neu co)...
node scripts\tao-ma-pin.js
git add .
git commit -m "Giao vien cap nhat du lieu bai tap moi"
echo.
echo Dang day du lieu len mang... Vui long doi vai giay...
git push
echo.
echo ==================================================
echo THANH CONG! DU LIEU DA DUOC TAI LEN GITHUB.
echo Vercel se tu dong lam moi trang web cua ban trong 1 phut toi.
echo Ban co the tat cua so nay roi nhe!
echo ==================================================
pause
