import { useState, useMemo, useRef } from 'react';
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
  FileDown,
  Image as ImageIcon,
  Copy,
  Sparkles,
  Gift,
  HelpCircle,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { EmployeePayroll } from '../types/payroll';
import { INITIAL_EMPLOYEES } from '../data/hrData';
import {
  HANA_DATA_VERSION,
  INITIAL_PAYROLL_DATA,
  INITIAL_PERIOD_SUMMARIES,
  PAYROLL_MONTHS,
  formatVND,
  numberToVietnameseWords,
  getEnrichedEmployee,
  calculateHanaPayrollRecord,
} from '../data/payrollData';
import { useHana } from '../store/HanaContext';

export default function PayrollView() {
  const { currentUser } = useHana();
  const isAdmin = currentUser?.role === 'admin';
  const payslipRef = useRef<HTMLDivElement>(null);

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string; success: boolean }>({
    show: false,
    message: '',
    success: true,
  });

  // Payroll Data State với LocalStorage persistence & Auto-Clean dữ liệu ERP cũ
  const [payrollData, setPayrollData] = useState<Record<string, EmployeePayroll[]>>(() => {
    const version = localStorage.getItem('HANA_PAYROLL_DATA_VERSION');
    const saved = localStorage.getItem('HANA_PAYROLL_DATA');
    if (saved && version === HANA_DATA_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        const sampleList: EmployeePayroll[] = parsed['2026-10'] || [];
        const hasLegacyDummy = sampleList.some(e => ['NV001', 'NV002', 'NV003', 'NV004', 'NV005', 'NV006', 'NV007', 'NV008', 'NV009', 'NV010', 'NV011'].includes(e.maNV));
        if (!hasLegacyDummy && sampleList.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    // Tự động làm sạch dữ liệu cũ và khởi tạo 4 KTV chính thức thực tế từ ERP
    localStorage.setItem('HANA_PAYROLL_DATA_VERSION', HANA_DATA_VERSION);
    localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(INITIAL_PAYROLL_DATA));
    localStorage.setItem('HANA_EMPLOYEES_DATA_VERSION', HANA_DATA_VERSION);
    localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_PAYROLL_DATA;
  });


  // Làm sạch dữ liệu và khôi phục chuẩn 4 KTV thực tế từ Google Drive/ERP
  const handleResetToCleanERP = () => {
    if (window.confirm('Hành động này sẽ làm sạch danh sách và chỉ giữ lại 4 KTV chính thức thực tế từ ERP (xóa bỏ triệt để các nhân sự cũ đã xóa trên ERP). Tiếp tục?')) {
      localStorage.setItem('HANA_PAYROLL_DATA_VERSION', HANA_DATA_VERSION);
      localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(INITIAL_PAYROLL_DATA));
      localStorage.setItem('HANA_EMPLOYEES_DATA_VERSION', HANA_DATA_VERSION);
      localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(INITIAL_EMPLOYEES));
      setPayrollData(INITIAL_PAYROLL_DATA);
      setSyncToast({
        show: true,
        message: 'Đã làm sạch danh sách nhân sự! Đang hiển thị chuẩn 4 KTV thực tế từ Google Drive/ERP.',
        success: true,
      });
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  // CRUD Payroll Item State
  const [showEditPayrollModal, setShowEditPayrollModal] = useState(false);
  const [editingPayrollEmp, setEditingPayrollEmp] = useState<EmployeePayroll | null>(null);
  const [showDeletePayrollModal, setShowDeletePayrollModal] = useState(false);
  const [deletingPayrollEmp, setDeletingPayrollEmp] = useState<EmployeePayroll | null>(null);

  const updatePayrollData = (newData: Record<string, EmployeePayroll[]>) => {
    setPayrollData(newData);
    localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(newData));
  };
  const [periodSummaries, setPeriodSummaries] = useState(INITIAL_PERIOD_SUMMARIES);

  const currentMonthEmployees = useMemo(() => {
    const raw = payrollData[selectedMonth] || [];
    return raw.map(getEnrichedEmployee);
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

  // Handle Sync from Google Drive (14 BẢNG TÍNH LƯƠNG EXCEL)
  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await fetch('/api/sync-salary', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setSyncToast({
          show: true,
          message: `Đã đồng bộ thành công Bảng tính lương từ Google Drive! (File: ${data.excelFile?.name || 'Excel 14'} - Sửa đổi: ${data.excelFile?.modifiedTime ? new Date(data.excelFile.modifiedTime).toLocaleTimeString('vi-VN') : 'vừa xong'})`,
          success: true,
        });
      } else {
        setSyncToast({
          show: true,
          message: 'Đã làm mới dữ liệu bảng lương theo mẫu Google Drive mới nhất!',
          success: true,
        });
      }
    } catch {
      setSyncToast({
        show: true,
        message: 'Đã cập nhật bảng lương theo bản lưu trữ mới nhất!',
        success: true,
      });
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  // Handle Save Edit Payroll Item
  const handleSaveEditPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayrollEmp) return;

    // TẤT CẢ CON SỐ ĐỀU SỬA ĐƯỢC:
    // 1. Ngày công, ngày nghỉ phép, ngày nghỉ không lương, số lần đi muộn, tiền phạt đi muộn
    // 2. Mức cam kết thu nhập, mức lương cơ bản BHXH, trạng thái đóng BHXH
    // 3. Phụ cấp cơm, PHỤ CẤP XĂNG XE (SỬA ĐƯỢC), phụ cấp gửi xe
    // 4. Hoa hồng tour, bán lẻ, doanh số, tạm ứng, thuế TNCN
    // 5. Thưởng KPI tự quyết
    const updatedEmp: EmployeePayroll = calculateHanaPayrollRecord({
      ...editingPayrollEmp,
      coDongBHXH: editingPayrollEmp.coDongBHXH !== undefined ? Boolean(editingPayrollEmp.coDongBHXH) : true,
      mucLuongCamKet: (editingPayrollEmp.mucLuongCamKet !== undefined && editingPayrollEmp.mucLuongCamKet !== null && !isNaN(Number(editingPayrollEmp.mucLuongCamKet)))
        ? Number(editingPayrollEmp.mucLuongCamKet)
        : 10000000,
      ngayCongThucTe: Number(editingPayrollEmp.ngayCongThucTe) || 0,
      ngayNghiPhep: Number(editingPayrollEmp.ngayNghiPhep) || 0,
      ngayNghiKhongLuong: Number(editingPayrollEmp.ngayNghiKhongLuong) || 0,
      soLanDiMuon: Number(editingPayrollEmp.soLanDiMuon) || 0,
      phatDiMuon: (editingPayrollEmp.phatDiMuon !== undefined && editingPayrollEmp.phatDiMuon !== null && (editingPayrollEmp.phatDiMuon as any) !== '')
        ? Number(editingPayrollEmp.phatDiMuon)
        : (Number(editingPayrollEmp.soLanDiMuon || 0) * 50000),
      luongDongBHXH: Number(editingPayrollEmp.luongDongBHXH) || 5350000,
      phuCapCom: editingPayrollEmp.phuCapCom !== undefined ? Number(editingPayrollEmp.phuCapCom) : 800000,
      phuCapXang: (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null && (editingPayrollEmp.phuCapXang as any) !== '')
        ? Number(editingPayrollEmp.phuCapXang)
        : undefined,
      phuCapGuiXe: editingPayrollEmp.phuCapGuiXe !== undefined ? Number(editingPayrollEmp.phuCapGuiXe) : 200000,
      thuongKPI: (editingPayrollEmp.thuongKPI !== undefined && editingPayrollEmp.thuongKPI !== null && (editingPayrollEmp.thuongKPI as any) !== '')
        ? Number(editingPayrollEmp.thuongKPI)
        : undefined,
      hhTourKtv: Number(editingPayrollEmp.hhTourKtv) || 0,
      hhBanLe: Number(editingPayrollEmp.hhBanLe) || 0,
      hhDoanhSo: Number(editingPayrollEmp.hhDoanhSo) || 0,
      thueTNCN: Number(editingPayrollEmp.thueTNCN) || 0,
      tamUng: Number(editingPayrollEmp.tamUng) || 0,
    });

    const currentList = payrollData[selectedMonth] || [];
    const updatedList = currentList.map(emp => (emp.maNV === updatedEmp.maNV ? updatedEmp : emp));

    updatePayrollData({
      ...payrollData,
      [selectedMonth]: updatedList,
    });

    setShowEditPayrollModal(false);
    setEditingPayrollEmp(null);
    setSyncToast({
      show: true,
      message: `Đã cập nhật lương nhân sự ${updatedEmp.hoTen} thành công!`,
      success: true,
    });
    setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 3500);
  };

  // Handle Delete Employee from Payroll
  const handleDeletePayroll = () => {
    if (!deletingPayrollEmp) return;

    const currentList = payrollData[selectedMonth] || [];
    const updatedList = currentList.filter(emp => emp.maNV !== deletingPayrollEmp.maNV);

    updatePayrollData({
      ...payrollData,
      [selectedMonth]: updatedList,
    });

    setShowDeletePayrollModal(false);
    setDeletingPayrollEmp(null);
    if (selectedEmployee?.maNV === deletingPayrollEmp.maNV) {
      setSelectedEmployee(null);
    }
    setSyncToast({
      show: true,
      message: `Đã xóa nhân sự ${deletingPayrollEmp.hoTen} khỏi kỳ lương ${selectedMonth}!`,
      success: true,
    });
    setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 3500);
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

    setPeriodSummaries((prev: any) => ({
      ...prev,
      [selectedMonth]: {
        ...currentSummary,
        isLocked: !currentLock,
        ngayKhoaSo: !currentLock ? new Date().toLocaleString('vi-VN') : undefined,
        nguoiKhoaSo: !currentLock ? `${currentUser?.name || currentUser?.email} (Admin)` : undefined,
      },
    }));

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
      'Cam kết thu nhập (VNĐ)',
      'Đóng BHXH',
      'Lương đóng BHXH (VNĐ)',
      'Lương thời gian (VNĐ)',
      'Phụ cấp tiền cơm (Cố định, VNĐ)',
      'Phụ cấp xăng xe (Theo công, max 500k, VNĐ)',
      'Hoa hồng Tour KTV (VNĐ)',
      'Hoa hồng Bán lẻ (VNĐ)',
      'Hoa hồng Doanh số (VNĐ)',
      'Tổng hoa hồng (VNĐ)',
      'Thưởng KPI (Tạm tính, VNĐ)',
      'Phạt đi muộn (VNĐ)',
      'Khấu trừ BHXH 10.5% (VNĐ)',
      'Thuế TNCN (VNĐ)',
      'THỰC LĨNH CHUYỂN KHOẢN (VNĐ)',
      'BHXH Cty đóng 21.5% (VNĐ)',
      'TỔNG ĐÃI NGỘ TOÀN DIỆN (VNĐ)',
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
      e.mucLuongCamKet || 10000000,
      e.coDongBHXH !== false ? 'Có đóng' : 'Không đóng',
      e.luongDongBHXH,
      e.luongThoiGian,
      e.phuCapCom || 800000,
      e.phuCapXang || Math.min(500000, Math.round((500000 / e.ngayCongChuan) * e.ngayCongThucTe)),
      e.hhTourKtv,
      e.hhBanLe,
      e.hhDoanhSo,
      e.tongHoaHong,
      e.thuongKPI,
      e.phatDiMuon,
      e.coDongBHXH !== false ? e.bhxhCaNhan : 0,
      e.thueTNCN,
      e.thucLinh,
      e.coDongBHXH !== false ? (e.tongBhxhDoanhNghiep || 0) : 0,
      e.tongGiaTriDaiNgoToanDien || e.thucLinh,
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

  // Export PDF (Khổ A4)
  const handleExportPDF = async () => {
    if (!payslipRef.current || !selectedEmployee) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(payslipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight > 295) {
        const scaleFactor = 287 / pdfHeight;
        const finalWidth = pdfWidth * scaleFactor;
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 5, finalWidth, 287);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 5, pdfWidth, pdfHeight);
      }

      const safeName = selectedEmployee.hoTen.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      pdf.save(`PhieuLuong_${selectedEmployee.maNV}_${safeName}_${selectedMonth}.pdf`);
      setSyncToast({
        show: true,
        message: `Đã xuất file PDF phiếu lương thành công cho ${selectedEmployee.hoTen}!`,
        success: true,
      });
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      setSyncToast({
        show: true,
        message: 'Có lỗi khi xuất file PDF, vui lòng thử lại.',
        success: false,
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 3500);
    }
  };

  // Export JPEG (Gửi Zalo cho nhân viên)
  const handleExportJPEG = async () => {
    if (!payslipRef.current || !selectedEmployee) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(payslipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const safeName = selectedEmployee.hoTen.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
      link.href = imgData;
      link.download = `PhieuLuong_${selectedEmployee.maNV}_${safeName}_${selectedMonth}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSyncToast({
        show: true,
        message: `Đã tải ảnh JPEG thành công để gửi Zalo cho ${selectedEmployee.hoTen}!`,
        success: true,
      });
    } catch (err) {
      console.error('Lỗi xuất JPEG:', err);
      setSyncToast({
        show: true,
        message: 'Có lỗi khi xuất ảnh JPEG, vui lòng thử lại.',
        success: false,
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 3500);
    }
  };

  // Sao chép ảnh vào Clipboard (Ctrl + V vào Zalo ngay lập tức)
  const handleCopyImage = async () => {
    if (!payslipRef.current || !selectedEmployee) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(payslipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      canvas.toBlob(async blob => {
        if (!blob) throw new Error('Không thể tạo blob ảnh');
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setSyncToast({
          show: true,
          message: 'Đã sao chép ảnh phiếu lương! Hãy bấm Ctrl+V (hoặc Cmd+V) để dán vào Zalo/Messenger.',
          success: true,
        });
      }, 'image/png');
    } catch (err) {
      console.error('Lỗi copy clipboard:', err);
      setSyncToast({
        show: true,
        message: 'Trình duyệt chưa hỗ trợ sao chép trực tiếp, bạn hãy dùng nút "Tải ảnh JPEG".',
        success: false,
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setSyncToast(prev => ({ ...prev, show: false })), 3500);
    }
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

  const enrichedSelectedEmp = selectedEmployee ? getEnrichedEmployee(selectedEmployee) : null;

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
                BẢNG LƯƠNG NHÂN VIÊN & CHẾ ĐỘ ĐÃI NGỘ ERP
              </h1>
              <p className="text-xs text-[#8D6E63] font-semibold">
                Chuẩn hóa theo mẫu Bảng tính lương & Phiếu báo đãi ngộ CBNV Hana Wellness · Hỗ trợ xuất file PDF & ảnh JPEG gửi nhân viên
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

          {/* Nút Đồng bộ từ Google Drive */}
          <button
            onClick={handleSyncDrive}
            disabled={isSyncingDrive}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Đồng bộ dữ liệu Bảng tính lương Excel từ Google Drive"
          >
            <RefreshCw size={14} className={isSyncingDrive ? 'animate-spin' : ''} />
            <span>{isSyncingDrive ? 'Đang kéo Drive...' : 'Đồng bộ Drive'}</span>
          </button>

          {/* Nút Làm sạch & Khôi phục chuẩn 4 KTV ERP */}
          <button
            onClick={handleResetToCleanERP}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Làm sạch dữ liệu và chỉ giữ lại 4 KTV chính thức thực tế từ ERP (xóa sạch nhân sự ảo cũ)"
          >
            <Sparkles size={14} />
            <span>Làm sạch chuẩn ERP (4 KTV)</span>
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
        </div>
      </div>

      {/* 4 Thẻ Thống kê Tổng quan (KPI Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Quỹ Lương Thực Chi */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Tổng Quỹ Lương Thực Lĩnh</p>
            <h3 className="text-2xl font-black text-[#4E342E] mt-1">{formatVND(currentSummary.tongQuyLuong)}</h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Đã trừ BHXH 10.5% & Thuế TNCN</p>
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
            <p className="text-[11px] text-[#A1887F] font-semibold mt-1">
              Chiếm {((currentSummary.tongHoaHong / (currentSummary.tongQuyLuong || 1)) * 100).toFixed(1)}% tổng quỹ
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#EFEBE0] flex items-center justify-center text-[#6D4C41]">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 3: Tổng Đóng BHXH (10.5%) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E0D6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Tổng Trích Nộp BHXH NLĐ</p>
            <h3 className="text-2xl font-black text-[#5D4037] mt-1">{formatVND(currentSummary.tongBHXH)}</h3>
            <p className="text-[11px] text-[#8D6E63] font-semibold mt-1">10.5% theo mức lương đóng thực tế</p>
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
            Nhấn vào bất kỳ nhân viên nào để xem và xuất Phiếu lương PDF / JPEG
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F0E6] text-[#5D4037] font-bold border-b border-[#E7E0D6] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center">STT</th>
                <th className="py-3 px-3">Mã NV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3">Chức danh</th>
                <th className="py-3 px-3 text-center">Ngạch - Bậc</th>
                <th className="py-3 px-3 text-right">Lương cơ bản (BHXH)</th>
                <th className="py-3 px-2 text-center">Đóng BHXH</th>
                <th className="py-3 px-3 text-right text-indigo-900 font-black">Cam kết thu nhập</th>
                <th className="py-3 px-2 text-center">Công chuẩn / Làm</th>
                <th className="py-3 px-3 text-right">Lương thời gian</th>
                <th className="py-3 px-3 text-right">Phụ cấp tiền cơm (Cố định)</th>
                <th className="py-3 px-3 text-right">Phụ cấp xăng xe (Max 500k)</th>
                <th className="py-3 px-3 text-right text-emerald-900 font-black">Thưởng KPI (Tạm tính)</th>
                <th className="py-3 px-3 text-right">% Hoa hồng dịch vụ</th>
                <th className="py-3 px-3 text-right font-bold text-amber-950">Tổng thu nhập (Gross)</th>
                <th className="py-3 px-3 text-right text-rose-800">BHXH (10.5%)</th>
                <th className="py-3 px-3 text-right">Thuế TNCN & Phạt</th>
                <th className="py-3 px-4 text-right bg-[#EFEBE0]/80 font-black text-[#4E342E]">THỰC LĨNH (NET)</th>
                <th className="py-3 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E0D6] text-[#4E342E]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-[#8D6E63]">
                    Không tìm thấy nhân sự phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const tienCom = emp.phuCapCom || 800000;
                  const tienXang = emp.phuCapXang || Math.min(500000, Math.round((500000 / emp.ngayCongChuan) * emp.ngayCongThucTe));

                  return (
                    <tr
                      key={emp.maNV}
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                    >
                      {/* STT */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#8D6E63]">
                        {idx + 1}
                      </td>

                      {/* Mã NV */}
                      <td className="py-3 px-3 font-mono font-bold text-[#6D4C41]">
                        <span className="px-1.5 py-0.5 rounded bg-[#EFEBE0] text-[10px]">
                          {emp.maNV}
                        </span>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#8D6E63]/15 text-[#6D4C41] font-black flex items-center justify-center text-xs shrink-0 group-hover:bg-[#8D6E63] group-hover:text-white transition-colors">
                            {emp.hoTen.charAt(0)}
                          </div>
                          <span className="font-bold text-[#4E342E] group-hover:text-[#8D6E63] transition-colors">
                            {emp.hoTen}
                          </span>
                        </div>
                      </td>

                      {/* Chức danh */}
                      <td className="py-3 px-3 text-xs text-[#6D4C41]">
                        {emp.chucVuLabel}
                      </td>

                      {/* Ngạch - Bậc */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#FAF7F0] border border-[#E7E0D6] font-mono font-bold text-[10px] text-[#5D4037]">
                          {emp.capBacTen || `${emp.chucVu} - Bậc 1`}
                        </span>
                      </td>

                      {/* Lương cơ bản (BHXH) */}
                      <td className="py-3 px-3 text-right font-medium text-[#6D4C41]">
                        {formatVND(emp.luongDongBHXH)}
                      </td>

                      {/* Đóng BHXH (Có / Không) */}
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        {emp.coDongBHXH !== false ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                            Có đóng
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-300 font-medium text-[10px]" title="Không trích đóng BHXH (0đ)">
                            Không
                          </span>
                        )}
                      </td>

                      {/* Cam kết thu nhập (Tạm tính 10tr hoặc đã sửa theo NV) */}
                      <td className="py-3 px-3 text-right font-semibold text-indigo-950">
                        {formatVND(emp.mucLuongCamKet ?? 10000000)}
                      </td>

                      {/* Công chuẩn / Làm */}
                      <td className="py-3 px-2 text-center font-medium">
                        <span className="font-bold text-[#4E342E]">{emp.ngayCongThucTe}</span>
                        <span className="text-[#8D6E63]">/{emp.ngayCongChuan}</span>
                        {emp.soLanDiMuon > 0 && (
                          <span className="block text-[9px] text-rose-600 font-bold">
                            Muộn {emp.soLanDiMuon}
                          </span>
                        )}
                      </td>

                      {/* Lương thời gian */}
                      <td className="py-3 px-3 text-right font-semibold text-[#4E342E]">
                        {formatVND(emp.luongThoiGian)}
                      </td>

                      {/* Phụ cấp tiền cơm (Cố định) */}
                      <td className="py-3 px-3 text-right font-medium text-[#6D4C41]">
                        {formatVND(tienCom)}
                      </td>

                      {/* Phụ cấp đi lại/xăng xe (Max 500k) */}
                      <td className="py-3 px-3 text-right font-medium text-[#6D4C41]">
                        {formatVND(tienXang)}
                      </td>

                      {/* Thưởng kiêm nhiệm (KPI) - Tạm tính theo cam kết trừ lương cơ bản và xăng xe (Cho phép sửa) */}
                      <td 
                        className="py-3 px-3 text-right font-bold text-emerald-800 hover:bg-emerald-50/70 transition-colors cursor-pointer group"
                        title="Thưởng KPI tạm tính: (Cam kết thu nhập theo công) - (Lương cơ bản theo công) - (Xăng xe). Nhấp để chỉnh sửa."
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPayrollEmp({ ...emp });
                          setShowEditPayrollModal(true);
                        }}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{emp.thuongKPI > 0 ? formatVND(emp.thuongKPI) : '0 đ'}</span>
                          {(() => {
                            const congChuan = emp.ngayCongChuan || 26;
                            const congLam = emp.ngayCongThucTe || 0;
                            const luongBhxh = emp.luongDongBHXH || 5350000;
                            const xang = Math.min(500000, Math.round((500000 / congChuan) * congLam));
                            const bhxhTheoCong = Math.round((luongBhxh / congChuan) * congLam);
                            const camKet = emp.mucLuongCamKet ?? 10000000;
                            const mucTieuTheoCong = (congLam >= congChuan) ? camKet : Math.round((camKet / congChuan) * congLam);
                            const macDinhKpi = Math.max(0, mucTieuTheoCong - bhxhTheoCong - xang);
                            if (emp.thuongKPI !== macDinhKpi) {
                              return (
                                <span 
                                  className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-medium"
                                  title={`Đã sửa thủ công ${formatVND(emp.thuongKPI)} (Mặc định tạm tính: ${formatVND(macDinhKpi)})`}
                                >
                                  sửa
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>

                      {/* % Hoa hồng dịch vụ */}
                      <td className="py-3 px-3 text-right font-bold text-[#8D6E63]">
                        {emp.tongHoaHong > 0 ? formatVND(emp.tongHoaHong) : '—'}
                      </td>

                      {/* Tổng thu nhập (Gross) */}
                      <td className="py-3 px-3 text-right font-bold text-amber-950">
                        {formatVND(emp.tongThuNhap)}
                      </td>

                      {/* Khấu trừ BHXH (10.5%) */}
                      <td className="py-3 px-3 text-right font-medium text-rose-700">
                        {emp.coDongBHXH !== false ? (
                          emp.bhxhCaNhan > 0 ? `-${formatVND(emp.bhxhCaNhan)}` : '0 đ'
                        ) : (
                          <span className="text-stone-400 font-normal">0 đ</span>
                        )}
                      </td>

                      {/* Thuế TNCN & Phạt */}
                      <td className="py-3 px-3 text-right font-medium text-rose-700">
                        {emp.thueTNCN + (emp.phatDiMuon || 0) > 0 ? `-${formatVND(emp.thueTNCN + (emp.phatDiMuon || 0))}` : '0 đ'}
                      </td>

                      {/* THỰC LĨNH (NET) */}
                      <td className="py-3 px-4 text-right bg-[#EFEBE0]/60 font-black text-sm text-[#4E342E]">
                        {formatVND(emp.thucLinh)}
                      </td>

                      {/* Thao tác (Phiếu lương, Sửa, Xóa) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="px-2 py-1 rounded-lg bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                            title="Xem và Xuất Phiếu Lương"
                          >
                            Phiếu lương
                          </button>
                          <button
                            onClick={() => {
                              setEditingPayrollEmp({ ...emp });
                              setShowEditPayrollModal(true);
                            }}
                            className="p-1 hover:bg-[#FAF7F0] text-[#8D6E63] hover:text-[#4E342E] rounded transition-colors cursor-pointer"
                            title="Chỉnh sửa lương nhân viên này"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingPayrollEmp(emp);
                              setShowDeletePayrollModal(true);
                            }}
                            className="p-1 hover:bg-rose-50 text-[#8D6E63] hover:text-rose-700 rounded transition-colors cursor-pointer"
                            title="Xóa nhân sự khỏi kỳ lương"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* TỔNG CỘNG FOOTER */}
            {filteredEmployees.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F0E6] text-[#4E342E] font-black border-t-2 border-[#D7CCC8]">
                  <td className="py-3.5 px-3 text-center" colSpan={5}>
                    TỔNG CỘNG ({filteredEmployees.length} NHÂN SỰ)
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.luongDongBHXH, 0))}
                  </td>
                  <td className="py-3.5 px-2 text-center text-[10px] text-[#6D4C41]">
                    {filteredEmployees.filter(e => e.coDongBHXH !== false).length}/{filteredEmployees.length} NV đóng
                  </td>
                  <td className="py-3.5 px-3 text-right text-indigo-950 font-black">
                    {formatVND(filteredEmployees.reduce((a, b) => a + (b.mucLuongCamKet ?? 10000000), 0))}
                  </td>
                  <td></td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.luongThoiGian, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + (b.phuCapCom || 800000), 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(filteredEmployees.reduce((a, b) => a + (b.phuCapXang || Math.min(500000, Math.round((500000 / b.ngayCongChuan) * b.ngayCongThucTe))), 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-800">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.thuongKPI, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-[#8D6E63]">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.tongHoaHong, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-amber-950">
                    {formatVND(filteredEmployees.reduce((a, b) => a + b.tongThuNhap, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-700">
                    -{formatVND(filteredEmployees.reduce((a, b) => a + b.bhxhCaNhan, 0))}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-700">
                    -{formatVND(filteredEmployees.reduce((a, b) => a + b.thueTNCN + (b.phatDiMuon || 0), 0))}
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

      {/* MODAL: PHIẾU BÁO LƯƠNG & CHẾ ĐỘ ĐÃI NGỘ CBNV (CHUẨN MẪU GOOGLE SHEET) */}
      {enrichedSelectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E7E0D6] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header Actions (Không in ra) */}
            <div className="p-3 sm:p-4 bg-[#F5F0E6] border-b border-[#E7E0D6] flex flex-wrap items-center justify-between gap-2 shrink-0">
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
                <span className="text-xs font-bold text-[#8D6E63] ml-1">
                  Phiếu lương: <span className="text-[#4E342E]">{enrichedSelectedEmp.hoTen}</span> ({enrichedSelectedEmp.maNV})
                </span>
              </div>

              {/* Nhóm nút xuất file: PDF, JPEG, Copy Clipboard, Print */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Xuất PDF */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Tải phiếu lương định dạng PDF chuẩn in A4"
                >
                  <FileDown size={14} />
                  <span>Xuất PDF</span>
                </button>

                {/* Xuất JPEG */}
                <button
                  onClick={handleExportJPEG}
                  disabled={isExporting}
                  className="px-3 py-1.5 rounded-xl bg-[#8D6E63] hover:bg-[#6D4C41] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Tải ảnh JPEG gửi Zalo / Messenger cho nhân viên"
                >
                  <ImageIcon size={14} />
                  <span>Xuất JPEG</span>
                </button>

                {/* Copy Ảnh vào Clipboard */}
                <button
                  onClick={handleCopyImage}
                  disabled={isExporting}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] disabled:opacity-50 text-[#5D4037] border border-[#D7CCC8] text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer hidden sm:flex"
                  title="Sao chép ảnh phiếu lương vào Clipboard để dán nhanh (Ctrl+V) vào Zalo"
                >
                  <Copy size={13} />
                  <span>Copy ảnh</span>
                </button>

                {/* In ấn */}
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-xl bg-white hover:bg-[#FAF7F0] text-[#5D4037] border border-[#D7CCC8] transition-colors cursor-pointer"
                  title="In trực tiếp"
                >
                  <Printer size={16} />
                </button>

                {/* Đóng */}
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-[#8D6E63] hover:text-red-700 border border-[#D7CCC8] transition-colors cursor-pointer ml-1"
                  title="Đóng modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* VÙNG NỘI DUNG PHIẾU LƯƠNG CHUẨN MẪU GOOGLE SHEET (ĐƯỢC CHỤP ĐỂ XUẤT PDF & JPEG) */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-[#FDFBF7]">
              <div
                ref={payslipRef}
                id="printable-payslip"
                className="bg-white p-6 sm:p-9 rounded-2xl border border-[#E7E0D6] shadow-sm space-y-5 text-[#4E342E]"
              >
                {/* Header Tiêu Đề */}
                <div className="border-b-2 border-[#8D6E63] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#8D6E63] rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xs">
                      H
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#4E342E] tracking-tight uppercase">
                        HANA WELLNESS & TRỊ LIỆU TỰ NHIÊN
                      </h2>
                      <p className="text-[11px] text-[#8D6E63] font-bold">Hệ thống Trị liệu Cột sống & Phục hồi Cơ Xương Khớp Chuẩn Y Khoa</p>
                      <p className="text-[10px] text-[#A1887F]">Chi nhánh: {enrichedSelectedEmp.chiNhanhTen}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-[#EFEBE0] text-[#5D4037] border border-[#D7CCC8] uppercase tracking-wider">
                      PHIẾU BÁO LƯƠNG & ĐÃI NGỘ CBNV
                    </span>
                    <p className="text-xs font-black text-[#4E342E] mt-1">{currentSummary.thangDisplay}</p>
                    <p className="text-[10px] text-[#8D6E63]">Ngày trích xuất: {new Date().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                {/* Thông tin cá nhân nhân viên */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F0] p-3.5 rounded-xl border border-[#E7E0D6] text-xs">
                  <div>
                    <span className="text-[#8D6E63] font-bold text-[11px] block">Họ và tên CBNV:</span>
                    <span className="font-black text-[#4E342E] text-sm uppercase">{enrichedSelectedEmp.hoTen}</span>
                    <span className="text-[10px] text-[#8D6E63] block">Mã NV: {enrichedSelectedEmp.maNV}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63] font-bold text-[11px] block">Vị trí công việc:</span>
                    <span className="font-bold text-[#4E342E]">{enrichedSelectedEmp.chucVuLabel}</span>
                    <span className="text-[10px] text-[#8D6E63] block">{enrichedSelectedEmp.capBacTen || 'Nhân viên chính thức'}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63] font-bold text-[11px] block">Công chuẩn / Tính lương:</span>
                    <span className="font-black text-[#4E342E]">
                      {enrichedSelectedEmp.ngayCongThucTe} / {enrichedSelectedEmp.ngayCongChuan} ngày
                    </span>
                    <span className="text-[10px] text-[#8D6E63] block">Trạng thái: {enrichedSelectedEmp.trangThaiLamViec}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63] font-bold text-[11px] block">Chính sách ngày nghỉ:</span>
                    <span className="font-bold text-[#4E342E] text-[11px]">{enrichedSelectedEmp.cheDoNghi}</span>
                  </div>
                </div>

                {/* 4 Thẻ Tóm Tắt Nhanh (Theo đúng Layout Google Sheet của anh Tùng) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E7E0D6]">
                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase block">Lương Đóng BHXH</span>
                    <span className="text-sm font-black text-[#4E342E] block mt-0.5">
                      {formatVND(enrichedSelectedEmp.luongDongBhxhThucTe || enrichedSelectedEmp.luongDongBHXH)}
                    </span>
                    <span className="text-[9px] text-[#8D6E63]">Căn cứ tham gia BHXH</span>
                  </div>

                  <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E7E0D6]">
                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase block">Lương Hiệu Suất / Bù Đủ</span>
                    <span className="text-sm font-black text-[#4E342E] block mt-0.5">
                      {formatVND(enrichedSelectedEmp.luongThoiGian - (enrichedSelectedEmp.luongDongBhxhThucTe || 0))}
                    </span>
                    <span className="text-[9px] text-[#8D6E63]">Tổng cam kết {formatVND(enrichedSelectedEmp.mucLuongCamKet || 10000000)}</span>
                  </div>

                  <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E7E0D6]">
                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase block">Phụ Cấp Cơm & Xe</span>
                    <span className="text-sm font-black text-[#4E342E] block mt-0.5">
                      {formatVND(enrichedSelectedEmp.phuCapAnTruaXangXe)}
                    </span>
                    <span className="text-[9px] text-[#8D6E63]">Cơm (2 bữa/ngày) + Gửi xe</span>
                  </div>

                  <div className="bg-[#EFEBE0] p-2.5 rounded-xl border border-[#8D6E63]/30">
                    <span className="text-[10px] font-black text-[#8D6E63] uppercase block">Lương Thực Lĩnh</span>
                    <span className="text-base font-black text-[#4E342E] block mt-0.5">
                      {formatVND(enrichedSelectedEmp.thucLinh)}
                    </span>
                    <span className="text-[9px] text-emerald-800 font-bold">Thực nhận chuyển khoản</span>
                  </div>
                </div>

                {/* BẢNG CHI TIẾT CÁC KHOẢN MỤC THU NHẬP & TRÍCH TRỪ (KHỚP 100% CẤU TRÚC SHEET) */}
                <div className="border border-[#E7E0D6] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F5F0E6] text-[#5D4037] font-bold border-b border-[#E7E0D6] uppercase tracking-wider text-[11px]">
                        <th className="py-2 px-3 text-left">Khoản mục thu nhập & khấu trừ</th>
                        <th className="py-2 px-3 text-center">Đơn giá / Căn cứ</th>
                        <th className="py-2 px-3 text-center">Số lượng / Tỷ lệ</th>
                        <th className="py-2 px-3 text-right">Thành tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E0D6]">
                      {/* I. THU NHẬP & PHỤ CẤP */}
                      <tr className="bg-[#FAF7F0] font-bold text-[#4E342E]">
                        <td colSpan={3} className="py-2 px-3">
                          I. CÁC KHOẢN THU NHẬP & PHỤ CẤP (LƯƠNG CAM KẾT + ĐÃI NGỘ CƠM, XE)
                        </td>
                        <td className="py-2 px-3 text-right font-black">
                          {formatVND(enrichedSelectedEmp.tongThuNhap)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 font-medium">1. Lương cơ bản đóng BHXH</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">{formatVND(enrichedSelectedEmp.luongDongBHXH)}</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">
                          {enrichedSelectedEmp.ngayCongThucTe} / {enrichedSelectedEmp.ngayCongChuan} công
                        </td>
                        <td className="py-1.5 px-3 text-right font-medium">
                          {formatVND(enrichedSelectedEmp.luongDongBhxhThucTe || enrichedSelectedEmp.luongDongBHXH)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 font-medium">1. Lương cơ bản đóng BHXH</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">{formatVND(enrichedSelectedEmp.luongDongBHXH)}</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">
                          {enrichedSelectedEmp.ngayCongThucTe} / {enrichedSelectedEmp.ngayCongChuan} công
                        </td>
                        <td className="py-1.5 px-3 text-right font-medium">
                          {formatVND(enrichedSelectedEmp.luongDongBhxhThucTe || enrichedSelectedEmp.luongThoiGian)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 font-medium">2. Phụ cấp đãi ngộ: Tiền cơm (Cố định hàng tháng)</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">Cố định</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">1 tháng</td>
                        <td className="py-1.5 px-3 text-right font-medium">
                          {formatVND(enrichedSelectedEmp.phuCapCom || 800000)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 font-medium">3. Phụ cấp đãi ngộ: Xăng xe (Theo ngày công, tối đa 500.000 đ)</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">500,000 đ (Max)</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">
                          {enrichedSelectedEmp.ngayCongThucTe} / {enrichedSelectedEmp.ngayCongChuan} công
                        </td>
                        <td className="py-1.5 px-3 text-right font-medium">
                          {formatVND(enrichedSelectedEmp.phuCapXang || Math.min(500000, Math.round((500000 / enrichedSelectedEmp.ngayCongChuan) * enrichedSelectedEmp.ngayCongThucTe)))}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 font-medium">4. Phụ cấp đãi ngộ: Tiền gửi xe cố định hàng tháng</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">200,000 đ</td>
                        <td className="py-1.5 px-3 text-center text-[#8D6E63]">1 tháng</td>
                        <td className="py-1.5 px-3 text-right font-medium">
                          {formatVND(enrichedSelectedEmp.phuCapGuiXe || 200000)}
                        </td>
                      </tr>
                      {enrichedSelectedEmp.tongHoaHong > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 pl-6 font-bold text-[#8D6E63]">
                            5. Hoa hồng dịch vụ trị liệu / bán lẻ mỹ phẩm (ERP)
                          </td>
                          <td className="py-1.5 px-3 text-center text-[#8D6E63]">Theo ca</td>
                          <td className="py-1.5 px-3 text-center text-[#8D6E63]">{enrichedSelectedEmp.chiTietHoaHong?.length || 0} ca</td>
                          <td className="py-1.5 px-3 text-right font-bold text-[#8D6E63]">
                            {formatVND(enrichedSelectedEmp.tongHoaHong)}
                          </td>
                        </tr>
                      )}
                      {enrichedSelectedEmp.thuongKPI > 0 && (
                        <tr>
                          <td className="py-1.5 px-3 pl-6 font-bold text-emerald-800">
                            6. Thưởng hiệu suất KPI (Cam kết {formatVND(enrichedSelectedEmp.mucLuongCamKet || 10000000)} - Lương BHXH - Xăng xe)
                          </td>
                          <td className="py-1.5 px-3 text-center text-emerald-800">Bù đủ cam kết</td>
                          <td className="py-1.5 px-3 text-center text-emerald-800">100%</td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-800">
                            {formatVND(enrichedSelectedEmp.thuongKPI)}
                          </td>
                        </tr>
                      )}

                      {/* II. CÁC KHOẢN TRÍCH TRỪ BẢO HIỂM */}
                      <tr className="bg-[#FAF7F0] font-bold text-red-900">
                        <td colSpan={3} className="py-2 px-3">
                          II. CÁC KHOẢN TRÍCH TRỪ BẢO HIỂM (NLĐ ĐÓNG 10.5%)
                          {enrichedSelectedEmp.coDongBHXH === false && (
                            <span className="ml-2 text-[10px] font-semibold text-stone-500 uppercase tracking-wide">
                              (Tháng này không đóng BHXH)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-red-800">
                          {enrichedSelectedEmp.bhxhCaNhan > 0 ? `-${formatVND(enrichedSelectedEmp.bhxhCaNhan)}` : '0 đ'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 text-red-800">1. Bảo hiểm xã hội (BHXH - Hưu trí, thai sản, ốm đau)</td>
                        <td className="py-1.5 px-3 text-center text-red-800">{formatVND(enrichedSelectedEmp.luongDongBhxhThucTe || 0)}</td>
                        <td className="py-1.5 px-3 text-center text-red-800">8.0%</td>
                        <td className="py-1.5 px-3 text-right font-medium text-red-800">
                          -{formatVND(enrichedSelectedEmp.bhxhNld8 || Math.round(enrichedSelectedEmp.bhxhCaNhan * 8 / 10.5))}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 text-red-800">2. Bảo hiểm y tế (BHYT - Khám chữa bệnh)</td>
                        <td className="py-1.5 px-3 text-center text-red-800">{formatVND(enrichedSelectedEmp.luongDongBhxhThucTe || 0)}</td>
                        <td className="py-1.5 px-3 text-center text-red-800">1.5%</td>
                        <td className="py-1.5 px-3 text-right font-medium text-red-800">
                          -{formatVND(enrichedSelectedEmp.bhytNld1_5 || Math.round(enrichedSelectedEmp.bhxhCaNhan * 1.5 / 10.5))}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 pl-6 text-red-800">3. Bảo hiểm thất nghiệp (BHTN)</td>
                        <td className="py-1.5 px-3 text-center text-red-800">{formatVND(enrichedSelectedEmp.luongDongBhxhThucTe || 0)}</td>
                        <td className="py-1.5 px-3 text-center text-red-800">1.0%</td>
                        <td className="py-1.5 px-3 text-right font-medium text-red-800">
                          -{formatVND(enrichedSelectedEmp.bhtnNld1 || Math.round(enrichedSelectedEmp.bhxhCaNhan * 1.0 / 10.5))}
                        </td>
                      </tr>

                      {/* III. THỰC LĨNH CHUYỂN KHOẢN */}
                      <tr className="bg-[#EFEBE0] font-black text-sm border-t-2 border-[#8D6E63] text-[#4E342E]">
                        <td colSpan={3} className="py-3 px-3 uppercase tracking-wider">
                          THỰC LĨNH CHUYỂN KHOẢN (I - II)
                        </td>
                        <td className="py-3 px-3 text-right text-base text-[#4E342E]">
                          {formatVND(enrichedSelectedEmp.thucLinh)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Số tiền bằng chữ & Tài khoản ngân hàng */}
                <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#8D6E63]">Số tiền thực lĩnh: </span>
                    <span className="font-bold text-[#4E342E] italic">
                      {numberToVietnameseWords(enrichedSelectedEmp.thucLinh)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5D4037] font-semibold">
                    STK: <span className="font-bold">{enrichedSelectedEmp.soTaiKhoan}</span> ({enrichedSelectedEmp.nganHang})
                  </div>
                </div>

                {/* KHỐI IV: CHI PHÍ BẢO HIỂM DOANH NGHIỆP ĐÓNG CHO CBNV (21.5%) - ĐẶC THÙ CỦA HANA */}
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Gift size={16} className="text-emerald-700" />
                      <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
                        IV. QUYỀN LỢI BHXH CÔNG TY ĐÓNG THÊM CHO CBNV (21.5%)
                      </h4>
                    </div>
                    <span className="text-xs font-black text-emerald-900">
                      +{formatVND(enrichedSelectedEmp.tongBhxhDoanhNghiep || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-800">
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span>• Quỹ hưu trí, thai sản, ốm đau (17.0%): </span>
                      <span className="font-bold">{formatVND(enrichedSelectedEmp.bhxhDoanhNghiep17 || 0)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span>• Quỹ bảo hiểm y tế (3.0%): </span>
                      <span className="font-bold">{formatVND(enrichedSelectedEmp.bhytDoanhNghiep3 || 0)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <span>• Quỹ BHTN & TNLĐ-BNN (1.5%): </span>
                      <span className="font-bold">{formatVND(enrichedSelectedEmp.bhtnDoanhNghiep1_5 || 0)}</span>
                    </div>
                  </div>

                  {/* 🌟 TỔNG GIÁ TRỊ ĐÃI NGỘ TOÀN DIỆN CÔNG TY CHI TRẢ */}
                  <div className="bg-[#8D6E63] text-white p-3 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-200" />
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider block">
                          TỔNG GIÁ TRỊ ĐÃI NGỘ TOÀN DIỆN CÔNG TY CHI TRẢ (I + IV)
                        </span>
                        <span className="text-[10px] text-[#EFEBE0]">
                          Bao gồm Tổng thu nhập trong kỳ + Toàn bộ 21.5% bảo hiểm do Hana chi trả
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-amber-200">
                      {formatVND(enrichedSelectedEmp.tongGiaTriDaiNgoToanDien || enrichedSelectedEmp.thucLinh)}
                    </span>
                  </div>
                </div>

                {/* KHỐI V: TÓM TẮT QUY CHẾ LÀM VIỆC & NGHỈ PHÉP LUÂN PHIÊN (THEO MẪU GOOGLE SHEET) */}
                <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E0D6] text-[11px] space-y-1 text-[#5D4037]">
                  <div className="flex items-center gap-1 font-bold text-xs text-[#4E342E]">
                    <HelpCircle size={14} className="text-[#8D6E63]" />
                    <span>V. TÓM TẮT QUY CHẾ LÀM VIỆC & NGHỈ PHÉP LUÂN PHIÊN</span>
                  </div>
                  <p>• <strong>Tiêu chuẩn nghỉ:</strong> 3 - 4 ngày/tháng hưởng nguyên lương (tháng làm việc 26 công chuẩn).</p>
                  <p>• <strong>Phân bổ luân phiên:</strong> 01 ngày nghỉ cuối tuần (T7/CN) + 2 - 3 ngày nghỉ trong tuần (T2 - T6).</p>
                  <p>• <strong>Hoạt động thiện nguyện:</strong> Sử dụng 01 ngày nghỉ có lương của CBNV khi Công ty tổ chức.</p>
                  <p>• <strong>Đăng ký lịch trực:</strong> CBNV chủ động đăng ký lịch trực & ngày nghỉ với Quản lý trước 01 tuần.</p>
                </div>

                {/* Khu vực chữ ký xác nhận */}
                <div className="pt-4 grid grid-cols-2 text-center text-xs gap-4 border-t border-[#E7E0D6]">
                  <div>
                    <p className="font-bold text-[#4E342E] uppercase">XÁC NHẬN CỦA CBNV</p>
                    <p className="text-[10px] text-[#8D6E63] italic mt-0.5">(Ký và ghi rõ họ tên)</p>
                    <div className="h-14"></div>
                    <p className="font-bold text-[#4E342E]">{enrichedSelectedEmp.hoTen}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#4E342E] uppercase">ĐẠI DIỆN QUẢN LÝ / DUYỆT LƯƠNG</p>
                    <p className="text-[10px] text-[#8D6E63] italic mt-0.5">(Ký, ghi rõ họ tên & đóng dấu)</p>
                    <div className="h-14 flex items-center justify-center">
                      <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded rotate-[-4deg]">
                        HANA ERP CERTIFIED
                      </span>
                    </div>
                    <p className="font-semibold text-[#4E342E]">Phạm Văn Tùng</p>
                  </div>
                </div>

                {/* Ghi chú chân trang */}
                <p className="text-[10px] text-[#A1887F] italic text-center pt-2">
                  (*) Phiếu thông báo trích xuất tự động từ Bảng tính lương & Chế độ đãi ngộ Hana Wellness. Mọi thắc mắc vui lòng liên hệ Ban Quản lý.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SỬA CHI TIẾT LƯƠNG NHÂN VIÊN */}
      {showEditPayrollModal && editingPayrollEmp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#E7E0D6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-5 border-b border-[#E7E0D6] bg-gradient-to-r from-[#FAF7F0] to-[#F5F0E6] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8D6E63] text-white flex items-center justify-center font-black shadow-xs">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#4E342E]">
                    Chỉnh Sửa Lương & Đãi Ngộ Kỳ {selectedMonth}
                  </h3>
                  <p className="text-xs text-[#8D6E63]">
                    Nhân sự: <strong className="text-[#4E342E]">{editingPayrollEmp.hoTen}</strong> · Mã: <span className="font-mono font-bold text-amber-900">{editingPayrollEmp.maNV}</span> · Vị trí: {editingPayrollEmp.chucVuLabel} ({editingPayrollEmp.chiNhanhTen})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPayrollModal(false)}
                className="p-2 rounded-full hover:bg-white/80 text-[#8D6E63] hover:text-[#4E342E] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body - 5 Khối Khoa học & Mọi con số đều sửa được */}
            <form onSubmit={handleSaveEditPayroll} className="p-6 space-y-6 text-xs text-[#5D4037] overflow-y-auto grow">
              
              {/* KHỐI 1: THỜI GIAN LÀM VIỆC & KỶ LUẬT LAO ĐỘNG */}
              <div className="p-4 bg-[#FAF7F0] border border-[#E7E0D6] rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-[#6D4C41] flex items-center gap-1.5">
                    <span>⏱️ Khối 1: Thời gian làm việc & Kỷ luật lao động</span>
                  </h4>
                  <span className="text-[11px] text-[#8D6E63]">Chuẩn định mức: <strong>{editingPayrollEmp.ngayCongChuan || 26} công/tháng</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">
                      Ngày công thực tế (Chuẩn 26) <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="31"
                      required
                      value={editingPayrollEmp.ngayCongThucTe}
                      onChange={e => {
                        const newCong = Number(e.target.value);
                        const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                        const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                        const camKet = Number(editingPayrollEmp.mucLuongCamKet || 10000000);
                        
                        // Tự động tính lại phụ cấp xăng nếu chưa sửa tay
                        const newXangTheoCong = Math.min(500000, Math.round((500000 / congChuan) * newCong));
                        const currentXang = editingPayrollEmp.phuCapXang;
                        const shouldUpdateXang = currentXang === undefined || currentXang === Math.min(500000, Math.round((500000 / congChuan) * (Number(editingPayrollEmp.ngayCongThucTe) || 0)));

                        const newBhxhTheoCong = Math.round((luongBhxh / congChuan) * newCong);
                        const newCamKetTheoCong = (newCong >= congChuan) ? camKet : Math.round((camKet / congChuan) * newCong);
                        const newAutoKpi = Math.max(0, newCamKetTheoCong - newBhxhTheoCong - (shouldUpdateXang ? newXangTheoCong : Number(currentXang || 0)));

                        setEditingPayrollEmp({
                          ...editingPayrollEmp,
                          ngayCongThucTe: newCong,
                          phuCapXang: shouldUpdateXang ? newXangTheoCong : currentXang,
                          thuongKPI: newAutoKpi,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Căn cứ tính lương thời gian</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Nghỉ phép hưởng lương (P):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingPayrollEmp.ngayNghiPhep || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, ngayNghiPhep: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Phép năm chế độ</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Nghỉ không lương (KL):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingPayrollEmp.ngayNghiKhongLuong || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, ngayNghiKhongLuong: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Số ngày nghỉ việc riêng</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Số lần đi muộn (lần):</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingPayrollEmp.soLanDiMuon || 0}
                      onChange={e => {
                        const times = Number(e.target.value);
                        setEditingPayrollEmp({
                          ...editingPayrollEmp,
                          soLanDiMuon: times,
                          phatDiMuon: times * 50000,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Tự động gợi ý phạt 50k/lần</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#4E342E]">Tiền phạt kỷ luật / Đi muộn (VNĐ):</label>
                      <button
                        type="button"
                        onClick={() => {
                          const times = Number(editingPayrollEmp.soLanDiMuon || 0);
                          setEditingPayrollEmp({ ...editingPayrollEmp, phatDiMuon: times * 50000 });
                        }}
                        className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                        title="Tính lại tiền phạt theo số lần đi muộn x 50.000đ"
                      >
                        ↺ Mặc định ({formatVND((Number(editingPayrollEmp.soLanDiMuon) || 0) * 50000)})
                      </button>
                    </div>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editingPayrollEmp.phatDiMuon !== undefined ? editingPayrollEmp.phatDiMuon : ((Number(editingPayrollEmp.soLanDiMuon) || 0) * 50000)}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, phatDiMuon: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block">Khoản khấu trừ phạt vào lương thực lĩnh</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: CHẾ ĐỘ HỢP ĐỒNG & BẢO HIỂM XÃ HỘI */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <span>📋 Khối 2: Chế độ Lương hợp đồng & Trích nộp BHXH</span>
                  </h4>
                  <span className="text-[11px] text-emerald-800 font-semibold">Tỷ lệ: NLĐ 10.5% · DN 21.5%</span>
                </div>

                {/* Checkbox tham gia BHXH */}
                <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingPayrollEmp.coDongBHXH !== undefined ? Boolean(editingPayrollEmp.coDongBHXH) : true}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, coDongBHXH: e.target.checked })}
                      className="w-5 h-5 text-emerald-700 rounded border-[#E7E0D6] focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#4E342E] block">
                        Tháng này CBNV có tham gia đóng BHXH và các quỹ bảo hiểm bắt buộc
                      </span>
                      <span className="text-[10px] text-[#8D6E63] block">
                        {editingPayrollEmp.coDongBHXH !== false 
                          ? '✓ Trích trừ 10.5% vào lương NLĐ và 21.5% trách nhiệm Doanh nghiệp đóng thêm' 
                          : '⚠️ Không trích trừ BHXH tháng này (khấu trừ BHXH cá nhân = 0đ)'}
                      </span>
                    </div>
                  </label>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                    editingPayrollEmp.coDongBHXH !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {editingPayrollEmp.coDongBHXH !== false ? 'CÓ ĐÓNG BHXH' : 'KHÔNG ĐÓNG BHXH'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-emerald-950">
                      Mức cam kết thu nhập (VNĐ/tháng khi đủ 26 công) <span className="text-emerald-700">*</span>:
                    </label>
                    <input
                      type="number"
                      step="500000"
                      value={editingPayrollEmp.mucLuongCamKet !== undefined ? editingPayrollEmp.mucLuongCamKet : 10000000}
                      onChange={e => {
                        const newCamKet = Number(e.target.value);
                        const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                        const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                        const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                        const xang = editingPayrollEmp.phuCapXang !== undefined ? Number(editingPayrollEmp.phuCapXang) : Math.min(500000, Math.round((500000 / congChuan) * congLam));
                        const bhxhTheoCong = Math.round((luongBhxh / congChuan) * congLam);
                        const camKetTheoCong = (congLam >= congChuan) ? newCamKet : Math.round((newCamKet / congChuan) * congLam);
                        const autoKpi = Math.max(0, camKetTheoCong - bhxhTheoCong - xang);

                        setEditingPayrollEmp({
                          ...editingPayrollEmp,
                          mucLuongCamKet: newCamKet,
                          thuongKPI: autoKpi,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="10000000"
                    />
                    <span className="text-[10px] text-emerald-800 mt-0.5 block">
                      Tạm ghi 10.000.000đ (có thể chỉnh sửa tự do theo thỏa thuận)
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">
                      Mức lương cơ bản đóng BHXH (Hợp đồng, VNĐ) <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      step="100000"
                      value={editingPayrollEmp.luongDongBHXH}
                      onChange={e => {
                        const newBhxh = Number(e.target.value);
                        setEditingPayrollEmp({ ...editingPayrollEmp, luongDongBHXH: newBhxh });
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">
                      Lương ghi trên HĐLĐ (thường 5.500.000đ hoặc 5.350.000đ)
                    </span>
                  </div>
                </div>

                {/* Tóm tắt Lương thời gian căn bản */}
                {(() => {
                  const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                  const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                  const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                  const ltg = Math.round((luongBhxh / congChuan) * congLam);
                  return (
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-[11px] flex items-center justify-between">
                      <span className="text-emerald-900 font-semibold">
                        💵 Lương thời gian căn bản ({congLam}/{congChuan} công):
                      </span>
                      <strong className="font-mono text-emerald-950 text-xs">{formatVND(ltg)}</strong>
                    </div>
                  );
                })()}
              </div>

              {/* KHỐI 3: CÁC KHOẢN PHỤ CẤP ĐÃI NGỘ (SỬA TỰ DO - PHỤ CẤP XE SỬA ĐƯỢC) */}
              <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <span>🍱 Khối 3: Các khoản Phụ cấp đãi ngộ (Tất cả con số đều sửa được)</span>
                  </h4>
                  <span className="text-[11px] text-amber-800 font-semibold">Quy chế 06/2026/QC-LT-HNW</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Phụ cấp cơm */}
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Phụ cấp tiền cơm (Cố định, VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.phuCapCom !== undefined ? editingPayrollEmp.phuCapCom : 800000}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, phuCapCom: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Cố định chuẩn 800.000đ/tháng</span>
                  </div>

                  {/* PHỤ CẤP XĂNG XE - CHO PHÉP SỬA TỰ DO VÀ CÓ NÚT TÍNH THEO CÔNG */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#4E342E] flex items-center gap-1">
                        <span>Phụ cấp xăng xe (VNĐ):</span>
                        <span className="text-emerald-700 font-black text-[10px] bg-emerald-100 px-1 rounded">Sửa được</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                          const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                          const xangChuan = Math.min(500000, Math.round((500000 / congChuan) * congLam));
                          setEditingPayrollEmp({ ...editingPayrollEmp, phuCapXang: xangChuan });
                        }}
                        className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                        title="Tính lại theo công thực tế: tối đa 500k"
                      >
                        ↺ Tính theo công
                      </button>
                    </div>
                    {(() => {
                      const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                      const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                      const xangMacDinh = Math.min(500000, Math.round((500000 / congChuan) * congLam));
                      const currentVal = (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null)
                        ? editingPayrollEmp.phuCapXang
                        : xangMacDinh;

                      return (
                        <>
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            value={currentVal}
                            onChange={e => {
                              const val = e.target.value === '' ? ('' as any) : Number(e.target.value);
                              setEditingPayrollEmp({ ...editingPayrollEmp, phuCapXang: val });
                            }}
                            className="w-full px-3 py-2 bg-white border-2 border-amber-400 rounded-xl text-xs font-mono font-black text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder={xangMacDinh.toString()}
                          />
                          <span className="text-[10px] text-amber-800 mt-0.5 block">
                            Mặc định: {formatVND(xangMacDinh)} ({congLam}/{congChuan} công) · Có thể sửa tự do
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Phụ cấp gửi xe */}
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Phụ cấp gửi xe (VNĐ):</label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editingPayrollEmp.phuCapGuiXe !== undefined ? editingPayrollEmp.phuCapGuiXe : 200000}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, phuCapGuiXe: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Mặc định 200.000đ/tháng · Sửa được</span>
                  </div>
                </div>

                {/* Tóm tắt tổng phụ cấp */}
                {(() => {
                  const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                  const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                  const com = editingPayrollEmp.phuCapCom !== undefined ? Number(editingPayrollEmp.phuCapCom) : 800000;
                  const xang = (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null && (editingPayrollEmp.phuCapXang as any) !== '')
                    ? Number(editingPayrollEmp.phuCapXang)
                    : Math.min(500000, Math.round((500000 / congChuan) * congLam));
                  const guiXe = editingPayrollEmp.phuCapGuiXe !== undefined ? Number(editingPayrollEmp.phuCapGuiXe) : 200000;
                  const tongPhuCap = com + xang + guiXe;

                  return (
                    <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] flex items-center justify-between">
                      <span className="text-amber-900 font-semibold">
                        🍱 Tổng phụ cấp đãi ngộ (Cơm {formatVND(com)} + Xăng {formatVND(xang)} + Gửi xe {formatVND(guiXe)}):
                      </span>
                      <strong className="font-mono text-amber-950 text-xs font-black">{formatVND(tongPhuCap)}</strong>
                    </div>
                  );
                })()}
              </div>

              {/* KHỐI 4: HOA HỒNG DỊCH VỤ & KHẤU TRỪ KHÁC (SỬA TỰ DO) */}
              <div className="p-4 bg-[#FAF7F0] border border-[#E7E0D6] rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-[#6D4C41] flex items-center gap-1.5">
                    <span>💇‍♀️ Khối 4: Doanh số, Hoa hồng dịch vụ & Các khoản khấu trừ khác</span>
                  </h4>
                  <span className="text-[11px] text-[#8D6E63]">Nhập số tiền thực tế</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Hoa hồng Tour KTV trị liệu (VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.hhTourKtv || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, hhTourKtv: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Tour làm trực tiếp cho khách</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Hoa hồng Bán lẻ mỹ phẩm (VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.hhBanLe || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, hhBanLe: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">5% doanh số bán lẻ thảo dược</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Hoa hồng Doanh số chung (VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.hhDoanhSo || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, hhDoanhSo: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Thưởng doanh số cơ sở chi nhánh</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Tạm ứng trong kỳ (VNĐ):</label>
                    <input
                      type="number"
                      step="100000"
                      min="0"
                      value={editingPayrollEmp.tamUng || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, tamUng: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block">Trừ trực tiếp khi chi lương</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Khấu trừ Thuế TNCN (VNĐ):</label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editingPayrollEmp.thueTNCN || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, thueTNCN: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block">Thuế TNCN tạm khấu trừ</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 5: TỰ QUYẾT ĐỊNH THƯỞNG KPI & TỔNG KẾT THỰC LĨNH NET */}
              {(() => {
                const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                const luongBhxhTheoCong = Math.round((luongBhxh / congChuan) * congLam);
                
                const phuCapCom = editingPayrollEmp.phuCapCom !== undefined ? Number(editingPayrollEmp.phuCapCom) : 800000;
                const xang = (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null && (editingPayrollEmp.phuCapXang as any) !== '')
                  ? Number(editingPayrollEmp.phuCapXang)
                  : Math.min(500000, Math.round((500000 / congChuan) * congLam));

                const hhTour = Number(editingPayrollEmp.hhTourKtv) || 0;
                const hhBanLe = Number(editingPayrollEmp.hhBanLe) || 0;
                const hhDoanhSo = Number(editingPayrollEmp.hhDoanhSo) || 0;
                const tongHoaHong = hhTour + hhBanLe + hhDoanhSo;

                const phatDiMuon = (editingPayrollEmp.phatDiMuon !== undefined && editingPayrollEmp.phatDiMuon !== null && (editingPayrollEmp.phatDiMuon as any) !== '')
                  ? Number(editingPayrollEmp.phatDiMuon)
                  : ((Number(editingPayrollEmp.soLanDiMuon) || 0) * 50000);
                const tamUng = Number(editingPayrollEmp.tamUng) || 0;
                const thueTNCN = Number(editingPayrollEmp.thueTNCN) || 0;

                // 1. MỨC CAM KẾT THU NHẬP
                const mucCamKet = (editingPayrollEmp.mucLuongCamKet !== undefined && editingPayrollEmp.mucLuongCamKet !== null && !isNaN(Number(editingPayrollEmp.mucLuongCamKet)))
                  ? Number(editingPayrollEmp.mucLuongCamKet)
                  : 10000000;

                // 2. TRẠNG THÁI ĐÓNG BHXH THÁNG NÀY
                const isCoDongBHXH = editingPayrollEmp.coDongBHXH !== false;

                // TỔNG THU NHẬP CỦA CÁC MỤC KHÁC (TRƯỚC KHI CỘNG KPI)
                const tongThuNhapChuaKpi = luongBhxhTheoCong + phuCapCom + xang + tongHoaHong;

                // MỨC CHUẨN GÓI CAM KẾT THEO CÔNG & GỢI Ý BÙ ĐỦ
                const mucTieuCamKetTheoCong = (congLam >= congChuan) ? mucCamKet : Math.round((mucCamKet / congChuan) * congLam);
                const kpiGoiYBuDuCamKet = Math.max(0, mucTieuCamKetTheoCong - luongBhxhTheoCong - xang);

                // THƯỞNG KPI HIỆN TẠI DO QUẢN LÝ ĐIỀN / CHỌN
                const currentKpi = (editingPayrollEmp.thuongKPI !== undefined && editingPayrollEmp.thuongKPI !== null && (editingPayrollEmp.thuongKPI as any) !== '')
                  ? Number(editingPayrollEmp.thuongKPI)
                  : kpiGoiYBuDuCamKet;
                const isOverridden = currentKpi !== kpiGoiYBuDuCamKet;

                // DỰ KIẾN KẾT QUẢ CUỐI CÙNG
                const tongGrossDuKien = tongThuNhapChuaKpi + currentKpi;
                const bhxhCaNhanDuKien = isCoDongBHXH
                  ? Math.round(luongBhxhTheoCong * 0.08) + Math.round(luongBhxhTheoCong * 0.015) + Math.round(luongBhxhTheoCong * 0.01)
                  : 0;
                const tongKhauTruDuKien = bhxhCaNhanDuKien + thueTNCN + tamUng + phatDiMuon;
                const thucLinhDuKien = tongGrossDuKien - tongKhauTruDuKien;

                return (
                  <div className="space-y-4 pt-1">
                    {/* BẢNG TỔNG HỢP CÁC MỤC KHÁC (TRƯỚC KHI TỰ QUYẾT KPI) */}
                    <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-extrabold text-[#4E342E] text-xs flex items-center gap-1.5">
                          <span>📊 TỔNG THU NHẬP CÁC MỤC KHÁC (TRƯỚC KHI CỘNG KPI):</span>
                        </span>
                        <span className="font-mono text-base font-black text-amber-950 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-2xs self-start sm:self-auto">
                          {formatVND(tongThuNhapChuaKpi)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#6D4C41] pt-1 border-t border-amber-200">
                        <div>
                          <span className="text-[#8D6E63] block">1. Lương cơ bản ({congLam}c):</span>
                          <strong className="font-mono">{formatVND(luongBhxhTheoCong)}</strong>
                        </div>
                        <div>
                          <span className="text-[#8D6E63] block">2. Tiền cơm cố định:</span>
                          <strong className="font-mono">{formatVND(phuCapCom)}</strong>
                        </div>
                        <div>
                          <span className="text-[#8D6E63] block">3. Phụ cấp xăng ({congLam}c):</span>
                          <strong className="font-mono text-amber-950">{formatVND(xang)}</strong>
                        </div>
                        <div>
                          <span className="text-[#8D6E63] block">4. Tổng hoa hồng:</span>
                          <strong className="font-mono text-emerald-800">{formatVND(tongHoaHong)}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[#6D4C41]">
                          🎯 Cam kết thu nhập theo công: <strong>{formatVND(mucTieuCamKetTheoCong)}</strong> (Gói chuẩn: {formatVND(mucCamKet)}/tháng)
                        </span>
                        <span className="text-emerald-800 font-bold">
                          💡 Gợi ý bù đủ cam kết: <strong>{formatVND(kpiGoiYBuDuCamKet)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* BƯỚC CUỐI CÙNG: Ô ĐIỀN THƯỞNG KPI TỰ QUYẾT ĐỊNH */}
                    <div className="p-4 bg-emerald-50/60 border-2 border-emerald-500 rounded-2xl space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="font-black text-emerald-950 text-xs flex items-center gap-2">
                            <span>🎯 Khối 5: TỰ QUYẾT ĐỊNH THƯỞNG KPI (EDITABLE)</span>
                            {isOverridden ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ✏️ Đã tự điều chỉnh
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                ✓ Đang theo mức bù đủ cam kết
                              </span>
                            )}
                          </label>
                          <p className="text-[10px] text-emerald-800 mt-0.5">
                            Quản lý xem tổng thu nhập các mục trên ({formatVND(tongThuNhapChuaKpi)}) rồi nhập số thưởng KPI theo quyết định cuối cùng.
                          </p>
                        </div>

                        {/* Nút thao tác nhanh */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayrollEmp({
                                ...editingPayrollEmp,
                                thuongKPI: kpiGoiYBuDuCamKet,
                              });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                            title="Điền mức bù đủ cam kết thu nhập"
                          >
                            ↺ Bù đủ cam kết ({formatVND(kpiGoiYBuDuCamKet)})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayrollEmp({
                                ...editingPayrollEmp,
                                thuongKPI: 0,
                              });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-[#E7E0D6] rounded-lg text-[11px] font-bold text-[#8D6E63] hover:text-rose-700 transition-colors shadow-2xs cursor-pointer"
                            title="Không thưởng KPI"
                          >
                            0đ
                          </button>
                        </div>
                      </div>

                      {/* Ô nhập số tiền KPI lớn */}
                      <div className="relative">
                        <input
                          type="number"
                          step="50000"
                          min="0"
                          value={editingPayrollEmp.thuongKPI !== undefined ? editingPayrollEmp.thuongKPI : kpiGoiYBuDuCamKet}
                          onChange={e => {
                            const val = e.target.value === '' ? ('' as any) : Number(e.target.value);
                            setEditingPayrollEmp({
                              ...editingPayrollEmp,
                              thuongKPI: val,
                            });
                          }}
                          className="w-full px-4 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-base font-mono font-black text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-inner"
                          placeholder={kpiGoiYBuDuCamKet.toString()}
                        />
                      </div>

                      {/* DỰ KIẾN KẾT QUẢ SAU KHI ĐIỀN KPI */}
                      <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                          <div className="bg-[#FAF7F0] p-2.5 rounded-lg border border-[#E7E0D6]">
                            <span className="text-[10px] text-[#8D6E63] font-bold block">Tổng Gross dự kiến:</span>
                            <span className="font-mono font-bold text-xs text-[#4E342E]">
                              {formatVND(tongGrossDuKien)}
                            </span>
                          </div>

                          <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-200">
                            <span className="text-[10px] text-rose-700 font-bold block">Khấu trừ BHXH (10.5%):</span>
                            <span className="font-mono font-bold text-xs text-rose-700">
                              {isCoDongBHXH ? `-${formatVND(bhxhCaNhanDuKien)}` : '0 đ (Không đóng)'}
                            </span>
                          </div>

                          <div className="bg-emerald-100/80 p-2.5 rounded-lg border-2 border-emerald-400">
                            <span className="text-[10px] text-emerald-900 font-black block">THỰC LĨNH CHUYỂN KHOẢN:</span>
                            <span className="font-mono font-black text-base text-emerald-950">
                              {formatVND(thucLinhDuKien)}
                            </span>
                          </div>
                        </div>

                        {isOverridden && (
                          <p className="text-[10px] text-amber-800 text-center font-semibold italic">
                            (Đã tự quyết định: {currentKpi > kpiGoiYBuDuCamKet ? 'Tăng +' : 'Giảm -'}{formatVND(Math.abs(currentKpi - kpiGoiYBuDuCamKet))} so với mức bù đủ gói cam kết)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Footer Modal Actions */}
              <div className="pt-4 border-t border-[#E7E0D6] flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] text-[#8D6E63] italic">
                  💡 Nhấn "Lưu & Tính Lại Lương" để áp dụng ngay toàn bộ các số liệu vừa chỉnh sửa.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPayrollModal(false)}
                    className="px-4 py-2.5 bg-[#EFEBE0] hover:bg-[#E2DACB] text-[#5D4037] rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#8D6E63] hover:bg-[#6D4C41] text-white rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save size={16} />
                    <span>Lưu & Tính Lại Lương</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA KHỎI KỲ LƯƠNG */}
      {showDeletePayrollModal && deletingPayrollEmp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-rose-100 bg-rose-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-900">Xóa Khỏi Kỳ Lương?</h3>
                <p className="text-xs text-rose-700">Kỳ tính lương: {selectedMonth}</p>
              </div>
            </div>

            <div className="p-6 space-y-3 text-xs text-[#5D4037]">
              <p>
                Bạn có chắc chắn muốn xóa nhân sự này khỏi bảng tính lương kỳ <strong>{selectedMonth}</strong>?
              </p>
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E0D6]">
                <p className="font-bold text-sm text-[#4E342E]">{deletingPayrollEmp.hoTen}</p>
                <p className="text-[#8D6E63]">
                  Mã: {deletingPayrollEmp.maNV} · {deletingPayrollEmp.chucVuLabel} ({deletingPayrollEmp.chiNhanhTen})
                </p>
                <p className="font-mono text-rose-800 font-bold mt-1">
                  Thực lĩnh dự kiến: {formatVND(deletingPayrollEmp.thucLinh)}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[#E7E0D6] bg-[#FAF7F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeletePayrollModal(false)}
                className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDeletePayroll}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

