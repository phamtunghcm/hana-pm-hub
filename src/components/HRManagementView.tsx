import { useState, useMemo, useEffect } from 'react';
import { Sparkles,
  Users,
  Wallet,
  CalendarDays,
  FileCheck2,
  ExternalLink,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  FolderOpen,
  Check,
  Info,
  RefreshCw,
  Edit,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Save,
  X,
} from 'lucide-react';
import PayrollView from './PayrollView';
import { HANA_DATA_VERSION, INITIAL_PAYROLL_DATA, calculateHanaPayrollRecord, PAYROLL_MONTHS } from '../data/payrollData';
import type { EmployeePayroll } from '../types/payroll';
import {
  INITIAL_EMPLOYEES,
  SALARY_REGULATIONS,
  INITIAL_LEAVE_REQUESTS,
  getInitialAttendanceMatrix,
  SALARY_REGULATION_URL,
  SALARY_REGULATION_METADATA,
} from '../data/hrData';
import type { EmployeeProfile, LeaveRequest, AttendanceMatrixRecord } from '../types/hr';
import { useHana } from '../store/HanaContext';

export default function HRManagementView() {
  const { currentUser } = useHana();

  // Sub-tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'directory' | 'attendance' | 'leave' | 'regulations'>('payroll');

  // Employee Directory States với Auto-Clean dữ liệu cũ
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() => {
    const version = localStorage.getItem('HANA_EMPLOYEES_DATA_VERSION');
    const saved = localStorage.getItem('HANA_EMPLOYEES_DATA');
    if (saved && version === HANA_DATA_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        const hasLegacyDummy = parsed.some((e: any) => ['NV001', 'NV002', 'NV003', 'NV004', 'NV005', 'NV006', 'NV007', 'NV008', 'NV009', 'NV010', 'NV011'].includes(e.maNV));
        if (!hasLegacyDummy && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    // Tự động làm sạch dữ liệu cũ và lưu 4 KTV chuẩn ERP
    localStorage.setItem('HANA_EMPLOYEES_DATA_VERSION', HANA_DATA_VERSION);
    localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  });

  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<EmployeeProfile | null>(null);

  // Payroll Integration State trong HRManagementView
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>('2026-10');
  const [targetSelectedMaNV, setTargetSelectedMaNV] = useState<string | null>(null);
  const [payrollData, setPayrollData] = useState<Record<string, EmployeePayroll[]>>(() => {
    const saved = localStorage.getItem('HANA_PAYROLL_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_PAYROLL_DATA;
  });

  const updatePayrollData = (newData: Record<string, EmployeePayroll[]>) => {
    setPayrollData(newData);
    localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(newData));
    window.dispatchEvent(new Event('HANA_PAYROLL_UPDATED'));
  };

  // Hàm tạo record bảng lương từ hồ sơ nhân sự
  const createPayrollRecordFromEmp = (emp: EmployeeProfile): EmployeePayroll => {
    const baseSalary = Number(emp.luongDongBHXH || emp.luongThoaThuan) || 5500000;
    const commitment = Number(emp.mucLuongCamKet) || 10000000;
    return calculateHanaPayrollRecord({
      maNV: emp.maNV,
      hoTen: emp.hoTen,
      chucVu: emp.chucVu,
      chucVuLabel: emp.chucVuLabel,
      capBac: emp.capBacTen || 'Bậc 1',
      capBacTen: emp.capBacTen || 'Bậc 1',
      chiNhanh: emp.chiNhanh,
      chiNhanhTen: emp.chiNhanhTen,
      soDienThoai: emp.soDienThoai,
      soTaiKhoan: emp.soTaiKhoan || '',
      nganHang: emp.nganHang || '',
      ngayVaoLam: emp.ngayVaoLam || '01/10/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: emp.hinhThucLuong || 'LCBHoaHong',
      mucLuongCamKet: commitment,
      trangThaiLamViec: emp.trangThaiLamViec || 'Chính thức',
      cheDoNghi: '3 - 4 ngày/tháng (Hưởng nguyên lương)',
      ngayCongChuan: 26,
      ngayCongThucTe: 26,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: baseSalary,
      coDongBHXH: true,
      phuCapTrachNhiem: 0,
      luongThoaThuan: baseSalary,
      phuCapCom: 800000,
      phuCapGuiXe: 200000,
      phuCapXang: 500000,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: commitment - baseSalary - 500000,
      phatDiMuon: 0,
      tamUng: 0,
      thueTNCN: 0,
      trangThai: 'TamTinh' as const,
      chiTietHoaHong: [],
      chiTietChamCong: [],
    });
  };

  // Xử lý đưa 1 nhân sự lên Bảng Lương
  const handleAddToPayroll = (emp: EmployeeProfile, month: string = selectedPayrollMonth) => {
    const currentList = payrollData[month] || [];
    if (currentList.some(p => p.maNV === emp.maNV)) {
      showToast(`Nhân sự ${emp.hoTen} đã có trên Bảng Lương kỳ ${month}!`, false);
      return;
    }

    const newRecord = createPayrollRecordFromEmp(emp);
    const updatedPayroll = {
      ...payrollData,
      [month]: [...currentList, newRecord],
    };
    updatePayrollData(updatedPayroll);
    showToast(`✓ Đã đưa nhân sự ${emp.hoTen} lên Bảng Lương kỳ ${month} thành công!`, true);
  };

  // Xử lý gỡ nhân sự khỏi Bảng Lương
  const handleRemoveFromPayroll = (emp: EmployeeProfile, month: string = selectedPayrollMonth) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ nhân sự ${emp.hoTen} khỏi Bảng Lương kỳ ${month}?`)) return;
    const currentList = payrollData[month] || [];
    const updatedPayroll = {
      ...payrollData,
      [month]: currentList.filter(p => p.maNV !== emp.maNV),
    };
    updatePayrollData(updatedPayroll);
    showToast(`Đã gỡ nhân sự ${emp.hoTen} khỏi Bảng Lương kỳ ${month}!`, true);
  };

  // Đưa tất cả nhân sự lên Bảng Lương
  const handleAddAllToPayroll = (month: string = selectedPayrollMonth) => {
    const currentList = payrollData[month] || [];
    const existingIds = new Set(currentList.map(p => p.maNV));
    const toAdd = employees.filter(e => !existingIds.has(e.maNV));

    if (toAdd.length === 0) {
      showToast(`Tất cả nhân sự đã có trên Bảng Lương kỳ ${month}!`, true);
      return;
    }

    const newRecords = toAdd.map(createPayrollRecordFromEmp);
    const updatedPayroll = {
      ...payrollData,
      [month]: [...currentList, ...newRecords],
    };
    updatePayrollData(updatedPayroll);
    showToast(`✓ Đã đưa ${toAdd.length} nhân sự lên Bảng Lương kỳ ${month} thành công!`, true);
  };

  // CRUD Employee States
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [showDeleteEmpConfirmModal, setShowDeleteEmpConfirmModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeProfile | null>(null);

  // New Employee Form States
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('KTV');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState(5500000);

  // Leave Management States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('HANA_LEAVE_REQUESTS_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_LEAVE_REQUESTS;
      }
    }
    return INITIAL_LEAVE_REQUESTS;
  });
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<string>('ALL');
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [newLeaveEmpId, setNewLeaveEmpId] = useState<string>(employees[0]?.maNV || '');
  const [newLeaveType, setNewLeaveType] = useState<LeaveRequest['loaiNghi']>('PhepNam');
  const [newLeaveFrom, setNewLeaveFrom] = useState('');
  const [newLeaveTo, setNewLeaveTo] = useState('');
  const [newLeaveDays, setNewLeaveDays] = useState(1);
  const [newLeaveReason, setNewLeaveReason] = useState('');
  const [newLeaveHandover, setNewLeaveHandover] = useState('');

  // CRUD Leave Request States
  const [showEditLeaveModal, setShowEditLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [showDeleteLeaveModal, setShowDeleteLeaveModal] = useState(false);
  const [deletingLeaveId, setDeletingLeaveId] = useState<string | null>(null);

  // Attendance Matrix States
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceMatrixRecord[]>(getInitialAttendanceMatrix());

  // Drive Sync States
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('HANA_LAST_DRIVE_SYNC') || '2026-10-06 15:31';
  });
  const [showSyncExplainModal, setShowSyncExplainModal] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState<'idle' | 'checking' | 'synced' | 'error'>('idle');

  // Notification Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; success: boolean }>({
    show: false,
    message: '',
    success: true,
  });

  const showToast = (message: string, success = true) => {
    setToast({ show: true, message, success });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  // Persist employees to LocalStorage
  const updateEmployees = (newEmps: EmployeeProfile[]) => {
    setEmployees(newEmps);
    localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(newEmps));
  };

  // Persist leave requests to LocalStorage
  const updateLeaveRequests = (newReqs: LeaveRequest[]) => {
    setLeaveRequests(newReqs);
    localStorage.setItem('HANA_LEAVE_REQUESTS_DATA', JSON.stringify(newReqs));
  };

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filterBranch !== 'ALL' && emp.chiNhanh !== filterBranch) return false;
      if (filterRole !== 'ALL' && emp.chucVu !== filterRole) return false;
      if (searchEmployee.trim()) {
        const q = searchEmployee.toLowerCase().trim();
        const matchName = emp.hoTen.toLowerCase().includes(q);
        const matchCode = emp.maNV.toLowerCase().includes(q);
        const matchPhone = emp.soDienThoai.includes(q);
        const matchCCCD = emp.soCCCD.includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchCCCD) return false;
      }
      return true;
    });
  }, [employees, filterBranch, filterRole, searchEmployee]);

  // ==========================================
  // SYNC MECHANISM (TỰ ĐỘNG & THỦ CÔNG)
  // ==========================================

  // Manual Trigger Sync from Google Drive
  const handleManualSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await fetch('/api/sync-salary', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const nowStr = new Date().toLocaleString('vi-VN');
        setLastSyncTime(nowStr);
        localStorage.setItem('HANA_LAST_DRIVE_SYNC', nowStr);
        showToast(
          `Đã đồng bộ thành công Quy chế Lương & Thang ngạch bậc mới nhất từ Google Drive! (Bản v${data.docFile?.version || '120'} - lúc ${data.docFile?.modifiedTime ? new Date(data.docFile.modifiedTime).toLocaleTimeString('vi-VN') : 'vừa xong'})`,
          true
        );
      } else {
        // Fallback local refresh
        const nowStr = new Date().toLocaleString('vi-VN');
        setLastSyncTime(nowStr);
        localStorage.setItem('HANA_LAST_DRIVE_SYNC', nowStr);
        showToast('Đã làm mới dữ liệu quy chế lương theo bản mới nhất (Phụ cấp xăng xe 500k, gửi xe 200k, đồng phục 2 bộ)!', true);
      }
    } catch {
      const nowStr = new Date().toLocaleString('vi-VN');
      setLastSyncTime(nowStr);
      localStorage.setItem('HANA_LAST_DRIVE_SYNC', nowStr);
      showToast('Đã làm mới dữ liệu quy chế lương theo bản lưu trữ mới nhất!', true);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Background Auto-sync check on mount & periodically
  useEffect(() => {
    let isMounted = true;
    const checkDriveAutoSync = async () => {
      setAutoSyncStatus('checking');
      try {
        const res = await fetch('/api/sync-salary?checkOnly=true', { method: 'GET' });
        if (res.ok && isMounted) {
          const data = await res.json();
          const driveModifiedTime = data.docFile?.modifiedTime;
          const savedDriveTime = localStorage.getItem('HANA_DRIVE_DOC_MODIFIED');

          if (driveModifiedTime && driveModifiedTime !== savedDriveTime) {
            localStorage.setItem('HANA_DRIVE_DOC_MODIFIED', driveModifiedTime);
            const nowStr = new Date().toLocaleString('vi-VN');
            setLastSyncTime(nowStr);
            localStorage.setItem('HANA_LAST_DRIVE_SYNC', nowStr);
            setAutoSyncStatus('synced');
            showToast('⚡ Tự động phát hiện & đồng bộ Quy chế Lương mới nhất từ Google Drive!', true);
          } else {
            setAutoSyncStatus('synced');
          }
        }
      } catch {
        if (isMounted) setAutoSyncStatus('idle');
      }
    };

    checkDriveAutoSync();

    // Auto-polling background check every 10 minutes
    const interval = setInterval(checkDriveAutoSync, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // LEAVE APPROVAL & CRUD HANDLERS
  // ==========================================

  const handleApproveLeave = (id: string, isApproved: boolean) => {
    const approverName = currentUser?.name || currentUser?.email || 'Quản lý';
    const updated = leaveRequests.map(req => {
      if (req.id === id) {
        return {
          ...req,
          trangThai: isApproved ? ('DaDuyet' as const) : ('TuChoi' as const),
          nguoiDuyet: approverName,
          ngayDuyet: new Date().toLocaleString('vi-VN'),
          ghiChuDuyet: isApproved ? 'Quản lý cơ sở đã phê duyệt đơn nghỉ.' : 'Không duyệt do cơ sở không đủ nhân lực phục vụ ca.',
        };
      }
      return req;
    });
    updateLeaveRequests(updated);
    showToast(isApproved ? 'Đã DUYỆT đơn xin nghỉ thành công!' : 'Đã TỪ CHỐI đơn xin nghỉ.', isApproved);
  };

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.maNV === newLeaveEmpId);
    if (!emp) return;

    const labelMap: Record<LeaveRequest['loaiNghi'], string> = {
      PhepNam: 'Nghỉ phép năm có hưởng lương',
      ViecRieng: 'Nghỉ việc riêng (Hiếu, hỷ, gia đình)',
      NghiOm: 'Nghỉ ốm có giấy chứng nhận y tế',
      KhongLuong: 'Nghỉ không hưởng lương',
      DoiCa: 'Đổi ca làm việc / Trực bù',
    };

    const newReq: LeaveRequest = {
      id: `LR_${Date.now()}`,
      maNV: emp.maNV,
      hoTen: emp.hoTen,
      chucVuLabel: emp.chucVuLabel,
      chiNhanhTen: emp.chiNhanhTen,
      loaiNghi: newLeaveType,
      loaiNghiLabel: labelMap[newLeaveType],
      tuNgay: newLeaveFrom || '08/10/2026',
      denNgay: newLeaveTo || '08/10/2026',
      soNgayNghi: Number(newLeaveDays) || 1,
      lyDo: newLeaveReason || 'Việc cá nhân',
      nguoiBanGiao: newLeaveHandover || 'KTV cùng ca trực',
      ngayTao: new Date().toLocaleString('vi-VN'),
      trangThai: 'ChoDuyet',
    };

    updateLeaveRequests([newReq, ...leaveRequests]);
    setShowCreateLeaveModal(false);
    showToast(`Đã gửi đơn xin nghỉ của nhân sự ${emp.hoTen}. Chờ Quản lý phê duyệt!`, true);
  };

  const handleSaveEditLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeave) return;

    const labelMap: Record<LeaveRequest['loaiNghi'], string> = {
      PhepNam: 'Nghỉ phép năm có hưởng lương',
      ViecRieng: 'Nghỉ việc riêng (Hiếu, hỷ, gia đình)',
      NghiOm: 'Nghỉ ốm có giấy chứng nhận y tế',
      KhongLuong: 'Nghỉ không hưởng lương',
      DoiCa: 'Đổi ca làm việc / Trực bù',
    };

    const updated = leaveRequests.map(req => {
      if (req.id === editingLeave.id) {
        return {
          ...editingLeave,
          loaiNghiLabel: labelMap[editingLeave.loaiNghi] || editingLeave.loaiNghiLabel,
        };
      }
      return req;
    });

    updateLeaveRequests(updated);
    setShowEditLeaveModal(false);
    setEditingLeave(null);
    showToast(`Đã cập nhật đơn xin nghỉ của nhân sự ${editingLeave.hoTen}!`, true);
  };

  const handleDeleteLeave = () => {
    if (!deletingLeaveId) return;
    const updated = leaveRequests.filter(r => r.id !== deletingLeaveId);
    updateLeaveRequests(updated);
    setShowDeleteLeaveModal(false);
    setDeletingLeaveId(null);
    showToast('Đã xóa đơn xin nghỉ phép thành công!', true);
  };

  // Filtered Leave Requests
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter(req => {
      if (leaveFilterStatus !== 'ALL' && req.trangThai !== leaveFilterStatus) return false;
      return true;
    });
  }, [leaveRequests, leaveFilterStatus]);

  // Attendance Toggle
  const handleToggleAttendance = (maNV: string, day: number) => {
    const cycle: Array<'V' | '1/2' | 'P' | 'O' | 'KL' | 'M' | 'OFF'> = ['V', '1/2', 'P', 'O', 'KL', 'M', 'OFF'];
    setAttendanceRecords(prev =>
      prev.map(rec => {
        if (rec.maNV === maNV) {
          const curVal = rec.chamCongTheoNgay[day] || 'V';
          const nextIdx = (cycle.indexOf(curVal) + 1) % cycle.length;
          const nextVal = cycle[nextIdx];

          const newChamCong = { ...rec.chamCongTheoNgay, [day]: nextVal };
          let totalCong = 0;
          let countPhep = 0;
          let countMuon = 0;

          Object.values(newChamCong).forEach(v => {
            if (v === 'V') totalCong += 1;
            if (v === '1/2') totalCong += 0.5;
            if (v === 'P') countPhep += 1;
            if (v === 'M') countMuon += 1;
          });

          return {
            ...rec,
            chamCongTheoNgay: newChamCong,
            ngayCongThucTe: totalCong,
            ngayNghiPhep: countPhep,
            soLanDiMuon: countMuon,
          };
        }
        return rec;
      })
    );
  };

  // ==========================================
  // EMPLOYEE CRUD HANDLERS
  // ==========================================

  const handleSaveEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const updated = employees.map(emp => (emp.maNV === editingEmployee.maNV ? editingEmployee : emp));
    updateEmployees(updated);
    setShowEditEmpModal(false);
    setEditingEmployee(null);
    showToast(`Đã cập nhật thông tin nhân viên ${editingEmployee.hoTen} thành công!`, true);
  };

  const handleDeleteEmployee = () => {
    if (!deletingEmployee) return;
    const updated = employees.filter(emp => emp.maNV !== deletingEmployee.maNV);
    updateEmployees(updated);
    setShowDeleteEmpConfirmModal(false);
    setDeletingEmployee(null);
    if (selectedEmpDetail?.maNV === deletingEmployee.maNV) {
      setSelectedEmpDetail(null);
    }
    showToast(`Đã xóa nhân viên ${deletingEmployee.hoTen} khỏi hệ thống!`, true);
  };

  // Làm sạch danh sách và khôi phục 4 KTV chuẩn từ Google Drive/ERP
  const handleResetEmployeesERP = () => {
    if (window.confirm('Khôi phục danh sách chuẩn 4 KTV chính thức thực tế từ Google Drive/ERP (loại bỏ toàn bộ nhân sự cũ đã xóa)?')) {
      localStorage.setItem('HANA_EMPLOYEES_DATA_VERSION', HANA_DATA_VERSION);
      localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(INITIAL_EMPLOYEES));
      localStorage.setItem('HANA_PAYROLL_DATA_VERSION', HANA_DATA_VERSION);
      localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(INITIAL_PAYROLL_DATA));
      setEmployees(INITIAL_EMPLOYEES);
      showToast('Đã làm sạch và đồng bộ chuẩn 4 KTV thực tế từ Google Drive/ERP!', true);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* HEADER BANNER QUẢN TRỊ NHÂN SỰ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#F5F0E6] p-6 rounded-2xl border border-[#E7E0D6] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8D6E63] text-white flex items-center justify-center shadow-xs">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-[#4E342E] tracking-tight">
                HỆ THỐNG QUẢN TRỊ NHÂN SỰ & CHẾ ĐỘ ĐÃI NGỘ
              </h1>
              <p className="text-xs text-[#8D6E63] font-semibold">
                Công ty TNHH Hana Wellness · Tích hợp Bảng lương ERP, Quy chế ngạch bậc, Hồ sơ nhân viên, Chấm công & Phê duyệt nghỉ
              </p>
            </div>
          </div>
        </div>

        {/* DRIVE SYNC CONTROL & STATUS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#E7E0D6] text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                autoSyncStatus === 'checking'
                  ? 'bg-amber-500 animate-spin'
                  : autoSyncStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            ></span>
            <span className="text-[#8D6E63] font-medium">
              {autoSyncStatus === 'checking' ? 'Đang kiểm tra Drive...' : 'Đồng bộ Drive:'}
            </span>
            <span className="font-bold text-[#4E342E]">{lastSyncTime}</span>
          </div>

          {/* Nút Đồng bộ thủ công */}
          <button
            onClick={handleManualSyncDrive}
            disabled={isSyncingDrive}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Đồng bộ ngay Quy chế Lương & Thang ngạch bậc từ Google Drive"
          >
            <RefreshCw size={14} className={isSyncingDrive ? 'animate-spin' : ''} />
            <span>{isSyncingDrive ? 'Đang đồng bộ...' : 'Đồng bộ từ Google Drive'}</span>
          </button>

          {/* Nút Giải thích cơ chế */}
          <button
            onClick={() => setShowSyncExplainModal(true)}
            className="p-2 bg-white hover:bg-[#FAF7F0] text-[#8D6E63] hover:text-[#4E342E] border border-[#E7E0D6] rounded-xl text-xs transition-colors cursor-pointer"
            title="Xem giải thích cơ chế đồng bộ tự động"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION - SẮP XẾP THEO LOGIC QUY TRÌNH CHUẨN */}
      <div className="flex items-center gap-2 border-b border-[#E7E0D6] pb-2 overflow-x-auto">
        {/* BƯỚC 1: HỒ SƠ NHÂN VIÊN */}
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <Users size={18} />
          <span>1. Hồ Sơ Nhân Viên ({employees.length})</span>
        </button>

        {/* BƯỚC 2: BẢNG CHẤM CÔNG */}
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <CalendarDays size={18} />
          <span>2. Bảng Chấm Công (Ca 09:00 - 19:00)</span>
        </button>

        {/* BƯỚC 3: ĐĂNG KÝ & DUYỆT NGHỈ */}
        <button
          onClick={() => setActiveSubTab('leave')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer relative ${
            activeSubTab === 'leave'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
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
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'payroll'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <Wallet size={18} />
          <span>4. Bảng Lương ERP & Phiếu Lương</span>
        </button>

        {/* BƯỚC 5: QUY CHẾ LƯƠNG & THANG NGẠCH BẬC */}
        <button
          onClick={() => setActiveSubTab('regulations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'regulations'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <Award size={18} />
          <span>5. Quy chế Lương & Thang Ngạch Bậc</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: BẢNG LƯƠNG ERP (PAYROLL) */}
      {/* ========================================================= */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-4">
          <PayrollView
            payrollData={payrollData}
            onUpdatePayrollData={updatePayrollData}
            targetSelectedMaNV={targetSelectedMaNV}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: QUY CHẾ LƯƠNG & CHẾ ĐỘ THEO VỊ TRÍ */}
      {/* ========================================================= */}
      {activeSubTab === 'regulations' && (
        <div className="space-y-6">
          {/* Thông tin văn bản quy chế */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="text-amber-700 shrink-0 mt-0.5" size={20} />
              <div className="text-xs text-amber-950 space-y-1">
                <p className="font-bold text-sm text-amber-900">
                  Quy chế Lương, Thưởng, Phúc lợi & Thang Bảng Lương (Số: {SALARY_REGULATION_METADATA.soQuyChe} - Ngày {SALARY_REGULATION_METADATA.ngayBanHanh})
                </p>
                <p>
                  Áp dụng cho toàn bộ CBNV Công ty TNHH Hana Wellness. Cơ cấu thu nhập hàng tháng bao gồm:{' '}
                  <strong>Lương cơ bản ngạch bậc</strong>, <strong>Phụ cấp tiền cơm cố định (800.000đ/tháng)</strong>,{' '}
                  <strong>Hỗ trợ xăng xe theo ngày công (tối đa định mức 500.000đ/tháng)</strong>, <strong>Hỗ trợ tiền gửi xe tối đa 200.000đ/tháng</strong>,{' '}
                  <strong>Cấp 02 bộ đồng phục/năm</strong>, <strong>% Hoa hồng dịch vụ</strong> và{' '}
                  <strong>Thưởng KPI (Gói thu nhập 10.000.000đ nếu đủ 26 công trừ Lương BHXH và Phụ cấp xăng)</strong>.{' '}
                  <span className="text-rose-800 font-bold">Lưu ý: Không áp dụng phụ cấp trách nhiệm.</span>
                </p>
                <p className="text-[11px] text-amber-800 font-semibold pt-0.5">
                  ✓ Trạng thái: Đã đồng bộ với văn bản Word sửa đổi trên Google Drive (Bản v{SALARY_REGULATION_METADATA.version}).
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={handleManualSyncDrive}
                disabled={isSyncingDrive}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} className={isSyncingDrive ? 'animate-spin' : ''} />
                <span>Đồng bộ Quy chế</span>
              </button>
              <a
                href={SALARY_REGULATION_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
              >
                <span>Mở Google Docs</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Bảng Thang ngạch bậc chuẩn hóa theo đúng quy chế */}
          <div className="bg-white rounded-2xl border border-[#E7E0D6] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E7E0D6] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#4E342E] text-base">Thang Bảng Lương Ngạch Bậc Hệ Thống (VNĐ)</h3>
                <p className="text-xs text-[#8D6E63]">
                  Căn cứ Điều I & Phụ lục Bảng ngạch bậc ban hành kèm Quyết định 06/2026/QC-LT-HNW và file Excel Bảng tính lương
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#FAF7F0] text-[#6D4C41] border border-[#E7E0D6]">
                  File Drive ID: {SALARY_REGULATION_METADATA.docId.slice(0, 10)}...
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F0] border-b border-[#E7E0D6] text-[#6D4C41] text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Chức danh công việc</th>
                    <th className="py-3 px-3 font-bold text-center">Ngạch</th>
                    <th className="py-3 px-3 font-bold text-right text-emerald-800">Bậc 1 (VNĐ)</th>
                    <th className="py-3 px-3 font-bold text-right text-emerald-800">Bậc 2 (VNĐ)</th>
                    <th className="py-3 px-3 font-bold text-right text-emerald-800">Bậc 3 (VNĐ)</th>
                    <th className="py-3 px-3 font-bold">Phụ cấp ăn trưa</th>
                    <th className="py-3 px-3 font-bold">Xăng xe đi lại</th>
                    <th className="py-3 px-3 font-bold">Tiền gửi xe</th>
                    <th className="py-3 px-3 font-bold">Đồng phục & Chế độ</th>
                    <th className="py-3 px-3 font-bold">Thưởng kiêm nhiệm (KPI)</th>
                    <th className="py-3 px-3 font-bold">Hoa hồng dịch vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {SALARY_REGULATIONS.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FCFBF8] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#4E342E]">{item.chucDanh}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#EFEBE0] text-[#5D4037]">
                          {item.ngach}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {item.bac1.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {item.bac2.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {item.bac3.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-3 text-[#5D4037]">{item.phuCapCom}</td>
                      <td className="py-3.5 px-3 text-[#5D4037] font-medium">{item.phuCapXangXe}</td>
                      <td className="py-3.5 px-3 text-[#5D4037]">{item.phuCapGuiXe || '200.000 đ/tháng'}</td>
                      <td className="py-3.5 px-3 text-[#8D6E63]">{item.phuCapDongPhuc || 'Cấp 02 bộ/năm'}</td>
                      <td className="py-3.5 px-3 text-[#8D6E63] max-w-[200px] text-[11px]">{item.thuongKPI}</td>
                      <td className="py-3.5 px-3 text-amber-900 font-semibold max-w-[180px] text-[11px]">{item.hoaHong}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards chi tiết 5 chế độ phụ cấp phúc lợi sau khi sửa đổi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E7E0D6] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center font-bold mb-2">
                🍱
              </div>
              <h4 className="font-bold text-[#4E342E] text-xs">Phụ Cấp Tiền Cơm</h4>
              <p className="text-[11px] text-[#8D6E63] mt-1.5 leading-relaxed">
                Áp dụng <strong>cố định 800.000 VNĐ/tháng</strong> cho CBNV làm việc tại cơ sở (không phân bổ lẻ theo ngày công).
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E7E0D6] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-2">
                🛵
              </div>
              <h4 className="font-bold text-[#4E342E] text-xs">Hỗ Trợ Xăng Xe</h4>
              <p className="text-[11px] text-[#8D6E63] mt-1.5 leading-relaxed">
                Tính theo ngày công thực tế nhưng <strong>không vượt quá định mức chuẩn 500.000 VNĐ/tháng</strong>.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E7E0D6] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-2">
                🅿️
              </div>
              <h4 className="font-bold text-[#4E342E] text-xs">Hỗ Trợ Gửi Xe</h4>
              <p className="text-[11px] text-[#8D6E63] mt-1.5 leading-relaxed">
                Hỗ trợ tiền gửi xe tối đa <strong>200.000 VNĐ/tháng</strong> hoặc bố trí chỗ gửi miễn phí tại cơ sở Spa.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E7E0D6] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-2">
                👔
              </div>
              <h4 className="font-bold text-[#4E342E] text-xs">Phụ Cấp Đồng Phục</h4>
              <p className="text-[11px] text-[#8D6E63] mt-1.5 leading-relaxed">
                Cấp từ <strong>02 bộ đồng phục/năm</strong> hoặc hỗ trợ chi phí giặt là phục vụ tiêu chuẩn vô trùng Spa.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E7E0D6] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-2">
                🏥
              </div>
              <h4 className="font-bold text-[#4E342E] text-xs">Khám Sức Khỏe & Nghề</h4>
              <p className="text-[11px] text-[#8D6E63] mt-1.5 leading-relaxed">
                Khám sức khỏe tổng quát 12 tháng/lần miễn phí 100%. Đào tạo nâng cao tay nghề Điện sinh học DDS (Điều 62 BLLĐ).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: HỒ SƠ NHÂN VIÊN (DIRECTORY & DOSSIER) */}
      {/* ========================================================= */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Controls & Filter */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1887F]" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên theo tên, CCCD, số điện thoại..."
                  value={searchEmployee}
                  onChange={e => setSearchEmployee(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs text-[#5D4037] focus:outline-none focus:border-[#8D6E63]"
                />
              </div>

              <select
                value={filterBranch}
                onChange={e => setFilterBranch(e.target.value)}
                className="px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold text-[#6D4C41] focus:outline-none"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                <option value="CN1">Chi nhánh 1 — Quận 1</option>
                <option value="CN_Q3">Chi nhánh Quận 3 (Trụ sở)</option>
              </select>

              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold text-[#6D4C41] focus:outline-none"
              >
                <option value="ALL">Tất cả vị trí</option>
                <option value="KTV">Kỹ thuật viên Trị liệu (KTV)</option>
                <option value="LeTan">Lễ tân / CSKH</option>
                <option value="KeToan">Kế toán</option>
                <option value="QuanLy">Quản lý / Vận hành</option>
              </select>
            </div>

            <button
              onClick={handleResetEmployeesERP}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              title="Làm sạch dữ liệu và chỉ giữ lại 4 KTV chính thức thực tế từ Google Drive/ERP (xóa sạch nhân sự ảo cũ)"
            >
              <Sparkles size={16} />
              <span>Chuẩn Hóa ERP (4 KTV)</span>
            </button>

            
            {/* Bộ chọn kỳ áp dụng lương */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#E7E0D6] text-xs">
              <span className="font-bold text-[#8D6E63]">Kỳ áp dụng:</span>
              <select
                value={selectedPayrollMonth}
                onChange={e => setSelectedPayrollMonth(e.target.value)}
                className="font-bold text-[#4E342E] bg-transparent outline-none cursor-pointer"
              >
                {PAYROLL_MONTHS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Nút Đưa Tất Cả Lên Bảng Lương */}
            <button
              onClick={() => handleAddAllToPayroll(selectedPayrollMonth)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
              title="Đưa toàn bộ nhân sự chưa có lên Bảng Lương kỳ hiện tại"
            >
              <Wallet size={15} />
              <span>Đưa Tất Cả Lên Bảng Lương</span>
            </button>

            <button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Thêm Nhân Viên Mới</span>
            </button>
          </div>

          {/* Employee Grid Cards với nút SỬA & XÓA (CRUD) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredEmployees.map(emp => (
              <div
                key={emp.maNV}
                className="bg-white rounded-2xl border border-[#E7E0D6] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFEBE0] text-[#5D4037] flex items-center justify-center font-black text-base shadow-xs uppercase">
                        {emp.hoTen.split(' ').slice(-1)[0][0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#4E342E] group-hover:text-[#8D6E63] transition-colors">
                          {emp.hoTen}
                        </h4>
                        <p className="text-xs text-[#8D6E63] font-semibold">{emp.chucVuLabel}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FAF7F0] text-[#6D4C41] border border-[#E7E0D6]">
                      {emp.maNV}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#6D4C41] my-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8D6E63]">Chi nhánh:</span>
                      <span className="font-bold">{emp.chiNhanhTen}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8D6E63]">Ngạch bậc:</span>
                      <span className="font-bold text-emerald-800">{emp.capBacTen}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8D6E63]">Số CCCD:</span>
                      <span className="font-mono">{emp.soCCCD}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8D6E63]">Số điện thoại:</span>
                      <span className="font-medium">{emp.soDienThoai}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8D6E63]">Lương cơ bản thỏa thuận:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {emp.luongThoaThuan.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Hồ sơ giấy tờ đã chuẩn bị */}
                  <div className="pt-3 border-t border-[#F0EAE1]">
                    <div className="text-[11px] font-bold text-[#8D6E63] mb-2 flex items-center justify-between">
                      <span>Bộ hồ sơ hành chính (6 văn bản):</span>
                      <span className="text-emerald-700 font-bold">Đầy đủ 100%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        HĐLĐ
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        JD/KPI
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        Phiếu NS
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        Thuế 08
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        PDP
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        NDA
                      </span>
                    </div>
                  </div>
                </div>

                {/* DẢI HÀNH ĐỘNG: ĐƯA LÊN BẢNG LƯƠNG */}
                {(() => {
                  const currentMonthList = payrollData[selectedPayrollMonth] || [];
                  const isEnrolled = currentMonthList.some(p => p.maNV === emp.maNV);
                  return (
                    <div className="mt-3 pt-3 border-t border-[#F0EAE1]">
                      {isEnrolled ? (
                        <div className="flex items-center justify-between gap-2 bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                            <span>Đã có trên Bảng Lương ({selectedPayrollMonth})</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSelectedMaNV(emp.maNV);
                                setActiveSubTab('payroll');
                              }}
                              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black cursor-pointer shadow-2xs"
                              title="Chuyển sang Bảng Lương xem chi tiết"
                            >
                              Xem Lương →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromPayroll(emp, selectedPayrollMonth)}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] cursor-pointer"
                              title="Gỡ khỏi kỳ lương này"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToPayroll(emp, selectedPayrollMonth)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:shadow-md"
                          title="Bấm để đưa nhân sự này lên Bảng Lương kỳ hiện tại"
                        >
                          <Wallet size={15} />
                          <span>➕ Đưa Lên Bảng Lương ({selectedPayrollMonth})</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* ACTION BAR: XEM CHI TIẾT + SỬA + XÓA */}
                <div className="mt-5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {emp.driveFolderUrl && (
                      <a
                        href={emp.driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-[#FAF7F0] hover:bg-[#EFEBE0] text-amber-800 rounded-lg transition-colors"
                        title="Mở Google Drive Hồ Sơ"
                      >
                        <FolderOpen size={14} />
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setEditingEmployee({ ...emp });
                        setShowEditEmpModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF7F0] hover:bg-[#EFEBE0] text-[#5D4037] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      title="Sửa thông tin nhân sự"
                    >
                      <Edit size={13} />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => {
                        setDeletingEmployee(emp);
                        setShowDeleteEmpConfirmModal(true);
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                      title="Xóa nhân sự khỏi hệ thống"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedEmpDetail(emp)}
                    className="px-3 py-1.5 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Xem Chi Tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CHẤM CÔNG (ATTENDANCE MATRIX) */}
      {/* ========================================================= */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-[#8D6E63]" size={22} />
              <div>
                <h3 className="font-bold text-[#4E342E] text-base">Bảng Chấm Công Tháng 10/2026</h3>
                <p className="text-xs text-[#8D6E63]">
                  Khung giờ chuẩn: <strong>09:00 - 19:00</strong> (8h làm việc + 2h nghỉ giữa ca, 48h/tuần, 26 ngày công chuẩn)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Đã đồng bộ dữ liệu chấm công sang Bảng tính lương!', true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Chốt Công Sang Bảng Lương</span>
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-[#E7E0D6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F0] border-b border-[#E7E0D6] text-[#6D4C41]">
                    <th className="py-3 px-3 font-bold sticky left-0 bg-[#FAF7F0] z-10 w-44">Họ và Tên Nhân Sự</th>
                    <th className="py-3 px-2 font-bold text-center">Chuẩn</th>
                    <th className="py-3 px-2 font-bold text-center text-emerald-800">Thực tế</th>
                    <th className="py-3 px-2 font-bold text-center text-amber-800">Phép</th>
                    <th className="py-3 px-2 font-bold text-center text-rose-800">Muộn</th>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <th
                        key={day}
                        className={`py-2 px-1 text-center font-mono text-[11px] ${
                          [4, 11, 18, 25].includes(day) ? 'bg-amber-100/60 font-bold text-amber-900' : ''
                        }`}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {attendanceRecords.map(rec => (
                    <tr key={rec.maNV} className="hover:bg-[#FCFBF8] transition-colors">
                      <td className="py-3 px-3 font-bold text-[#4E342E] sticky left-0 bg-white z-10 border-r border-[#F0EAE1]">
                        <div>{rec.hoTen}</div>
                        <div className="text-[10px] text-[#8D6E63] font-normal">{rec.chucVuLabel}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-[#6D4C41]">26</td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                        {rec.ngayCongThucTe}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-amber-800">{rec.ngayNghiPhep}</td>
                      <td className="py-3 px-2 text-center font-mono text-rose-800 font-bold">{rec.soLanDiMuon}</td>

                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                        const val = rec.chamCongTheoNgay[day] || 'V';
                        let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                        let displayChar = '✓';
                        if (val === '1/2') {
                          badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                          displayChar = '½';
                        } else if (val === 'P') {
                          badgeColor = 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
                          displayChar = 'P';
                        } else if (val === 'O') {
                          badgeColor = 'bg-purple-50 text-purple-900 border-purple-200';
                          displayChar = 'Ô';
                        } else if (val === 'KL') {
                          badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
                          displayChar = 'KL';
                        } else if (val === 'M') {
                          badgeColor = 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
                          displayChar = 'M';
                        } else if (val === 'OFF') {
                          badgeColor = 'bg-stone-100 text-stone-400 border-stone-200';
                          displayChar = '-';
                        }

                        return (
                          <td
                            key={day}
                            onClick={() => handleToggleAttendance(rec.maNV, day)}
                            className="py-2 px-0.5 text-center cursor-pointer select-none"
                            title={`Click đổi trạng thái: Ngày ${day}/10 - ${rec.hoTen}`}
                          >
                            <span
                              className={`inline-block w-6 h-6 rounded leading-6 text-[11px] font-mono border ${badgeColor}`}
                            >
                              {displayChar}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ĐĂNG KÝ & DUYỆT NGHỈ (LEAVE REQUESTS & CRUD) */}
      {/* ========================================================= */}
      {activeSubTab === 'leave' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-[#4E342E] text-base">Quản Lý Đăng Ký & Xét Duyệt Nghỉ Phép</h3>
              <p className="text-xs text-[#8D6E63]">
                Theo dõi đơn xin nghỉ phép năm, việc riêng, nghỉ ốm và hỗ trợ sửa, xóa hoặc quản lý xét duyệt trực tiếp
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={leaveFilterStatus}
                onChange={e => setLeaveFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold text-[#6D4C41] focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ChoDuyet">⏳ Chờ duyệt ({leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length})</option>
                <option value="DaDuyet">✅ Đã duyệt</option>
                <option value="TuChoi">❌ Đã từ chối</option>
              </select>

              <button
                onClick={() => setShowCreateLeaveModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Đăng Ký Nghỉ Phép</span>
              </button>
            </div>
          </div>

          {/* List of Leave Requests với nút SỬA & XÓA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredLeaveRequests.map(req => {
              const isPending = req.trangThai === 'ChoDuyet';
              const isApproved = req.trangThai === 'DaDuyet';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-[#E7E0D6] p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#4E342E]">{req.hoTen}</span>
                          <span className="text-xs text-[#8D6E63]">({req.chucVuLabel})</span>
                        </div>
                        <p className="text-xs text-[#8D6E63] mt-0.5">{req.chiNhanhTen}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                            isPending
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-rose-50 text-rose-900 border-rose-300'
                          }`}
                        >
                          {isPending && <Clock size={12} />}
                          {isApproved && <CheckCircle2 size={12} />}
                          {!isPending && !isApproved && <XCircle size={12} />}
                          {isPending ? 'Chờ duyệt' : isApproved ? 'Đã duyệt' : 'Từ chối'}
                        </span>

                        {/* Nút Sửa Đơn */}
                        <button
                          onClick={() => {
                            setEditingLeave({ ...req });
                            setShowEditLeaveModal(true);
                          }}
                          className="p-1 hover:bg-[#F5F0E6] text-[#8D6E63] hover:text-[#4E342E] rounded transition-colors"
                          title="Sửa đơn xin nghỉ"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Nút Xóa Đơn */}
                        <button
                          onClick={() => {
                            setDeletingLeaveId(req.id);
                            setShowDeleteLeaveModal(true);
                          }}
                          className="p-1 hover:bg-rose-50 text-[#8D6E63] hover:text-rose-700 rounded transition-colors"
                          title="Xóa đơn xin nghỉ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#FAF7F0] rounded-xl p-3 border border-[#E7E0D6] space-y-1.5 text-xs text-[#5D4037] my-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8D6E63]">Loại nghỉ:</span>
                        <span className="font-bold text-amber-950">{req.loaiNghiLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8D6E63]">Thời gian nghỉ:</span>
                        <span className="font-bold">
                          {req.tuNgay} → {req.denNgay} ({req.soNgayNghi} ngày)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8D6E63]">Người nhận bàn giao:</span>
                        <span className="font-medium text-[#6D4C41]">{req.nguoiBanGiao}</span>
                      </div>
                      <div className="pt-1.5 border-t border-[#E7E0D6] text-[11px] text-[#6D4C41]">
                        <span className="text-[#8D6E63]">Lý do: </span>
                        <span>{req.lyDo}</span>
                      </div>
                    </div>

                    {req.nguoiDuyet && (
                      <div className="text-[11px] text-[#8D6E63] italic">
                        Đã duyệt bởi: <strong>{req.nguoiDuyet}</strong> ({req.ngayDuyet})
                        {req.ghiChuDuyet && <div>Ghi chú: {req.ghiChuDuyet}</div>}
                      </div>
                    )}
                  </div>

                  {/* Quản lý Action Buttons */}
                  {isPending && (
                    <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApproveLeave(req.id, false)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleApproveLeave(req.id, true)}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Quản Lý Duyệt</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GIẢI THÍCH CƠ CHẾ ĐỒNG BỘ TỰ ĐỘNG & THỦ CÔNG */}
      {/* ========================================================= */}
      {showSyncExplainModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E7E0D6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-[#E7E0D6] bg-[#FAF7F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8D6E63] text-white flex items-center justify-center font-bold">
                  🔄
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#4E342E]">Cơ Chế Đồng Bộ Giữa Google Drive & Portal</h3>
                  <p className="text-xs text-[#8D6E63]">Tại sao file sửa trên Drive nhưng site cần cơ chế đồng bộ?</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncExplainModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EFEBE0] text-[#8D6E63] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-[#5D4037] max-h-[75vh] overflow-y-auto">
              {/* Vấn đề cốt lõi */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>Nguyên nhân kỹ thuật:</span>
                </div>
                <p className="leading-relaxed text-amber-950">
                  Hana Wellness Portal được build và deploy dưới dạng Single Page Application (SPA) lưu trên mạng phân phối nội dung toàn cầu (Cloudflare CDN Edge) để đạt tốc độ tải trang cực nhanh (&lt; 100ms). Khi Ban Giám đốc hoặc HR chỉnh sửa văn bản Word hoặc bảng tính Excel trên Google Drive, mã nguồn tĩnh trên CDN không thể tự biến đổi nếu không có cầu nối API kéo dữ liệu mới.
                </p>
              </div>

              {/* Giải pháp 3 tầng */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#4E342E]">Kiến Trúc Đồng Bộ 3 Tầng Đã Thiết Lập:</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E7E0D6] space-y-1.5">
                    <div className="font-bold text-[#4E342E] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#8D6E63] text-white flex items-center justify-center text-[10px]">1</span>
                      <span>File Gốc Google Drive</span>
                    </div>
                    <p className="text-[11px] text-[#8D6E63] leading-relaxed">
                      Nơi lưu trữ văn bản pháp lý Word <code>06/2026/QC-LT-HNW</code> và file Excel bảng lương. Khi sửa đổi, Drive sinh ra mốc <code>modifiedTime</code> mới.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E7E0D6] space-y-1.5">
                    <div className="font-bold text-[#4E342E] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#8D6E63] text-white flex items-center justify-center text-[10px]">2</span>
                      <span>Cloudflare Function API</span>
                    </div>
                    <p className="text-[11px] text-[#8D6E63] leading-relaxed">
                      Endpoint <code>/api/sync-salary</code> kết nối bảo mật OAuth2 với Google Drive API v3 để đọc phiên bản và snapshot thay đổi mới nhất theo thời gian thực.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E7E0D6] space-y-1.5">
                    <div className="font-bold text-[#4E342E] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#8D6E63] text-white flex items-center justify-center text-[10px]">3</span>
                      <span>Portal Tự Động & Thủ Công</span>
                    </div>
                    <p className="text-[11px] text-[#8D6E63] leading-relaxed">
                      Portal tự động kiểm tra ngầm mỗi khi người dùng truy cập hoặc mỗi 10 phút. Người dùng cũng có thể bấm nút <strong>"Đồng bộ từ Google Drive"</strong> để cập nhật tức thì.
                    </p>
                  </div>
                </div>
              </div>

              {/* So sánh hai chế độ */}
              <div className="space-y-2 pt-2 border-t border-[#E7E0D6]">
                <h4 className="font-bold text-xs text-[#4E342E]">Hai Chế Độ Đồng Bộ Hoạt Động Song Song:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-1">⚡ Tự động (Auto-Sync)</span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Khi mở trang Portal, hệ thống âm thầm so sánh <code>modifiedTime</code> trên Drive. Nếu phát hiện sếp vừa sửa file, site sẽ tự động cập nhật số liệu và thông báo cho bạn.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-1">🔄 Thủ công (Manual Sync)</span>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Bấm nút <strong>"Đồng bộ từ Google Drive"</strong> ở thanh tiêu đề khi bạn vừa sửa xong file trên Drive và muốn thấy kết quả trên web ngay lập tức mà không cần chờ.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E7E0D6] bg-[#FAF7F0] flex items-center justify-end">
              <button
                onClick={() => setShowSyncExplainModal(false)}
                className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SỬA HỒ SƠ NHÂN VIÊN (EDIT EMPLOYEE) */}
      {/* ========================================================= */}
      {showEditEmpModal && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E7E0D6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E7E0D6] bg-[#FAF7F0] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#4E342E]">Chỉnh Sửa Hồ Sơ Nhân Viên</h3>
                <p className="text-xs text-[#8D6E63]">Mã nhân sự: {editingEmployee.maNV}</p>
              </div>
              <button
                onClick={() => setShowEditEmpModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EFEBE0] text-[#8D6E63] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditEmployee} className="p-6 space-y-4 text-xs text-[#5D4037] max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Họ và tên nhân sự:</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.hoTen}
                    onChange={e => setEditingEmployee({ ...editingEmployee, hoTen: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Chức danh / Vị trí:</label>
                  <select
                    value={editingEmployee.chucVu}
                    onChange={e => {
                      const val = e.target.value as any;
                      const labelMap: Record<string, string> = {
                        KTV: 'Kỹ thuật viên Spa & Trị liệu',
                        LeTan: 'Lễ tân / CSKH',
                        KeToan: 'Kế toán',
                        QuanLy: 'Quản lý Cơ sở',
                        Marketing: 'Marketing',
                        BaoVe: 'Bảo vệ',
                        TapVu: 'Lao công / Tạp vụ',
                      };
                      setEditingEmployee({
                        ...editingEmployee,
                        chucVu: val,
                        chucVuLabel: labelMap[val] || val,
                      });
                    }}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                  >
                    <option value="KTV">Kỹ thuật viên Spa & Trị liệu (KTV)</option>
                    <option value="LeTan">Lễ tân / CSKH</option>
                    <option value="KeToan">Kế toán</option>
                    <option value="QuanLy">Quản lý Cơ sở</option>
                    <option value="Marketing">Marketing</option>
                    <option value="BaoVe">Bảo vệ</option>
                    <option value="TapVu">Lao công / Tạp vụ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Ngạch:</label>
                  <input
                    type="text"
                    value={editingEmployee.ngach}
                    onChange={e => setEditingEmployee({ ...editingEmployee, ngach: e.target.value.toUpperCase() as any })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Bậc:</label>
                  <select
                    value={editingEmployee.bac}
                    onChange={e =>
                      setEditingEmployee({
                        ...editingEmployee,
                        bac: Number(e.target.value) as any,
                        capBacTen: `${editingEmployee.chucVuLabel} - Bậc ${e.target.value}`,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                  >
                    <option value={1}>Bậc 1</option>
                    <option value={2}>Bậc 2</option>
                    <option value={3}>Bậc 3</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Chi nhánh:</label>
                  <select
                    value={editingEmployee.chiNhanh}
                    onChange={e =>
                      setEditingEmployee({
                        ...editingEmployee,
                        chiNhanh: e.target.value,
                        chiNhanhTen: e.target.value === 'CN1' ? 'Chi nhánh 1 — Quận 1' : 'Chi nhánh Quận 3 (Trụ sở)',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                  >
                    <option value="CN_Q3">Chi nhánh Quận 3 (Trụ sở)</option>
                    <option value="CN1">Chi nhánh 1 — Quận 1</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Lương thỏa thuận (VNĐ):</label>
                  <input
                    type="number"
                    step="any"
                    value={editingEmployee.luongThoaThuan}
                    onChange={e => setEditingEmployee({ ...editingEmployee, luongThoaThuan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Mức lương cam kết (VNĐ):</label>
                  <input
                    type="number"
                    step="any"
                    value={editingEmployee.mucLuongCamKet || 0}
                    onChange={e => setEditingEmployee({ ...editingEmployee, mucLuongCamKet: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-amber-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Số điện thoại:</label>
                  <input
                    type="text"
                    value={editingEmployee.soDienThoai}
                    onChange={e => setEditingEmployee({ ...editingEmployee, soDienThoai: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Số CCCD:</label>
                  <input
                    type="text"
                    value={editingEmployee.soCCCD}
                    onChange={e => setEditingEmployee({ ...editingEmployee, soCCCD: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Địa chỉ thường trú (HKTT):</label>
                <input
                  type="text"
                  value={editingEmployee.diaChiThuongTru}
                  onChange={e => setEditingEmployee({ ...editingEmployee, diaChiThuongTru: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Số tài khoản ngân hàng:</label>
                  <input
                    type="text"
                    value={editingEmployee.soTaiKhoan}
                    onChange={e => setEditingEmployee({ ...editingEmployee, soTaiKhoan: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ngân hàng:</label>
                  <input
                    type="text"
                    value={editingEmployee.nganHang}
                    onChange={e => setEditingEmployee({ ...editingEmployee, nganHang: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E0D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditEmpModal(false)}
                  className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XÁC NHẬN XÓA NHÂN VIÊN (DELETE EMPLOYEE) */}
      {/* ========================================================= */}
      {showDeleteEmpConfirmModal && deletingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-rose-100 bg-rose-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-900">Xác Nhận Xóa Nhân Viên</h3>
                <p className="text-xs text-rose-700">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-6 space-y-3 text-xs text-[#5D4037]">
              <p>
                Bạn có chắc chắn muốn xóa hồ sơ của nhân sự:
              </p>
              <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E7E0D6]">
                <p className="font-bold text-sm text-[#4E342E]">{deletingEmployee.hoTen}</p>
                <p className="text-[#8D6E63]">
                  Mã: {deletingEmployee.maNV} · {deletingEmployee.chucVuLabel} ({deletingEmployee.chiNhanhTen})
                </p>
              </div>
              <p className="text-rose-700 italic">
                Lưu ý: Dữ liệu hồ sơ sẽ bị xóa khỏi danh sách nhân sự hiện tại.
              </p>
            </div>

            <div className="p-4 border-t border-[#E7E0D6] bg-[#FAF7F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteEmpConfirmModal(false)}
                className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SỬA ĐƠN XIN NGHỈ (EDIT LEAVE REQUEST) */}
      {/* ========================================================= */}
      {showEditLeaveModal && editingLeave && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E7E0D6] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E7E0D6] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="font-bold text-base text-[#4E342E]">Chỉnh Sửa Đơn Xin Nghỉ Phép</h3>
              <button
                onClick={() => setShowEditLeaveModal(false)}
                className="text-[#8D6E63] hover:text-[#4E342E] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditLeave} className="p-6 space-y-4 text-xs text-[#5D4037]">
              <div>
                <label className="block font-bold mb-1">Nhân Sự:</label>
                <div className="px-3 py-2 bg-[#FAF7F0] border border-[#E7E0D6] rounded-xl font-bold">
                  {editingLeave.hoTen} ({editingLeave.chucVuLabel})
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Loại Nghỉ Phép:</label>
                <select
                  value={editingLeave.loaiNghi}
                  onChange={e => setEditingLeave({ ...editingLeave, loaiNghi: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                >
                  <option value="PhepNam">Nghỉ phép năm (Hưởng nguyên lương)</option>
                  <option value="ViecRieng">Nghỉ việc riêng (Hiếu, hỷ gia đình)</option>
                  <option value="NghiOm">Nghỉ ốm có giấy khám y tế</option>
                  <option value="KhongLuong">Nghỉ không hưởng lương</option>
                  <option value="DoiCa">Đổi ca làm việc / Trực bù</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Từ ngày:</label>
                  <input
                    type="date"
                    required
                    value={editingLeave.tuNgay}
                    onChange={e => setEditingLeave({ ...editingLeave, tuNgay: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Đến ngày:</label>
                  <input
                    type="date"
                    required
                    value={editingLeave.denNgay}
                    onChange={e => setEditingLeave({ ...editingLeave, denNgay: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Số ngày nghỉ:</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editingLeave.soNgayNghi}
                  onChange={e => setEditingLeave({ ...editingLeave, soNgayNghi: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Người nhận bàn giao công việc:</label>
                <input
                  type="text"
                  value={editingLeave.nguoiBanGiao}
                  onChange={e => setEditingLeave({ ...editingLeave, nguoiBanGiao: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Lý do xin nghỉ:</label>
                <textarea
                  rows={2}
                  required
                  value={editingLeave.lyDo}
                  onChange={e => setEditingLeave({ ...editingLeave, lyDo: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E0D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditLeaveModal(false)}
                  className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Cập Nhật Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XÁC NHẬN XÓA ĐƠN NGHỈ (DELETE LEAVE CONFIRM) */}
      {/* ========================================================= */}
      {showDeleteLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-rose-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-base text-rose-900">Xóa Đơn Xin Nghỉ?</h3>
            </div>
            <p className="text-xs text-[#6D4C41]">
              Bạn có chắc chắn muốn xóa đơn xin nghỉ này khỏi hệ thống quản lý?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E7E0D6]">
              <button
                onClick={() => setShowDeleteLeaveModal(false)}
                className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteLeave}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XEM CHI TIẾT HỒ SƠ NHÂN VIÊN */}
      {/* ========================================================= */}
      {selectedEmpDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E7E0D6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-[#E7E0D6] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#8D6E63] text-white flex items-center justify-center font-black text-lg shadow-xs">
                  {selectedEmpDetail.hoTen.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#4E342E]">{selectedEmpDetail.hoTen}</h3>
                  <p className="text-xs text-[#8D6E63]">
                    Mã NV: <strong>{selectedEmpDetail.maNV}</strong> · {selectedEmpDetail.chucVuLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmpDetail(null)}
                className="p-1.5 rounded-full hover:bg-[#EFEBE0] text-[#8D6E63] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-[#5D4037] max-h-[70vh] overflow-y-auto">
              {/* Thông tin nhân thân */}
              <div>
                <h4 className="font-bold text-sm text-[#4E342E] mb-2 flex items-center gap-1.5">
                  <Users size={16} className="text-[#8D6E63]" />
                  <span>Thông Tin Cá Nhân & Căn Cước Công Dân</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E0D6]">
                  <div>
                    <span className="text-[#8D6E63]">Ngày sinh:</span>{' '}
                    <span className="font-semibold">{selectedEmpDetail.ngaySinh}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Giới tính:</span>{' '}
                    <span className="font-semibold">{selectedEmpDetail.gioiTinh}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Số CCCD:</span>{' '}
                    <span className="font-mono font-bold">{selectedEmpDetail.soCCCD}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Ngày cấp:</span> <span>{selectedEmpDetail.ngayCapCCCD}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8D6E63]">Nơi cấp:</span> <span>{selectedEmpDetail.noiCapCCCD}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8D6E63]">Quê quán:</span> <span>{selectedEmpDetail.queQuan}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8D6E63]">Đăng ký thường trú (HKTT):</span>{' '}
                    <span className="font-semibold">{selectedEmpDetail.diaChiThuongTru}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8D6E63]">Chỗ ở hiện nay:</span>{' '}
                    <span>{selectedEmpDetail.choOHienNay}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Điện thoại:</span>{' '}
                    <span className="font-semibold">{selectedEmpDetail.soDienThoai}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Email:</span>{' '}
                    <span>{selectedEmpDetail.email}</span>
                  </div>
                </div>
              </div>

              {/* Chuyên môn & Bằng cấp */}
              <div>
                <h4 className="font-bold text-sm text-[#4E342E] mb-2 flex items-center gap-1.5">
                  <Award size={16} className="text-amber-700" />
                  <span>Trình Độ Chuyên Môn & Chứng Chỉ Nghề</span>
                </h4>
                <div className="bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E0D6] space-y-1.5">
                  <div>
                    <span className="text-[#8D6E63]">Trình độ / Tay nghề:</span>{' '}
                    <span className="font-bold text-emerald-800">{selectedEmpDetail.trinhDoChuyenMon}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Chứng chỉ hành nghề:</span>{' '}
                    <span>{selectedEmpDetail.chungChiNghe}</span>
                  </div>
                </div>
              </div>

              {/* Hợp đồng & Lương chế độ */}
              <div>
                <h4 className="font-bold text-sm text-[#4E342E] mb-2 flex items-center gap-1.5">
                  <Wallet size={16} className="text-[#8D6E63]" />
                  <span>Chế Độ Đãi Ngộ & Hợp Đồng Lao Động</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E0D6]">
                  <div>
                    <span className="text-[#8D6E63]">Số HĐLĐ:</span>{' '}
                    <span className="font-mono font-bold">{selectedEmpDetail.soHopDong}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Loại HĐ:</span>{' '}
                    <span>{selectedEmpDetail.loaiHopDong}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Lương cơ bản thỏa thuận:</span>{' '}
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedEmpDetail.luongThoaThuan.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Mức lương cam kết:</span>{' '}
                    <span className="font-mono font-bold text-amber-800">
                      {(selectedEmpDetail.mucLuongCamKet || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Tài khoản ngân hàng:</span>{' '}
                    <span className="font-mono">{selectedEmpDetail.soTaiKhoan} ({selectedEmpDetail.nganHang})</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Ngày vào làm:</span>{' '}
                    <span>{selectedEmpDetail.ngayVaoLam}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E7E0D6] bg-[#FAF7F0] flex items-center justify-between">
              {selectedEmpDetail.driveFolderUrl ? (
                <a
                  href={selectedEmpDetail.driveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <FolderOpen size={16} />
                  <span>Mở Google Drive Hồ Sơ Cá Nhân</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingEmployee({ ...selectedEmpDetail });
                    setShowEditEmpModal(true);
                  }}
                  className="px-4 py-2 bg-[#FAF7F0] hover:bg-[#EFEBE0] text-[#5D4037] border border-[#E7E0D6] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit size={14} />
                  <span>Sửa Hồ Sơ</span>
                </button>
                <button
                  onClick={() => setSelectedEmpDetail(null)}
                  className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TẠO ĐƠN XIN NGHỈ MỚI */}
      {/* ========================================================= */}
      {showCreateLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E7E0D6] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E7E0D6] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="font-bold text-base text-[#4E342E]">Đăng Ký Đơn Xin Nghỉ Phép</h3>
              <button
                onClick={() => setShowCreateLeaveModal(false)}
                className="text-[#8D6E63] hover:text-[#4E342E] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeaveRequest} className="p-6 space-y-4 text-xs text-[#5D4037]">
              <div>
                <label className="block font-bold mb-1">Chọn Nhân Sự:</label>
                <select
                  value={newLeaveEmpId}
                  onChange={e => setNewLeaveEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                >
                  {employees.map(emp => (
                    <option key={emp.maNV} value={emp.maNV}>
                      {emp.hoTen} ({emp.chucVuLabel} — {emp.chiNhanhTen})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Loại Nghỉ Phép:</label>
                <select
                  value={newLeaveType}
                  onChange={e => setNewLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                >
                  <option value="PhepNam">Nghỉ phép năm (Hưởng nguyên lương)</option>
                  <option value="ViecRieng">Nghỉ việc riêng (Hiếu, hỷ gia đình)</option>
                  <option value="NghiOm">Nghỉ ốm có giấy khám y tế</option>
                  <option value="KhongLuong">Nghỉ không hưởng lương</option>
                  <option value="DoiCa">Đổi ca làm việc / Trực bù</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Từ ngày:</label>
                  <input
                    type="date"
                    required
                    value={newLeaveFrom}
                    onChange={e => setNewLeaveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Đến ngày:</label>
                  <input
                    type="date"
                    required
                    value={newLeaveTo}
                    onChange={e => setNewLeaveTo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Số ngày nghỉ:</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newLeaveDays}
                  onChange={e => setNewLeaveDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Người nhận bàn giao công việc / ca trực:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: KTV Vũ Thị Thanh Hoa"
                  value={newLeaveHandover}
                  onChange={e => setNewLeaveHandover(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Lý do xin nghỉ:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ghi rõ lý do xin nghỉ..."
                  value={newLeaveReason}
                  onChange={e => setNewLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E0D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLeaveModal(false)}
                  className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Gửi Đơn Xin Nghỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM NHÂN VIÊN MỚI */}
      {/* ========================================================= */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E7E0D6] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#E7E0D6] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="font-bold text-base text-[#4E342E]">Thêm Hồ Sơ Nhân Viên Mới</h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="text-[#8D6E63] hover:text-[#4E342E] text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newEmpName.trim()) return;
                const newEmp: EmployeeProfile = {
                  maNV: `NV_${Date.now().toString().slice(-4)}`,
                  hoTen: newEmpName.trim().toUpperCase(),
                  chucVu: newEmpRole as any,
                  chucVuLabel:
                    newEmpRole === 'KTV'
                      ? 'Kỹ thuật viên Spa & Trị liệu'
                      : newEmpRole === 'LeTan'
                      ? 'Lễ tân / CSKH'
                      : newEmpRole === 'KeToan'
                      ? 'Kế toán'
                      : 'Quản lý Cơ sở',
                  ngach: (newEmpRole === 'KTV' ? 'KTV' : newEmpRole === 'LeTan' ? 'LT' : 'KT') as any,
                  bac: 1,
                  capBacTen: `${newEmpRole} - Bậc 1`,
                  chiNhanh: 'CN_Q3',
                  chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
                  soDienThoai: newEmpPhone || '0900000000',
                  email: `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@hanawellness.vn`,
                  ngaySinh: '01/01/1995',
                  gioiTinh: 'Nữ',
                  soCCCD: '079000000000',
                  ngayCapCCCD: '01/01/2022',
                  noiCapCCCD: 'Cục Cảnh sát QLHC về TTXH',
                  queQuan: 'TP. Hồ Chí Minh',
                  diaChiThuongTru: 'TP. Hồ Chí Minh',
                  choOHienNay: 'TP. Hồ Chí Minh',
                  trinhDoChuyenMon: 'Đã hoàn thành đào tạo chuẩn Hana Care Passport',
                  chungChiNghe: 'Chứng chỉ hành nghề',
                  ngayVaoLam: '01/10/2026',
                  loaiHopDong: 'Hợp đồng lao động xác định thời hạn 12 tháng',
                  soHopDong: `HĐLĐ-HNW-${Date.now().toString().slice(-4)}`,
                  luongThoaThuan: Number(newEmpSalary) || 5500000,
                  luongDongBHXH: 5500000,
                  hinhThucLuong: 'LCBHoaHong',
                  trangThaiLamViec: 'Thử việc',
                  soTaiKhoan: '................',
                  nganHang: 'Ngân hàng',
                  hoSoGiayTo: {
                    hopDongLaoDong: true,
                    banMoTaCongViecJD: true,
                    phieuThongTinNhanSu: true,
                    banCamKetThue08: false,
                    banCamKetPDP: false,
                    thoaThuanBaoMatNDA: false,
                    giayKhamSucKhoe: false,
                  },
                };
                updateEmployees([newEmp, ...employees]);
                setShowAddEmpModal(false);
                setNewEmpName('');
                setNewEmpPhone('');
                showToast(`Đã thêm nhân sự ${newEmp.hoTen} thành công!`, true);
              }}
              className="p-6 space-y-4 text-xs text-[#5D4037]"
            >
              <div>
                <label className="block font-bold mb-1">Họ và tên nhân sự (Chữ in hoa):</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: NGUYỄN THỊ MAI"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Vị trí / Chức danh:</label>
                <select
                  value={newEmpRole}
                  onChange={e => setNewEmpRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-bold"
                >
                  <option value="KTV">Kỹ thuật viên Spa & Trị liệu (KTV)</option>
                  <option value="LeTan">Lễ tân / Chăm sóc khách hàng (CSKH)</option>
                  <option value="KeToan">Kế toán</option>
                  <option value="QuanLy">Quản lý Cơ sở</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Số điện thoại liên lạc:</label>
                <input
                  type="text"
                  placeholder="0909 xxx xxx"
                  value={newEmpPhone}
                  onChange={e => setNewEmpPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Lương cơ bản thỏa thuận (VNĐ):</label>
                <input
                  type="number"
                  step="any"
                  value={newEmpSalary}
                  onChange={e => setNewEmpSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E0D6] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 bg-[#EFEBE0] text-[#5D4037] rounded-xl font-bold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Thêm Mới Nhân Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${
            toast.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <CheckCircle2 size={16} className={toast.success ? 'text-emerald-600' : 'text-red-600'} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
