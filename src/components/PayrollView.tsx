import { useState, useMemo } from 'react';
import {
  Wallet,
  Users,
  TrendingUp,
  ShieldCheck,
  Printer,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import type { EmployeePayroll } from '../types/payroll';
import {
  INITIAL_PAYROLL_DATA,
  INITIAL_PERIOD_SUMMARIES,
  PAYROLL_MONTHS,
  formatVND,
  numberToVietnameseWords,
} from '../data/payrollData';
import { useHana } from '../store/HanaContext';

export default function PayrollView() {
  const { currentUser } = useHana();
  const isAdmin = currentUser?.role === 'admin';

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string; success: boolean }>({
    show: false,
    message: '',
    success: true,
  });

  // Payroll Data State
  const [payrollData, setPayrollData] = useState<Record<string, EmployeePayroll[]>>(INITIAL_PAYROLL_DATA);
  const [periodSummaries, setPeriodSummaries] = useState(INITIAL_PERIOD_SUMMARIES);

  const currentMonthEmployees = useMemo(() => {
    return payrollData[selectedMonth] || [];
  }, [payrollData, selectedMonth]);

  const currentSummary = useMemo(() => {
    const defaultSum = {
      thang: selectedMonth,
      thangDisplay: PAYROLL_MONTHS.find(m => m.id === selectedMonth)?.label || selectedMonth,
      tongNhanSu: currentMonthEmployees.length,
      tongQuyLuong: currentMonthEmployees.reduce((a, b) => a + b.thucLinh, 0),
      tongHoaHong: currentMonthEmployees.reduce((a, b) => a + b.tongHoaHong, 0),
      tongBHXH: currentMonthEmployees.reduce((a, b) => a + b.bhxhCaNhan, 0),
      tongThueTNCN: currentMonthEmployees.reduce((a, b) => a + b.thueTNCN, 0),
      thuNhapBinhQuan: currentMonthEmployees.length > 0
        ? Math.round(currentMonthEmployees.reduce((a, b) => a + b.thucLinh, 0) / currentMonthEmployees.length)
        : 0,
      isLocked: false,
    };
    return periodSummaries[selectedMonth] || defaultSum;
  }, [periodSummaries, selectedMonth, currentMonthEmployees]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return currentMonthEmployees.filter(emp => {
      if (branchFilter !== 'ALL' && emp.chiNhanh !== branchFilter) return false;
      if (roleFilter !== 'ALL' && emp.chucVu !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.hoTen.toLowerCase().includes(q);
        const matchCode = emp.maNV.toLowerCase().includes(q);
        const matchPhone = emp.soDienThoai.includes(q);
        if (!matchName && !matchCode && !matchPhone) return false;
      }
      return true;
    });
  }, [currentMonthEmployees, branchFilter, roleFilter, searchQuery]);

  // Handle Sync from ERP
  const handleSyncERP = async () => {
    setIsSyncing(true);
    try {
      // Giả lập gọi API đồng bộ trực tiếp từ Supabase/ERP
      await new Promise(r => setTimeout(r, 1200));
      setSyncToast({
        show: true,
        message: 'Đã đồng bộ thành công số liệu chấm công & hoa hồng mới nhất từ ERP Hana!',
        success: true,
      });
    } catch {
      setSyncToast({
        show: true,
        message: 'Lỗi khi kết nối ERP Hana Wellness',
        success: false,
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  // Lock / Unlock Month
  const toggleLockMonth = () => {
    if (!isAdmin) {
      alert('Chỉ Admin hoặc Kế toán trưởng mới có quyền khóa/mở khóa sổ lương!');
      return;
    }
    const currentLock = currentSummary.isLocked;
    const confirmMsg = currentLock
      ? `Bạn có chắc muốn MỞ KHÓA sổ lương ${currentSummary.thangDisplay}?`
      : `Bạn có chắc muốn KHÓA SỔ LƯƠNG ${currentSummary.thangDisplay}? Sau khi khóa, số liệu sẽ được chốt để chuyển khoản.`;
    if (!window.confirm(confirmMsg)) return;

    setPeriodSummaries(prev => ({
      ...prev,
      [selectedMonth]: {
        ...currentSummary,
        isLocked: !currentLock,
        ngayKhoaSo: !currentLock ? new Date().toLocaleString('vi-VN') : undefined,
        nguoiKhoaSo: !currentLock ? `${currentUser?.name || currentUser?.email} (Admin)` : undefined,
      },
    }));

    // Cập nhật trạng thái nhân viên
    setPayrollData(prev => ({
      ...prev,
      [selectedMonth]: prev[selectedMonth].map(e => ({
        ...e,
        trangThai: !currentLock ? 'DaThanhToan' : 'TamTinh',
      })),
    }));

    setSyncToast({
      show: true,
      message: !currentLock ? `Đã khóa sổ lương ${selectedMonth}` : `Đã mở khóa sổ lương ${selectedMonth}`,
      success: true,
    });
    setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Export Excel CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã NV',
      'Họ và tên',
      'Chức vụ',
      'Chi nhánh',
      'Số tài khoản',
      'Ngân hàng',
      'Công chuẩn',
      'Công thực tế',
      'Đi muộn (lần)',
      'Lương đóng BHXH (VNĐ)',
      'Phụ cấp trách nhiệm (VNĐ)',
      'Lương thỏa thuận (VNĐ)',
      'Lương thời gian (VNĐ)',
      'Phụ cấp ăn trưa/đi lại (VNĐ)',
      'Hoa hồng Tour KTV (VNĐ)',
      'Hoa hồng Bán lẻ (VNĐ)',
      'Hoa hồng Doanh số (VNĐ)',
      'Tổng hoa hồng (VNĐ)',
      'Thưởng KPI (VNĐ)',
      'Phạt đi muộn (VNĐ)',
      'Khấu trừ BHXH 10.5% (VNĐ)',
      'Thuế TNCN (VNĐ)',
      'THỰC LĨNH (VNĐ)',
      'Trạng thái',
    ];

    const rows = filteredEmployees.map(e => [
      e.maNV,
      `"${e.hoTen}"`,
      `"${e.chucVuLabel}"`,
      `"${e.chiNhanhTen}"`,
      `"${e.soTaiKhoan}"`,
      `"${e.nganHang}"`,
      e.ngayCongChuan,
      e.ngayCongThucTe,
      e.soLanDiMuon,
      e.luongDongBHXH,
      e.phuCapTrachNhiem,
      e.luongThoaThuan,
      e.luongThoiGian,
      e.phuCapAnTruaXangXe,
      e.hhTourKtv,
      e.hhBanLe,
      e.hhDoanhSo,
      e.tongHoaHong,
      e.thuongKPI,
      e.phatDiMuon,
      e.bhxhCaNhan,
      e.thueTNCN,
      e.thucLinh,
      e.trangThai === 'DaThanhToan' ? 'Đã thanh toán' : 'Tạm tính',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BangLuong_HanaWellness_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Payslip or Table
  const handlePrint = () => {
    window.print();
  };

  // Navigate next/prev employee in payslip modal
  const handlePrevEmployee = () => {
    if (!selectedEmployee) return;
    const currentIndex = filteredEmployees.findIndex(e => e.maNV === selectedEmployee.maNV);
    if (currentIndex > 0) {
      setSelectedEmployee(filteredEmployees[currentIndex - 1]);
    }
  };

  const handleNextEmployee = () => {
    if (!selectedEmployee) return;
    const currentIndex = filteredEmployees.findIndex(e => e.maNV === selectedEmployee.maNV);
    if (currentIndex < filteredEmployees.length - 1) {
      setSelectedEmployee(filteredEmployees[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Toast Notification */}
      {syncToast.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold animate-in fade-in slide-in-from-top-3 ${
            syncToast.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <CheckCircle2 size={20} className={syncToast.success ? 'text-emerald-600' : 'text-red-600'} />
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#F5F0E6] p-6 rounded-2xl border border-[#E7E0D6] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8D6E63] text-white flex items-center justify-center shadow-sm">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-[#4E342E] tracking-tight">
                BẢNG LƯƠNG NHÂN VIÊN & HOA HỒNG ERP
              </h1>
              <p className="text-xs text-[#8D6E63] font-semibold">
                Đồng bộ tự động từ ERP Hana Wellness · Lương CB đóng BHXH cố định 5.350.000đ theo QĐ 30/08/2026
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn tháng */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#E7E0D6] shadow-2xs">
            <span className="text-xs font-bold text-[#8D6E63]">Kỳ lương:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-[#4E342E] bg-transparent outline-none cursor-pointer"
            >
              {PAYROLL_MONTHS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Badge Khóa sổ */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              currentSummary.isLocked
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {currentSummary.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{currentSummary.isLocked ? 'Đã khóa sổ' : 'Sổ đang mở (Tạm tính)'}</span>
          </div>

          {/* Nút Khóa / Mở khóa sổ */}
          {isAdmin && (
            <button
              onClick={toggleLockMonth}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#EFEBE0] hover:bg-[#E2DACB] text-[#5D4037] border border-[#D7CCC8] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Khóa hoặc mở khóa sổ lương"
            >
              {currentSummary.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{currentSummary.isLocked ? 'Mở khóa sổ' : 'Khóa sổ lương'}</span>
            </button>
          )}

          {/* Nút Đồng bộ ERP */}
          <button
            onClick={handleSyncERP}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8D6E63] hover:bg-[#6D4C41] disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Đồng bộ dữ liệu chấm công và hoa hồng từ ERP"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Đang kéo ERP...' : 'Đồng bộ ERP'}</span>
          </button>

          {/* Xuất Excel */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF7F0] text-[#5D4037] border border-[#D7CCC8] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xuất bảng lương toàn công ty ra file Excel/CSV"
          >
            <FileSpreadsheet size={14} className="text-emerald-700" />
            <span>Xuất Excel</span>
          </button>

          {/* In bảng lương */}
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF7F0] text-[#5D4037] border border-[#D7CCC8] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="In bảng lương"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">In</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống kê Tổng quan (KPI Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Quỹ Lương Thực Chi */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Tổng Quỹ Lương Thực Lĩnh</p>
            <h3 className="text-2xl font-black text-[#4E342E] mt-1">{formatVND(currentSummary.tongQuyLuong)}</h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Đã trừ BHXH & Thuế TNCN</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F5F0E6] flex items-center justify-center text-[#8D6E63]">
            <Wallet size={24} />
          </div>
        </div>

        {/* Card 2: Tổng Hoa Hồng Đã Chi */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Tổng Hoa Hồng (Tour + SP)</p>
            <h3 className="text-2xl font-black text-[#8D6E63] mt-1">{formatVND(currentSummary.tongHoaHong)}</h3>
            <p className="text-[11px] text-[#A1887F] font-semibold mt-1">Chiếm {(currentSummary.tongHoaHong / (currentSummary.tongQuyLuong || 1) * 100).toFixed(1)}% tổng quỹ</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFEBE0] flex items-center justify-center text-[#6D4C41]">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 3: Tổng Đóng BHXH (10.5%) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Tổng Trích Nộp BHXH</p>
            <h3 className="text-2xl font-black text-[#5D4037] mt-1">{formatVND(currentSummary.tongBHXH)}</h3>
            <p className="text-[11px] text-[#8D6E63] font-semibold mt-1">561.750đ / người (5.350.000đ × 10.5%)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F5F0E6] flex items-center justify-center text-[#8D6E63]">
            <ShieldCheck size={24} />
          </div>
        </div>

        {/* Card 4: Nhân sự & Thu nhập bình quân */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Nhân Sự & Thu Nhập BQ</p>
            <h3 className="text-2xl font-black text-[#4E342E] mt-1">{formatVND(currentSummary.thuNhapBinhQuan)}</h3>
            <p className="text-[11px] text-[#8D6E63] font-semibold mt-1">Tổng số: {currentSummary.tongNhanSu} nhân sự hoạt động</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFEBE0] flex items-center justify-center text-[#5D4037]">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0D6] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Ô Tìm Kiếm */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1887F]" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV, SĐT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D7CCC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/30 transition-all font-medium text-[#4E342E]"
            />
          </div>

          {/* Lọc Chi Nhánh */}
          <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#D7CCC8]">
            <Building2 size={14} className="text-[#8D6E63]" />
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="text-xs font-bold text-[#5D4037] bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              <option value="CN1">Chi nhánh 1 — Quận 1</option>
              <option value="CN2">Chi nhánh 2 — Quận 3</option>
              <option value="CN3">Chi nhánh 3 — Thủ Đức</option>
            </select>
          </div>

          {/* Lọc Chức Vụ */}
          <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#D7CCC8]">
            <Users size={14} className="text-[#8D6E63]" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="text-xs font-bold text-[#5D4037] bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả chức danh</option>
              <option value="KTV">Kỹ thuật viên (KTV)</option>
              <option value="Sale">Tư vấn viên / Sale</option>
              <option value="CSKH">Chăm sóc khách hàng</option>
              <option value="LeTan">Lễ tân & Thu ngân</option>
              <option value="BacSi">Bác sĩ chuyên khoa</option>
              <option value="BaoVe">Bảo vệ & An ninh</option>
              <option value="TapVu">Tạp vụ & Vệ sinh</option>
            </select>
          </div>
        </div>

        {/* Số lượng kết quả */}
        <div className="text-xs font-bold text-[#8D6E63]">
          Hiển thị: <span className="text-[#4E342E]">{filteredEmployees.length}</span> / {currentMonthEmployees.length} nhân sự
        </div>
      </div>

      {/* BẢNG LƯƠNG TOÀN CÔNG TY (MAIN TABLE) */}
      <div className="bg-white rounded-2xl border border-[#E7E0D6] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E0D6] bg-[#FAF7F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8D6E63]"></span>
            <h2 className="font-bold text-sm text-[#4E342E] uppercase tracking-wide">
              Bảng Lương Tổng Hợp Toàn Công Ty — {currentSummary.thangDisplay}
            </h2>
          </div>
          <span className="text-xs text-[#8D6E63] italic">
            Nhấn vào bất kỳ nhân viên nào để xem và in Phiếu lương chi tiết (Payslip)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F0E6] text-[#5D4037] font-bold border-b border-[#E7E0D6] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-3">Chi nhánh</th>
                <th className="py-3 px-3 text-center">Công chuẩn / Làm</th>
                <th className="py-3 px-3 text-right">Lương CB (BHXH)</th>
                <th className="py-3 px-3 text-right">PC Trách nhiệm</th>
                <th className="py-3 px-3 text-right">Lương thời gian</th>
                <th className="py-3 px-3 text-right">PC Phúc lợi</th>
                <th className="py-3 px-3 text-right">Hoa hồng</th>
                <th className="py-3 px-3 text-right">Thưởng KPI</th>
                <th className="py-3 px-3 text-right">Trừ BHXH (10.5%)</th>
                <th className="py-3 px-4 text-right bg-[#EFEBE0]/60">THỰC LĨNH</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E0D6] text-[#4E342E]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-[#8D6E63]">
                    Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr
                    key={emp.maNV}
                    onClick={() => setSelectedEmployee(emp)}
                    className="hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                  >
                    {/* Nhân sự */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#8D6E63]/15 text-[#6D4C41] font-black flex items-center justify-center text-xs shrink-0 group-hover:bg-[#8D6E63] group-hover:text-white transition-colors">
                          {emp.hoTen.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#4E342E] group-hover:text-[#8D6E63] transition-colors">
                            {emp.hoTen}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-[#8D6E63] bg-[#EFEBE0] px-1.5 py-0.5 rounded">
                              {emp.maNV}
                            </span>
                            <span className="text-[10px] text-[#8D6E63]">· {emp.chucVuLabel}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Chi nhánh */}
                    <td className="py-3 px-3 text-xs text-[#6D4C41]">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#E7E0D6] font-medium text-[11px]">
                        {emp.chiNhanh}
                      </span>
                    </td>

                    {/* Công chuẩn / Làm */}
                    <td className="py-3 px-3 text-center font-medium">
                      <span className="font-bold text-[#4E342E]">{emp.ngayCongThucTe}</span>
                      <span className="text-[#8D6E63]">/{emp.ngayCongChuan}</span>
                      {emp.soLanDiMuon > 0 && (
                        <span className="block text-[10px] text-red-600 font-bold">
                          Muộn {emp.soLanDiMuon} lần
                        </span>
                      )}
                    </td>

                    {/* Lương CB đóng BHXH (5.350.000đ) */}
                    <td className="py-3 px-3 text-right font-medium text-[#6D4C41]">
                      {formatVND(emp.luongDongBHXH)}
                    </td>

                    {/* Phụ cấp trách nhiệm */}
                    <td className="py-3 px-3 text-right font-medium text-[#6D4C41]">
                      {formatVND(emp.phuCapTrachNhiem)}
                    </td>

                    {/* Lương thời gian */}
                    <td className="py-3 px-3 text-right font-semibold text-[#4E342E]">
                      {formatVND(emp.luongThoiGian)}
                    </td>

                    {/* Phụ cấp phúc lợi */}
                    <td className="py-3 px-3 text-right font-medium text-[#6D4C41]">
                      {formatVND(emp.phuCapAnTruaXangXe)}
                    </td>

                    {/* Hoa hồng */}
                    <td className="py-3 px-3 text-right font-bold text-[#8D6E63]">
                      {emp.tongHoaHong > 0 ? formatVND(emp.tongHoaHong) : '—'}
                    </td>

                    {/* Thưởng KPI */}
                    <td className="py-3 px-3 text-right font-medium text-emerald-800">
                      {emp.thuongKPI > 0 ? formatVND(emp.thuongKPI) : '—'}
                    </td>

                    {/* Trừ BHXH (10.5%) */}
                    <td className="py-3 px-3 text-right font-medium text-red-700">
                      -{formatVND(emp.bhxhCaNhan)}
                    </td>

                    {/* THỰC LĨNH */}
                    <td className="py-3 px-4 text-right bg-[#EFEBE0]/40 font-black text-sm text-[#4E342E]">
                      {formatVND(emp.thucLinh)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                        title="Xem Phiếu Lương Chi Tiết"
                      >
                        Phiếu lương
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* TỔNG CỘNG FOOTER */}
            {filteredEmployees.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F0E6] text-[#4E342E] font-black border-t-2 border-[#D7CCC8]">
                  <td className="py-3.5 px-4" colSpan={3}>
                    TỔNG CỘNG ({filteredEmployees.length} NHÂN SỰ)
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.luongDongBHXH, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.phuCapTrachNhiem, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.luongThoiGian, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.phuCapAnTruaXangXe, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-[#8D6E63]">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.tongHoaHong, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-800">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.thuongKPI, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-red-700">
                    -{formatVND(filteredEmployees.reduce((a, b) => a + b.bhxhCaNhan, 0))}
                  </td>
                  <td className="py-3.5 px-4 text-right bg-[#EFEBE0] text-base text-[#4E342E]">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.thucLinh, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL / DRAWER: PHIẾU LƯƠNG CÁ NHÂN (PAYSLIP VIEW) */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E7E0D6] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header Actions (Không in ra khi print) */}
            <div className="p-4 bg-[#F5F0E6] border-b border-[#E7E0D6] flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevEmployee}
                  className="p-1.5 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#5D4037] border border-[#D7CCC8] transition-colors cursor-pointer"
                  title="Nhân sự trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextEmployee}
                  className="p-1.5 rounded-lg bg-white hover:bg-[#FAF7F0] text-[#5D4037] border border-[#D7CCC8] transition-colors cursor-pointer"
                  title="Nhân sự kế tiếp"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-xs font-bold text-[#8D6E63] ml-2">
                  Phiếu lương: <span className="text-[#4E342E]">{selectedEmployee.hoTen}</span> ({selectedEmployee.maNV})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span>In phiếu lương (A4)</span>
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-[#8D6E63] hover:text-red-700 border border-[#D7CCC8] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* NỘI DUNG PHIẾU LƯƠNG CHUẨN IN A4 (PAYSLIP DOCUMENT) */}
            <div className="p-8 sm:p-10 space-y-6 text-[#4E342E]" id="printable-payslip">
              {/* Header Công Ty */}
              <div className="border-b-2 border-[#8D6E63] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#8D6E63] rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-sm">
                    H
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#4E342E] tracking-tight uppercase">
                      HANA WELLNESS & TRỊ LIỆU TỰ NHIÊN
                    </h2>
                    <p className="text-xs text-[#8D6E63] font-bold">Hệ thống Trị liệu Cột sống & Phục hồi Cơ Xương Khớp Chuẩn Y Khoa</p>
                    <p className="text-xs text-[#A1887F]">Địa chỉ: {selectedEmployee.chiNhanhTen}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-[#EFEBE0] text-[#5D4037] border border-[#D7CCC8] uppercase">
                    PHIẾU LƯƠNG & HOA HỒNG
                  </span>
                  <p className="text-sm font-black text-[#4E342E] mt-1">{currentSummary.thangDisplay}</p>
                  <p className="text-[11px] text-[#8D6E63]">Ngày xuất phiếu: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Thông tin nhân viên */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E7E0D6] text-xs">
                <div>
                  <span className="text-[#8D6E63] font-bold block">Mã nhân viên:</span>
                  <span className="font-black text-[#4E342E] text-sm">{selectedEmployee.maNV}</span>
                </div>
                <div>
                  <span className="text-[#8D6E63] font-bold block">Họ và tên:</span>
                  <span className="font-black text-[#4E342E] text-sm">{selectedEmployee.hoTen}</span>
                </div>
                <div>
                  <span className="text-[#8D6E63] font-bold block">Chức danh / Cấp bậc:</span>
                  <span className="font-bold text-[#4E342E]">
                    {selectedEmployee.capBacTen || selectedEmployee.chucVuLabel}
                  </span>
                </div>
                <div>
                  <span className="text-[#8D6E63] font-bold block">Ngày vào làm:</span>
                  <span className="font-bold text-[#4E342E]">{selectedEmployee.ngayVaoLam}</span>
                </div>

                <div>
                  <span className="text-[#8D6E63] font-bold block">Công chuẩn / Thực tế:</span>
                  <span className="font-bold text-[#4E342E]">
                    {selectedEmployee.ngayCongThucTe} / {selectedEmployee.ngayCongChuan} ngày
                  </span>
                </div>
                <div>
                  <span className="text-[#8D6E63] font-bold block">Người phụ thuộc (TNCN):</span>
                  <span className="font-bold text-[#4E342E]">{selectedEmployee.soNguoiPhuThuoc} người</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#8D6E63] font-bold block">Tài khoản nhận lương:</span>
                  <span className="font-bold text-[#4E342E]">
                    {selectedEmployee.soTaiKhoan} — {selectedEmployee.nganHang}
                  </span>
                </div>
              </div>

              {/* KHỐI 1: BẢNG TỔNG HỢP CÁC KHOẢN THU NHẬP & KHẤU TRỪ */}
              <div className="border border-[#E7E0D6] rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F5F0E6] text-[#5D4037] font-bold border-b border-[#E7E0D6] uppercase tracking-wider">
                      <th className="py-2.5 px-4 text-left">Nội dung chi tiết</th>
                      <th className="py-2.5 px-3 text-center">Đơn vị / Tỷ lệ</th>
                      <th className="py-2.5 px-4 text-right">Số tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D6]">
                    {/* Mục I: Thu Nhập Cố Định & Thời Gian */}
                    <tr className="bg-[#FAF7F0] font-bold text-[#4E342E]">
                      <td colSpan={3} className="py-2 px-4">
                        I. LƯƠNG & PHỤ CẤP THỜI GIAN
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">1. Lương cơ bản đóng BHXH (QĐ 30/08/2026)</td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">Cố định</td>
                      <td className="py-2 px-4 text-right font-medium">{formatVND(selectedEmployee.luongDongBHXH)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">2. Phụ cấp trách nhiệm công việc</td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">Thỏa thuận</td>
                      <td className="py-2 px-4 text-right font-medium">{formatVND(selectedEmployee.phuCapTrachNhiem)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 font-semibold">
                        Lương theo ngày công làm việc thực tế ({selectedEmployee.ngayCongThucTe}/{selectedEmployee.ngayCongChuan} ngày)
                      </td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">{selectedEmployee.ngayCongThucTe} công</td>
                      <td className="py-2 px-4 text-right font-bold text-[#4E342E]">{formatVND(selectedEmployee.luongThoiGian)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">3. Phụ cấp ăn trưa, xăng xe, điện thoại</td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">Phúc lợi</td>
                      <td className="py-2 px-4 text-right font-medium">{formatVND(selectedEmployee.phuCapAnTruaXangXe)}</td>
                    </tr>

                    {/* Mục II: Hoa Hồng & Thưởng */}
                    <tr className="bg-[#FAF7F0] font-bold text-[#4E342E]">
                      <td colSpan={3} className="py-2 px-4">
                        II. HOA HỒNG DỊCH VỤ / SẢN PHẨM & THƯỞNG KPI
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">1. Hoa hồng đi Tour KTV (Chính / Phụ)</td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">Theo ca</td>
                      <td className="py-2 px-4 text-right font-bold text-[#8D6E63]">{formatVND(selectedEmployee.hhTourKtv)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">2. Hoa hồng Bán lẻ mỹ phẩm / thảo dược</td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">3% - 5%</td>
                      <td className="py-2 px-4 text-right font-bold text-[#8D6E63]">{formatVND(selectedEmployee.hhBanLe)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">3. Hoa hồng Doanh số / Bán thẻ liệu trình</td>
                      <td className="py-2 px-3 text-center text-[#8D6E63]">8%</td>
                      <td className="py-2 px-4 text-right font-bold text-[#8D6E63]">{formatVND(selectedEmployee.hhDoanhSo)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8">4. Thưởng hiệu suất công việc (KPI)</td>
                      <td className="py-2 px-3 text-center text-emerald-800">Đạt KPI</td>
                      <td className="py-2 px-4 text-right font-bold text-emerald-800">{formatVND(selectedEmployee.thuongKPI)}</td>
                    </tr>
                    <tr className="bg-[#FAF7F0]/60 font-bold">
                      <td className="py-2 px-4">TỔNG THU NHẬP TRƯỚC GIẢM TRỪ</td>
                      <td></td>
                      <td className="py-2 px-4 text-right text-sm text-[#4E342E]">{formatVND(selectedEmployee.tongThuNhap)}</td>
                    </tr>

                    {/* Mục III: Các Khoản Khấu Trừ */}
                    <tr className="bg-[#FAF7F0] font-bold text-red-900">
                      <td colSpan={3} className="py-2 px-4">
                        III. CÁC KHOẢN KHẤU TRỪ THEO QUY ĐỊNH
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-red-800">1. Trích nộp BHXH, BHYT, BHTN người lao động</td>
                      <td className="py-2 px-3 text-center text-red-800">10.5% × 5.350.000đ</td>
                      <td className="py-2 px-4 text-right font-bold text-red-800">-{formatVND(selectedEmployee.bhxhCaNhan)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-red-800">2. Thuế thu nhập cá nhân (TNCN) tạm khấu trừ</td>
                      <td className="py-2 px-3 text-center text-red-800">Biểu lũy tiến</td>
                      <td className="py-2 px-4 text-right font-medium text-red-800">
                        {selectedEmployee.thueTNCN > 0 ? `-${formatVND(selectedEmployee.thueTNCN)}` : '0 đ'}
                      </td>
                    </tr>
                    {selectedEmployee.phatDiMuon > 0 && (
                      <tr>
                        <td className="py-2 px-4 pl-8 text-red-800">
                          3. Phạt đi muộn ({selectedEmployee.soLanDiMuon} lần × 50.000đ)
                        </td>
                        <td className="py-2 px-3 text-center text-red-800">Nội quy</td>
                        <td className="py-2 px-4 text-right font-bold text-red-800">-{formatVND(selectedEmployee.phatDiMuon)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#EFEBE0] text-[#4E342E] font-black text-sm border-t-2 border-[#8D6E63]">
                      <td className="py-3.5 px-4 uppercase tracking-wider" colSpan={2}>
                        THỰC LĨNH NHÂN VIÊN NHẬN ĐƯỢC
                      </td>
                      <td className="py-3.5 px-4 text-right text-base text-[#4E342E]">
                        {formatVND(selectedEmployee.thucLinh)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Số tiền bằng chữ */}
              <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E0D6] text-xs">
                <span className="font-bold text-[#8D6E63]">Số tiền bằng chữ: </span>
                <span className="font-bold text-[#4E342E] italic">
                  {numberToVietnameseWords(selectedEmployee.thucLinh)}
                </span>
              </div>

              {/* KHỐI 2: CHI TIẾT HOA HỒNG TỪNG TOUR/CA KHÁCH (NẾU CÓ) */}
              {selectedEmployee.chiTietHoaHong && selectedEmployee.chiTietHoaHong.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#5D4037] uppercase tracking-wider">
                    Bảng Kê Chi Tiết Ca Trị Liệu & Doanh Số Trong Kỳ ({selectedEmployee.chiTietHoaHong.length} mục)
                  </h4>
                  <div className="border border-[#E7E0D6] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#F5F0E6] text-[#5D4037] font-bold border-b border-[#E7E0D6]">
                          <th className="py-2 px-3 text-left">Ngày</th>
                          <th className="py-2 px-3 text-left">Khách hàng</th>
                          <th className="py-2 px-3 text-left">Dịch vụ / Sản phẩm</th>
                          <th className="py-2 px-3 text-left">Vai trò</th>
                          <th className="py-2 px-3 text-right">Doanh số</th>
                          <th className="py-2 px-3 text-right">Hoa hồng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E0D6]">
                        {selectedEmployee.chiTietHoaHong.map(item => (
                          <tr key={item.id} className="hover:bg-[#FAF7F0]">
                            <td className="py-2 px-3 text-[#6D4C41]">{item.ngay}</td>
                            <td className="py-2 px-3 font-semibold text-[#4E342E]">{item.tenKhachHang}</td>
                            <td className="py-2 px-3 text-[#5D4037]">{item.tenDichVu_SanPham}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded bg-[#EFEBE0] text-[#5D4037] text-[10px] font-bold">
                                {item.vaiTroLabel}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-[#6D4C41]">
                              {formatVND(item.doanhSo)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-[#8D6E63]">
                              {formatVND(item.soTienHoaHong)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chữ ký xác nhận */}
              <div className="pt-8 grid grid-cols-3 text-center text-xs gap-4">
                <div>
                  <p className="font-bold text-[#4E342E] uppercase">Người Lập Phiếu</p>
                  <p className="text-[11px] text-[#8D6E63] italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-[#4E342E]">Kế toán Tiền lương</p>
                </div>
                <div>
                  <p className="font-bold text-[#4E342E] uppercase">Kế Toán Trưởng / Giám Đốc</p>
                  <p className="text-[11px] text-[#8D6E63] italic mt-0.5">(Ký và duyệt chi)</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-md rotate-[-5deg]">
                      HANA ERP CERTIFIED
                    </span>
                  </div>
                  <p className="font-semibold text-[#4E342E]">Phạm Văn Tùng</p>
                </div>
                <div>
                  <p className="font-bold text-[#4E342E] uppercase">Người Nhận Lương</p>
                  <p className="text-[11px] text-[#8D6E63] italic mt-0.5">(Ký xác nhận đã nhận đủ)</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-[#4E342E]">{selectedEmployee.hoTen}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
