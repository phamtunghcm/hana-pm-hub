import fs from 'fs';

const filePath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/components/PayrollView.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Cập nhật Import
if (!code.includes('HANA_DATA_VERSION')) {
  code = code.replace(
    "import {\n  INITIAL_PAYROLL_DATA,",
    "import { INITIAL_EMPLOYEES } from '../data/hrData';\nimport {\n  HANA_DATA_VERSION,\n  INITIAL_PAYROLL_DATA,"
  );
}

// 2. Cập nhật State khởi tạo payrollData với auto-cleanup
const oldInitPattern = `  // Payroll Data State với LocalStorage persistence
  const [payrollData, setPayrollData] = useState<Record<string, EmployeePayroll[]>>(() => {
    const saved = localStorage.getItem('HANA_PAYROLL_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PAYROLL_DATA;
      }
    }
    return INITIAL_PAYROLL_DATA;
  });`;

const newInitCode = `  // Payroll Data State với LocalStorage persistence & Auto-Clean dữ liệu ERP cũ
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
  });`;

if (code.includes(oldInitPattern)) {
  code = code.replace(oldInitPattern, newInitCode);
} else {
  console.log('Notice: could not find exact oldInitPattern, will check regex');
}

// 3. Thêm hàm handleResetToCleanERP
const resetFunction = `
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
`;

if (!code.includes('handleResetToCleanERP')) {
  code = code.replace('  // CRUD Payroll Item State', `${resetFunction}\n  // CRUD Payroll Item State`);
}

// 4. Cập nhật handleSaveEditPayroll
const oldHandleSaveStart = `  // Handle Save Edit Payroll Item
  const handleSaveEditPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayrollEmp) return;

    // 1. Bỏ phụ cấp trách nhiệm.
    // 2. Cố định phụ cấp tiền cơm (mặc định 800.000 VNĐ).
    // 3. Phụ cấp xăng theo ngày công, tối đa 500.000 VNĐ.
    // 4. Mức cam kết thu nhập (tạm ghi 10tr và có thể sửa).
    // 5. Ô tích tháng này có đóng BHXH hay không.
    // 6. Thưởng KPI tạm tính theo công thức và editable.
    const updatedEmp: EmployeePayroll = calculateHanaPayrollRecord({
      ...editingPayrollEmp,
      coDongBHXH: editingPayrollEmp.coDongBHXH !== undefined ? Boolean(editingPayrollEmp.coDongBHXH) : true,
      mucLuongCamKet: (editingPayrollEmp.mucLuongCamKet !== undefined && editingPayrollEmp.mucLuongCamKet !== null && !isNaN(Number(editingPayrollEmp.mucLuongCamKet)))
        ? Number(editingPayrollEmp.mucLuongCamKet)
        : 10000000,
      ngayCongThucTe: Number(editingPayrollEmp.ngayCongThucTe) || 0,
      soLanDiMuon: Number(editingPayrollEmp.soLanDiMuon) || 0,
      luongDongBHXH: Number(editingPayrollEmp.luongDongBHXH) || 5350000,
      phuCapCom: editingPayrollEmp.phuCapCom !== undefined ? Number(editingPayrollEmp.phuCapCom) : 800000,
      thuongKPI: (editingPayrollEmp.thuongKPI !== undefined && editingPayrollEmp.thuongKPI !== null && (editingPayrollEmp.thuongKPI as any) !== '')
        ? Number(editingPayrollEmp.thuongKPI)
        : undefined,
      hhTourKtv: Number(editingPayrollEmp.hhTourKtv) || 0,
      hhBanLe: Number(editingPayrollEmp.hhBanLe) || 0,
      hhDoanhSo: Number(editingPayrollEmp.hhDoanhSo) || 0,
      thueTNCN: Number(editingPayrollEmp.thueTNCN) || 0,
      tamUng: Number(editingPayrollEmp.tamUng) || 0,
    });`;

const newHandleSaveStart = `  // Handle Save Edit Payroll Item
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
    });`;

if (code.includes(oldHandleSaveStart)) {
  code = code.replace(oldHandleSaveStart, newHandleSaveStart);
}

// 5. Thêm Nút "Làm sạch & Chuẩn ERP" vào thanh Header Toolbar
const syncDriveBtnCode = `          {/* Nút Đồng bộ từ Google Drive */}
          <button
            onClick={handleSyncDrive}
            disabled={isSyncingDrive}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Đồng bộ dữ liệu Bảng tính lương Excel từ Google Drive"
          >
            <RefreshCw size={14} className={isSyncingDrive ? 'animate-spin' : ''} />
            <span>{isSyncingDrive ? 'Đang kéo Drive...' : 'Đồng bộ Drive'}</span>
          </button>`;

const newButtonsCode = `${syncDriveBtnCode}

          {/* Nút Làm sạch & Khôi phục chuẩn 4 KTV ERP */}
          <button
            onClick={handleResetToCleanERP}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Làm sạch dữ liệu và chỉ giữ lại 4 KTV chính thức thực tế từ ERP (xóa sạch nhân sự ảo cũ)"
          >
            <Sparkles size={14} />
            <span>Làm sạch chuẩn ERP (4 KTV)</span>
          </button>`;

if (code.includes(syncDriveBtnCode) && !code.includes('Làm sạch chuẩn ERP (4 KTV)')) {
  code = code.replace(syncDriveBtnCode, newButtonsCode);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Updated payroll view part 1 successfully');
