import fs from 'fs';

const hrPath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/components/HRManagementView.tsx';
let code = fs.readFileSync(hrPath, 'utf8');

// 1. Đổi activeSubTab mặc định thành 'directory'
code = code.replace(
  "const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'directory' | 'attendance' | 'leave' | 'regulations'>('payroll');",
  "const [activeSubTab, setActiveSubTab] = useState<'directory' | 'attendance' | 'leave' | 'payroll' | 'regulations'>('directory');"
);

// 2. Sắp xếp lại SUB-TABS NAVIGATION Buttons
const oldTabsNav = `      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E7E0D6] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('payroll')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'payroll'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <Wallet size={18} />
          <span>Bảng Lương ERP & Phiếu Lương</span>
        </button>

        <button
          onClick={() => setActiveSubTab('regulations')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'regulations'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <Award size={18} />
          <span>Quy chế Lương & Thang Ngạch Bậc</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'directory'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <Users size={18} />
          <span>Hồ Sơ Nhân Viên (\${employees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'attendance'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <CalendarDays size={18} />
          <span>Bảng Chấm Công (Ca 09:00 - 19:00)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leave')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer relative \${
            activeSubTab === 'leave'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <FileCheck2 size={18} />
          <span>Đăng Ký & Duyệt Nghỉ</span>
          {leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
              {leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length}
            </span>
          )}
        </button>
      </div>`;

const newTabsNav = `      {/* SUB-TABS NAVIGATION - SẮP XẾP THEO LOGIC QUY TRÌNH CHUẨN */}
      <div className="flex items-center gap-2 border-b border-[#E7E0D6] pb-2 overflow-x-auto">
        {/* BƯỚC 1: HỒ SƠ NHÂN VIÊN */}
        <button
          onClick={() => setActiveSubTab('directory')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'directory'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <Users size={18} />
          <span>1. Hồ Sơ Nhân Viên (\${employees.length})</span>
        </button>

        {/* BƯỚC 2: BẢNG CHẤM CÔNG */}
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'attendance'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <CalendarDays size={18} />
          <span>2. Bảng Chấm Công (Ca 09:00 - 19:00)</span>
        </button>

        {/* BƯỚC 3: ĐĂNG KÝ & DUYỆT NGHỈ */}
        <button
          onClick={() => setActiveSubTab('leave')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer relative \${
            activeSubTab === 'leave'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <FileCheck2 size={18} />
          <span>3. Đăng Ký & Duyệt Nghỉ</span>
          {leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
              {leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length}
            </span>
          )}
        </button>

        {/* BƯỚC 4: BẢNG LƯƠNG ERP & PHIẾU LƯƠNG */}
        <button
          onClick={() => setActiveSubTab('payroll')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'payroll'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <Wallet size={18} />
          <span>4. Bảng Lương ERP & Phiếu Lương</span>
        </button>

        {/* BƯỚC 5: QUY CHẾ LƯƠNG & THANG NGẠCH BẬC */}
        <button
          onClick={() => setActiveSubTab('regulations')}
          className={\`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer \${
            activeSubTab === 'regulations'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }\`}
        >
          <Award size={18} />
          <span>5. Quy chế Lương & Thang Ngạch Bậc</span>
        </button>
      </div>`;

if (code.includes(oldTabsNav)) {
  code = code.replace(oldTabsNav, newTabsNav);
  console.log('Reordered tab buttons successfully.');
} else {
  console.error('Could not find oldTabsNav');
  process.exit(1);
}

fs.writeFileSync(hrPath, code, 'utf8');
console.log('HRManagementView tab order updated!');
