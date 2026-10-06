import { useState, useMemo } from 'react';
import {
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
  FileText,
  BadgeCheck,
  Award,
  FolderOpen,
  Check,
  Info,
} from 'lucide-react';
import PayrollView from './PayrollView';
import {
  INITIAL_EMPLOYEES,
  SALARY_REGULATIONS,
  INITIAL_LEAVE_REQUESTS,
  getInitialAttendanceMatrix,
  SALARY_REGULATION_URL,
} from '../data/hrData';
import type { EmployeeProfile, LeaveRequest, AttendanceMatrixRecord } from '../types/hr';
import { useHana } from '../store/HanaContext';

export default function HRManagementView() {
  const { currentUser } = useHana();

  // Sub-tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'directory' | 'attendance' | 'leave' | 'regulations'>('payroll');

  // Employee Directory States
  const [employees, setEmployees] = useState<EmployeeProfile[]>(INITIAL_EMPLOYEES);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<EmployeeProfile | null>(null);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);

  // New Employee Form States
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('KTV');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState(5500000);

  // Leave Management States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<string>('ALL');
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [newLeaveEmpId, setNewLeaveEmpId] = useState<string>(employees[0]?.maNV || '');
  const [newLeaveType, setNewLeaveType] = useState<LeaveRequest['loaiNghi']>('PhepNam');
  const [newLeaveFrom, setNewLeaveFrom] = useState('');
  const [newLeaveTo, setNewLeaveTo] = useState('');
  const [newLeaveDays, setNewLeaveDays] = useState(1);
  const [newLeaveReason, setNewLeaveReason] = useState('');
  const [newLeaveHandover, setNewLeaveHandover] = useState('');

  // Attendance Matrix States
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceMatrixRecord[]>(getInitialAttendanceMatrix());

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

  // Leave Approval Handlers
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
    setLeaveRequests(updated);
    showToast(isApproved ? 'Đã DUYỆT đơn xin nghỉ thành công!' : 'Đã TỪ CHỐI đơn xin nghỉ.', isApproved);
  };

  // Create Leave Request Handler
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

    setLeaveRequests([newReq, ...leaveRequests]);
    setShowCreateLeaveModal(false);
    showToast(`Đã gửi đơn xin nghỉ của nhân sự ${emp.hoTen}. Chờ Quản lý phê duyệt!`, true);
  };

  // Filtered Leave Requests
  const filteredLeaveRequests = useMemo(() => {
    if (leaveFilterStatus === 'ALL') return leaveRequests;
    return leaveRequests.filter(req => req.trangThai === leaveFilterStatus);
  }, [leaveRequests, leaveFilterStatus]);

  // Attendance Toggle Status Handler
  const handleToggleAttendance = (maNV: string, day: number) => {
    const cycle: AttendanceMatrixRecord['chamCongTheoNgay'][number][] = ['V', '1/2', 'P', 'O', 'KL', 'M', 'OFF'];
    setAttendanceRecords(prev =>
      prev.map(rec => {
        if (rec.maNV === maNV) {
          const current = rec.chamCongTheoNgay[day] || 'V';
          const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
          const nextVal = cycle[nextIdx];
          const newMap = { ...rec.chamCongTheoNgay, [day]: nextVal };

          // recalculate
          let cong = 0;
          let phep = 0;
          let kl = 0;
          let muon = 0;
          for (let d = 1; d <= 31; d++) {
            const v = newMap[d];
            if (v === 'V') cong += 1;
            else if (v === '1/2') cong += 0.5;
            else if (v === 'P') phep += 1;
            else if (v === 'KL') kl += 1;
            else if (v === 'M') {
              cong += 1;
              muon += 1;
            }
          }

          return {
            ...rec,
            chamCongTheoNgay: newMap,
            ngayCongThucTe: Math.min(26, cong),
            ngayNghiPhep: phep,
            ngayNghiKhongLuong: kl,
            soLanDiMuon: muon,
          };
        }
        return rec;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E0D6] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-emerald-600" /> Phân hệ Quản trị Nhân sự & Tiền lương
            </span>
            <span className="text-xs text-[#8D6E63] font-semibold">Quy chuẩn Hana Wellness</span>
          </div>
          <h1 className="text-2xl font-black text-[#4E342E] tracking-tight">
            Quản trị Nhân sự, Bảng Lương & Chấm Công
          </h1>
          <p className="text-sm text-[#8D6E63] mt-0.5">
            Tích hợp toàn diện: Bảng lương ERP, Hồ sơ nhân viên, Thang ngạch bậc quy chế, Chấm công ca 09h-19h và Duyệt nghỉ phép
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={SALARY_REGULATION_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition-colors shadow-xs"
            title="Mở văn bản 06/2026/QC-LT-HNW trên Google Docs"
          >
            <FileText size={16} className="text-amber-700" />
            <span>Quy chế Lương (Google Docs)</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Main Tab Bar Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E7E0D6] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'payroll'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <Wallet size={18} />
          <span>Bảng Lương ERP & Phiếu Lương</span>
        </button>

        <button
          onClick={() => setActiveSubTab('regulations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'regulations'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <Award size={18} />
          <span>Chế độ Lương theo Vị trí & Thang Bảng Lương</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <Users size={18} />
          <span>Hồ Sơ Nhân Viên ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <CalendarDays size={18} />
          <span>Bảng Chấm Công (Ca 09:00 - 19:00)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leave')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer relative ${
            activeSubTab === 'leave'
              ? 'bg-[#8D6E63] text-white shadow-md'
              : 'text-[#6D4C41] hover:bg-[#F5F0E6] hover:text-[#4E342E]'
          }`}
        >
          <FileCheck2 size={18} />
          <span>Đăng Ký & Duyệt Nghỉ</span>
          {leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
              {leaveRequests.filter(r => r.trangThai === 'ChoDuyet').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BẢNG LƯƠNG ERP (PAYROLL) */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-4">
          <PayrollView />
        </div>
      )}

      {/* TAB 2: QUY CHẾ LƯƠNG & CHẾ ĐỘ THEO VỊ TRÍ */}
      {activeSubTab === 'regulations' && (
        <div className="space-y-6">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <Info className="text-amber-700 shrink-0 mt-0.5" size={20} />
            <div className="text-xs text-amber-950 space-y-1">
              <p className="font-bold text-sm text-amber-900">
                Quy chế Lương, Thưởng, Phúc lợi & Thang Bảng Lương (Số: 06/2026/QC-LT-HNW - Ngày 20/09/2026)
              </p>
              <p>
                Áp dụng cho toàn bộ CBNV Công ty TNHH Hana Wellness. Cơ chế tính lương kết hợp giữa{' '}
                <strong>Lương cơ bản ngạch bậc</strong>, <strong>Phụ cấp ăn trưa 40.000đ/bữa</strong> (tối đa 2 bữa/ngày),{' '}
                <strong>Hỗ trợ xăng xe 1.500.000đ</strong>, <strong>% Hoa hồng đi tour/bán lẻ</strong> và{' '}
                <strong>Thưởng KPI hiệu quả</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E0D6] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E7E0D6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#4E342E] text-base">Thang Bảng Lương Ngạch Bậc Hệ Thống (VNĐ)</h3>
                <p className="text-xs text-[#8D6E63]">Căn cứ Điều I & Phụ lục Bảng ngạch bậc ban hành kèm Quyết định 06/2026/QC-LT-HNW</p>
              </div>
              <a
                href={SALARY_REGULATION_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#8D6E63] hover:text-[#5D4037] flex items-center gap-1 hover:underline"
              >
                <span>Xem bản đầy đủ trên Google Docs</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F0] border-b border-[#E7E0D6] text-[#6D4C41]">
                    <th className="py-3 px-4 font-bold">Chức danh công việc</th>
                    <th className="py-3 px-3 font-bold text-center">Ngạch</th>
                    <th className="py-3 px-4 font-bold text-right text-emerald-800">Bậc 1 (VNĐ)</th>
                    <th className="py-3 px-4 font-bold text-right text-emerald-800">Bậc 2 (VNĐ)</th>
                    <th className="py-3 px-4 font-bold text-right text-emerald-800">Bậc 3 (VNĐ)</th>
                    <th className="py-3 px-4 font-bold">Chế độ hoa hồng / Thưởng</th>
                    <th className="py-3 px-4 font-bold">Mô tả trách nhiệm vị trí</th>
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
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {item.bac1.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {item.bac2.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {item.bac3.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-[#5D4037] max-w-xs">
                        <div className="font-semibold text-amber-900">{item.hoaHong}</div>
                        <div className="text-[11px] text-[#8D6E63] mt-0.5">{item.thuongKPI}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#8D6E63] max-w-sm text-[11px] leading-relaxed">
                        {item.moTa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards chi tiết chính sách phụ cấp & đãi ngộ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center font-bold mb-3">
                🍱
              </div>
              <h4 className="font-bold text-[#4E342E] text-sm">Phụ Cấp Ăn Trưa & Ca Làm</h4>
              <p className="text-xs text-[#8D6E63] mt-2 leading-relaxed">
                Hỗ trợ <strong>40.000 VNĐ/bữa</strong> (ngày tối đa 2 bữa đối với nhân sự làm ca 10 tiếng: 09:00 - 19:00, có 2 tiếng nghỉ ngơi phục hồi thể lực).
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
                🛵
              </div>
              <h4 className="font-bold text-[#4E342E] text-sm">Hỗ Trợ Xăng Xe & Đi Lại</h4>
              <p className="text-xs text-[#8D6E63] mt-2 leading-relaxed">
                Hỗ trợ tối đa <strong>1.500.000 VNĐ/tháng</strong> tùy cự ly và điều kiện di chuyển thực tế của nhân sự phục vụ hoạt động cơ sở.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
                🏥
              </div>
              <h4 className="font-bold text-[#4E342E] text-sm">Khám Sức Khỏe & Đào Tạo Nghề</h4>
              <p className="text-xs text-[#8D6E63] mt-2 leading-relaxed">
                Khám sức khỏe tổng quát 12 tháng/lần miễn phí 100%. Được đào tạo chuyên sâu về Điện sinh học DDS & phác đồ trị liệu độc quyền theo Điều 62 BLLĐ 2019.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HỒ SƠ NHÂN VIÊN (DIRECTORY & DOSSIER) */}
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
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Thêm Nhân Viên Mới</span>
            </button>
          </div>

          {/* Employee Grid Cards */}
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
                      <span className="text-[#8D6E63]">Lương cơ bản:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {emp.luongThoaThuan.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Hồ sơ giấy tờ đã chuẩn bị (6 văn bản chuẩn) */}
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

                <div className="mt-5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
                  {emp.driveFolderUrl ? (
                    <a
                      href={emp.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-[#8D6E63] hover:text-[#4E342E] transition-colors"
                    >
                      <FolderOpen size={14} className="text-amber-700" />
                      <span>Folder Drive</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#A1887F]">Hồ sơ lưu trữ nội bộ</span>
                  )}

                  <button
                    onClick={() => setSelectedEmpDetail(emp)}
                    className="px-3 py-1.5 bg-[#FAF7F0] hover:bg-[#EFEBE0] text-[#5D4037] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Xem Chi Tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHẤM CÔNG (ATTENDANCE MATRIX) */}
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

          {/* Ký hiệu ghi chú */}
          <div className="bg-[#FAF7F0] rounded-xl p-3 border border-[#E7E0D6] flex flex-wrap items-center gap-4 text-xs font-semibold text-[#6D4C41]">
            <span className="text-[#8D6E63] font-bold">Ký hiệu chấm công:</span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                ✓
              </span>{' '}
              Đủ công (1 công)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                ½
              </span>{' '}
              Nửa công (0.5)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                P
              </span>{' '}
              Phép năm (hưởng lương)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-[10px]">
                Ô
              </span>{' '}
              Nghỉ ốm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-[10px]">
                M
              </span>{' '}
              Đi muộn (-50k)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                OFF
              </span>{' '}
              Nghỉ tuần
            </span>
            <span className="text-[11px] text-[#A1887F] italic">(Click trực tiếp vào ô ngày để chuyển đổi trạng thái công)</span>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-[#E7E0D6] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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

      {/* TAB 5: ĐĂNG KÝ & DUYỆT NGHỈ (LEAVE REQUESTS & APPROVAL) */}
      {activeSubTab === 'leave' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#E7E0D6] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-[#4E342E] text-base">Quản Lý Đăng Ký & Xét Duyệt Nghỉ Phép</h3>
              <p className="text-xs text-[#8D6E63]">
                Theo dõi đơn xin nghỉ phép năm, việc riêng, nghỉ ốm và phân quyền Quản lý xét duyệt trực tiếp
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

          {/* List of Leave Requests */}
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

      {/* MODAL: XEM CHI TIẾT HỒ SƠ NHÂN VIÊN */}
      {selectedEmpDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E7E0D6] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-[#E7E0D6] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#8D6E63] text-white flex items-center justify-center font-bold text-lg uppercase shadow-xs">
                  {selectedEmpDetail.hoTen.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#4E342E]">{selectedEmpDetail.hoTen}</h3>
                  <p className="text-xs text-[#8D6E63] font-semibold">
                    {selectedEmpDetail.chucVuLabel} — Mã: {selectedEmpDetail.maNV}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmpDetail(null)}
                className="p-2 text-[#8D6E63] hover:text-[#4E342E] rounded-lg hover:bg-[#EFEBE0]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs text-[#5D4037]">
              {/* Thẻ thông tin cá nhân & CCCD */}
              <div>
                <h4 className="font-bold text-sm text-[#4E342E] mb-2 flex items-center gap-1.5">
                  <BadgeCheck size={16} className="text-emerald-700" />
                  <span>Thông Tin Cá Nhân & Căn Cước Công Dân</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-[#FAF7F0] p-4 rounded-xl border border-[#E7E0D6]">
                  <div>
                    <span className="text-[#8D6E63]">Ngày sinh:</span>{' '}
                    <span className="font-bold">{selectedEmpDetail.ngaySinh}</span> ({selectedEmpDetail.gioiTinh})
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Số CCCD:</span>{' '}
                    <span className="font-mono font-bold">{selectedEmpDetail.soCCCD}</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Ngày & Nơi cấp:</span>{' '}
                    <span>{selectedEmpDetail.ngayCapCCCD} ({selectedEmpDetail.noiCapCCCD})</span>
                  </div>
                  <div>
                    <span className="text-[#8D6E63]">Quê quán:</span>{' '}
                    <span>{selectedEmpDetail.queQuan}</span>
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

              {/* Thông tin người liên hệ khẩn cấp */}
              {selectedEmpDetail.nguoiLienHeKhanCap && (
                <div>
                  <h4 className="font-bold text-sm text-[#4E342E] mb-2">Thông Tin Người Thân & Liên Hệ Khẩn Cấp</h4>
                  <div className="bg-[#FAF7F0] p-3 rounded-xl border border-[#E7E0D6] text-xs">
                    <div>
                      Họ tên: <strong>{selectedEmpDetail.nguoiLienHeKhanCap.hoTen}</strong> (
                      {selectedEmpDetail.nguoiLienHeKhanCap.quanHe}) — SĐT:{' '}
                      {selectedEmpDetail.nguoiLienHeKhanCap.soDienThoai}
                    </div>
                    <div className="text-[11px] text-[#8D6E63] mt-0.5">
                      Địa chỉ: {selectedEmpDetail.nguoiLienHeKhanCap.diaChi}
                    </div>
                  </div>
                </div>
              )}
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

              <button
                onClick={() => setSelectedEmpDetail(null)}
                className="px-5 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO ĐƠN XIN NGHỈ MỚI */}
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

      {/* MODAL: THÊM NHÂN VIÊN MỚI */}
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
                setEmployees([newEmp, ...employees]);
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
                  step="100000"
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

      {/* Toast Notification */}
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
