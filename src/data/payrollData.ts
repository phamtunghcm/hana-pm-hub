import type { EmployeePayroll, PayrollPeriodSummary } from '../types/payroll';

export const HANA_DATA_VERSION = '2026-10-09-v5-official';
export const DINH_MUC_CHUAN_XANG_XE = 500000; // Tối đa 500.000 VNĐ/tháng theo quy chế 06/2026/QC-LT-HNW
export const DINH_MUC_CHUAN_THU_NHAP_10TR = 10000000; // Gói thu nhập chuẩn 10.000.000 VNĐ nếu đủ 26 công
export const PHU_CAP_COM_CO_DINH_CHUAN = 800000; // Cố định phụ cấp tiền cơm 800.000 VNĐ/tháng

/**
 * Hàm tính toán lương CBNV Hana Wellness theo 4 nguyên tắc chuẩn hóa mới:
 * 1. Bỏ phụ cấp trách nhiệm (phuCapTrachNhiem = 0).
 * 2. Cố định phụ cấp tiền cơm (mặc định 800.000 VNĐ/tháng).
 * 3. Phụ cấp xăng theo ngày công nhưng không quá định mức chuẩn 500.000 VNĐ.
 * 4. Thưởng KPI là kết quả cuối cùng sau khi lấy tổng thu nhập 10tr (nếu đủ 26 công) trừ lương BHXH, trừ phụ cấp xăng.
 * *Đặc biệt: Trường hợp Học viên học việc không thu phí & không thù lao (HocViecKhongThuLao): tất cả các khoản lương, phụ cấp, BHXH đều = 0.
 */
export function calculateHanaPayrollRecord(emp: EmployeePayroll | any): EmployeePayroll {
  const isHocViec = emp.hinhThucLuong === 'HocViecKhongThuLao' || emp.trangThaiLamViec === 'Học việc' || emp.mucLuongCamKet === 0;

  if (isHocViec) {
    return {
      ...emp,
      coDongBHXH: false,
      luongDongBHXH: 0,
      mucLuongCamKet: 0,
      phuCapTrachNhiem: 0,
      luongThoaThuan: 0,
      luongThoiGian: 0,
      phuCapCom: 0,
      phuCapXang: 0,
      phuCapGuiXe: 0,
      phuCapAnTruaXangXe: 0,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: 0,
      phatDiMuon: 0,
      tongThuNhap: 0,
      luongDongBhxhThucTe: 0,
      bhxhNld8: 0,
      bhytNld1_5: 0,
      bhtnNld1: 0,
      bhxhCaNhan: 0,
      thueTNCN: 0,
      tamUng: 0,
      tongKhauTru: 0,
      thucLinh: 0,
      bhxhDoanhNghiep17: 0,
      bhytDoanhNghiep3: 0,
      bhtnDoanhNghiep1_5: 0,
      tongBhxhDoanhNghiep: 0,
      tongGiaTriDaiNgoToanDien: 0,
    };
  }

  const ngayCongChuan = emp.ngayCongChuan || 26;
  const ngayCongThucTe = Number(emp.ngayCongThucTe) || 0;
  const luongDongBHXH = (emp.luongDongBHXH !== undefined && emp.luongDongBHXH !== null && !isNaN(Number(emp.luongDongBHXH)))
    ? Number(emp.luongDongBHXH)
    : 5500000;

  // 1. Ô Cam kết thu nhập (mặc định 10tr và có thể sửa)
  const mucLuongCamKet = (emp.mucLuongCamKet !== undefined && emp.mucLuongCamKet !== null && !isNaN(Number(emp.mucLuongCamKet)))
    ? Number(emp.mucLuongCamKet)
    : DINH_MUC_CHUAN_THU_NHAP_10TR;

  // 2. Ô tích tháng này có tham gia đóng BHXH và các quỹ bảo hiểm hay không (mặc định true)
  const coDongBHXH = emp.coDongBHXH !== undefined ? Boolean(emp.coDongBHXH) : true;

  // Bỏ phụ cấp trách nhiệm
  const phuCapTrachNhiem = 0;
  const luongThoaThuan = luongDongBHXH;

  // Cố định phụ cấp tiền cơm
  const phuCapCom = emp.phuCapCom !== undefined ? Number(emp.phuCapCom) : PHU_CAP_COM_CO_DINH_CHUAN;

  // Phụ cấp xăng theo ngày công nhưng không quá định mức chuẩn (500k)
  const phuCapXangMacDinh = Math.min(
    DINH_MUC_CHUAN_XANG_XE,
    Math.round((DINH_MUC_CHUAN_XANG_XE / ngayCongChuan) * ngayCongThucTe)
  );
  const phuCapXang = (emp.phuCapXang !== undefined && emp.phuCapXang !== null && !isNaN(Number(emp.phuCapXang)) && (emp.phuCapXang as any) !== '')
    ? Number(emp.phuCapXang)
    : phuCapXangMacDinh;

  const phuCapGuiXe = (emp.phuCapGuiXe !== undefined && emp.phuCapGuiXe !== null && !isNaN(Number(emp.phuCapGuiXe)))
    ? Number(emp.phuCapGuiXe)
    : 200000;
  const phuCapAnTruaXangXe = phuCapCom + phuCapXang;

  // Lương thời gian căn bản theo ngày công thực tế
  const luongThoiGian = Math.round((luongDongBHXH / ngayCongChuan) * ngayCongThucTe);
  const luongDongBhxhThucTe = coDongBHXH ? luongThoiGian : 0;

  // Mức cam kết thu nhập theo công thực tế
  const camKetTheoCong = (ngayCongThucTe >= ngayCongChuan)
    ? mucLuongCamKet
    : Math.round((mucLuongCamKet / ngayCongChuan) * ngayCongThucTe);

  // 3. Thưởng KPI tạm tính theo công thức: Cam kết theo công - Lương thời gian căn bản - Phụ cấp xăng xe
  const kpiTamTinh = Math.max(0, camKetTheoCong - luongThoiGian - phuCapXang);

  // Thưởng KPI có thể chỉnh sửa tự do (editable)
  const thuongKPI = (emp.thuongKPI !== undefined && emp.thuongKPI !== null && !isNaN(Number(emp.thuongKPI)) && (emp.thuongKPI as any) !== '')
    ? Math.max(0, Number(emp.thuongKPI))
    : kpiTamTinh;

  // Hoa hồng
  const hhTourKtv = Number(emp.hhTourKtv) || 0;
  const hhBanLe = Number(emp.hhBanLe) || 0;
  const hhDoanhSo = Number(emp.hhDoanhSo) || 0;
  const tongHoaHong = hhTourKtv + hhBanLe + hhDoanhSo;

  // Phạt đi muộn
  const soLanDiMuon = Number(emp.soLanDiMuon) || 0;
  const phatDiMuon = (emp.phatDiMuon !== undefined && emp.phatDiMuon !== null && !isNaN(Number(emp.phatDiMuon)))
    ? Number(emp.phatDiMuon)
    : (soLanDiMuon * 50000);

  // Tổng thu nhập Gross
  const tongThuNhap = luongThoiGian + phuCapAnTruaXangXe + tongHoaHong + thuongKPI;

  // Khấu trừ BHXH NLĐ (10.5%) - Chỉ tính nếu tháng này CÓ ĐÓNG BHXH
  const bhxhNld8 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.08) : 0;
  const bhytNld1_5 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.015) : 0;
  const bhtnNld1 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.01) : 0;
  const bhxhCaNhan = bhxhNld8 + bhytNld1_5 + bhtnNld1;

  const thueTNCN = Number(emp.thueTNCN) || 0;
  const tamUng = Number(emp.tamUng) || 0;
  const tongKhauTru = bhxhCaNhan + thueTNCN + tamUng + phatDiMuon;
  const thucLinh = tongThuNhap - tongKhauTru;

  // BHXH Doanh nghiệp đóng thêm (21.5%)
  const bhxhDoanhNghiep17 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.17) : 0;
  const bhytDoanhNghiep3 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.03) : 0;
  const bhtnDoanhNghiep1_5 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.015) : 0;
  const tongBhxhDoanhNghiep = bhxhDoanhNghiep17 + bhytDoanhNghiep3 + bhtnDoanhNghiep1_5;
  const tongGiaTriDaiNgoToanDien = tongThuNhap + tongBhxhDoanhNghiep;

  return {
    ...emp,
    coDongBHXH,
    mucLuongCamKet,
    phuCapTrachNhiem,
    luongThoaThuan,
    luongThoiGian,
    phuCapCom,
    phuCapXang,
    phuCapGuiXe,
    phuCapAnTruaXangXe,
    thuongKPI,
    phatDiMuon,
    tongThuNhap,
    luongDongBhxhThucTe,
    bhxhNld8,
    bhytNld1_5,
    bhtnNld1,
    bhxhCaNhan,
    thueTNCN,
    tamUng,
    tongKhauTru,
    thucLinh,
    bhxhDoanhNghiep17,
    bhytDoanhNghiep3,
    bhtnDoanhNghiep1_5,
    tongBhxhDoanhNghiep,
    tongGiaTriDaiNgoToanDien,
  };
}

export const PAYROLL_MONTHS = [
  {
    id: '2026-10',
    label: 'Tháng 10/2026 (Kỳ hiện tại)',
    daysInMonth: 31,
    workingDays: 26,
  },
  {
    id: '2026-09',
    label: 'Tháng 09/2026',
    daysInMonth: 30,
    workingDays: 26,
  },
  {
    id: '2026-08',
    label: 'Tháng 08/2026',
    daysInMonth: 31,
    workingDays: 26,
  },
];

export const INITIAL_PAYROLL_DATA: Record<string, EmployeePayroll[]> = {
  '2026-10': [
    {
      maNV: 'HNW-KTV-083',
      hoTen: 'HOÀNG THỊ BUÔN MÊ',
      chucVu: 'KTV',
      chucVuLabel: 'Nhân viên CSKH & KTV Trị liệu',
      capBac: 'CB01',
      capBacTen: 'Kỹ thuật viên Spa & Trị liệu - Bậc 1',
      chiNhanh: 'CN_Q3',
      chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
      soDienThoai: '',
      soTaiKhoan: '',
      nganHang: '',
      ngayVaoLam: '20/09/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: 'LCBHoaHong',
      mucLuongCamKet: 10000000,
      trangThaiLamViec: 'Chính thức',
      cheDoNghi: '4 ngày/tháng (Hưởng nguyên lương)',
      ngayCongChuan: 26,
      ngayCongThucTe: 26,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: 5500000,
      coDongBHXH: true,
      phuCapTrachNhiem: 0,
      luongThoaThuan: 5500000,
      luongThoiGian: 5500000,
      phuCapCom: 800000,
      phuCapGuiXe: 200000,
      phuCapXang: 500000,
      phuCapAnTruaXangXe: 1300000,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: 4000000,
      phatDiMuon: 0,
      tongThuNhap: 10800000,
      luongDongBhxhThucTe: 5500000,
      bhxhNld8: 440000,
      bhytNld1_5: 82500,
      bhtnNld1: 55000,
      bhxhCaNhan: 577500,
      thueTNCN: 0,
      tamUng: 0,
      tongKhauTru: 577500,
      thucLinh: 10222500,
      bhxhDoanhNghiep17: 935000,
      bhytDoanhNghiep3: 165000,
      bhtnDoanhNghiep1_5: 82500,
      tongBhxhDoanhNghiep: 1182500,
      tongGiaTriDaiNgoToanDien: 11982500,
      trangThai: 'TamTinh',
      chiTietHoaHong: [],
      chiTietChamCong: [],
    },
    {
      maNV: 'HNW-KTV-092',
      hoTen: 'VŨ THỊ THANH HOA',
      chucVu: 'KTV',
      chucVuLabel: 'Nhân viên CSKH & KTV Trị liệu',
      capBac: 'CB01',
      capBacTen: 'Kỹ thuật viên Spa & Trị liệu - Bậc 1',
      chiNhanh: 'CN_Q3',
      chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
      soDienThoai: '',
      soTaiKhoan: '',
      nganHang: '',
      ngayVaoLam: '20/09/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: 'LCBHoaHong',
      mucLuongCamKet: 10000000,
      trangThaiLamViec: 'Chính thức',
      cheDoNghi: '4 ngày/tháng (Hưởng nguyên lương)',
      ngayCongChuan: 26,
      ngayCongThucTe: 26,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: 5500000,
      coDongBHXH: true,
      phuCapTrachNhiem: 0,
      luongThoaThuan: 5500000,
      luongThoiGian: 5500000,
      phuCapCom: 800000,
      phuCapGuiXe: 200000,
      phuCapXang: 500000,
      phuCapAnTruaXangXe: 1300000,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: 4000000,
      phatDiMuon: 0,
      tongThuNhap: 10800000,
      luongDongBhxhThucTe: 5500000,
      bhxhNld8: 440000,
      bhytNld1_5: 82500,
      bhtnNld1: 55000,
      bhxhCaNhan: 577500,
      thueTNCN: 0,
      tamUng: 0,
      tongKhauTru: 577500,
      thucLinh: 10222500,
      bhxhDoanhNghiep17: 935000,
      bhytDoanhNghiep3: 165000,
      bhtnDoanhNghiep1_5: 82500,
      tongBhxhDoanhNghiep: 1182500,
      tongGiaTriDaiNgoToanDien: 11982500,
      trangThai: 'TamTinh',
      chiTietHoaHong: [],
      chiTietChamCong: [],
    },
    {
      maNV: 'HNW-KTV-102',
      hoTen: 'PHƯƠNG THỊ LƯƠNG',
      chucVu: 'KTV',
      chucVuLabel: 'Học viên KTV Điện sinh học DDS',
      capBac: 'CB00',
      capBacTen: 'Học viên thực hành (Không thu học phí, không thù lao)',
      chiNhanh: 'CN_Q3',
      chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
      soDienThoai: '0974.689.419',
      soTaiKhoan: '',
      nganHang: '',
      ngayVaoLam: '05/10/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: 'HocViecKhongThuLao',
      mucLuongCamKet: 0,
      trangThaiLamViec: 'Học việc',
      cheDoNghi: 'Theo lịch đào tạo cơ sở',
      ngayCongChuan: 26,
      ngayCongThucTe: 26,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: 0,
      coDongBHXH: false,
      phuCapTrachNhiem: 0,
      luongThoaThuan: 0,
      luongThoiGian: 0,
      phuCapCom: 0,
      phuCapGuiXe: 0,
      phuCapXang: 0,
      phuCapAnTruaXangXe: 0,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: 0,
      phatDiMuon: 0,
      tongThuNhap: 0,
      luongDongBhxhThucTe: 0,
      bhxhNld8: 0,
      bhytNld1_5: 0,
      bhtnNld1: 0,
      bhxhCaNhan: 0,
      thueTNCN: 0,
      tamUng: 0,
      tongKhauTru: 0,
      thucLinh: 0,
      bhxhDoanhNghiep17: 0,
      bhytDoanhNghiep3: 0,
      bhtnDoanhNghiep1_5: 0,
      tongBhxhDoanhNghiep: 0,
      tongGiaTriDaiNgoToanDien: 0,
      trangThai: 'TamTinh',
      chiTietHoaHong: [],
      chiTietChamCong: [],
    },
  ],
  '2026-09': [
    {
      maNV: 'HNW-KTV-083',
      hoTen: 'HOÀNG THỊ BUÔN MÊ',
      chucVu: 'KTV',
      chucVuLabel: 'Nhân viên CSKH & KTV Trị liệu',
      capBac: 'CB01',
      capBacTen: 'Kỹ thuật viên Spa & Trị liệu - Bậc 1',
      chiNhanh: 'CN_Q3',
      chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
      soDienThoai: '',
      soTaiKhoan: '',
      nganHang: '',
      ngayVaoLam: '20/09/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: 'LCBHoaHong',
      mucLuongCamKet: 10000000,
      trangThaiLamViec: 'Chính thức',
      cheDoNghi: '4 ngày/tháng (Hưởng nguyên lương)',
      ngayCongChuan: 26,
      ngayCongThucTe: 9,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: 5500000,
      coDongBHXH: true,
      phuCapTrachNhiem: 0,
      luongThoaThuan: 5500000,
      luongThoiGian: 1903846,
      phuCapCom: 800000,
      phuCapGuiXe: 200000,
      phuCapXang: 173077,
      phuCapAnTruaXangXe: 973077,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: 1384615,
      phatDiMuon: 0,
      tongThuNhap: 4261538,
      luongDongBhxhThucTe: 1903846,
      bhxhNld8: 152308,
      bhytNld1_5: 28558,
      bhtnNld1: 19038,
      bhxhCaNhan: 199904,
      thueTNCN: 0,
      tamUng: 0,
      tongKhauTru: 199904,
      thucLinh: 4061634,
      bhxhDoanhNghiep17: 323654,
      bhytDoanhNghiep3: 57115,
      bhtnDoanhNghiep1_5: 28558,
      tongBhxhDoanhNghiep: 409327,
      tongGiaTriDaiNgoToanDien: 4670865,
      trangThai: 'DaThanhToan',
      chiTietHoaHong: [],
      chiTietChamCong: [],
    },
    {
      maNV: 'HNW-KTV-092',
      hoTen: 'VŨ THỊ THANH HOA',
      chucVu: 'KTV',
      chucVuLabel: 'Nhân viên CSKH & KTV Trị liệu',
      capBac: 'CB01',
      capBacTen: 'Kỹ thuật viên Spa & Trị liệu - Bậc 1',
      chiNhanh: 'CN_Q3',
      chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
      soDienThoai: '',
      soTaiKhoan: '',
      nganHang: '',
      ngayVaoLam: '20/09/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: 'LCBHoaHong',
      mucLuongCamKet: 10000000,
      trangThaiLamViec: 'Chính thức',
      cheDoNghi: '4 ngày/tháng (Hưởng nguyên lương)',
      ngayCongChuan: 26,
      ngayCongThucTe: 9,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: 5500000,
      coDongBHXH: true,
      phuCapTrachNhiem: 0,
      luongThoaThuan: 5500000,
      luongThoiGian: 1903846,
      phuCapCom: 800000,
      phuCapGuiXe: 200000,
      phuCapXang: 173077,
      phuCapAnTruaXangXe: 973077,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: 1384615,
      phatDiMuon: 0,
      tongThuNhap: 4261538,
      luongDongBhxhThucTe: 1903846,
      bhxhNld8: 152308,
      bhytNld1_5: 28558,
      bhtnNld1: 19038,
      bhxhCaNhan: 199904,
      thueTNCN: 0,
      tamUng: 0,
      tongKhauTru: 199904,
      thucLinh: 4061634,
      bhxhDoanhNghiep17: 323654,
      bhytDoanhNghiep3: 57115,
      bhtnDoanhNghiep1_5: 28558,
      tongBhxhDoanhNghiep: 409327,
      tongGiaTriDaiNgoToanDien: 4670865,
      trangThai: 'DaThanhToan',
      chiTietHoaHong: [],
      chiTietChamCong: [],
    },
  ],
  '2026-08': [],
};

export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const numberToWordsVietnamese = (num: number): string => {
  if (num === 0) return 'Không đồng chẵn.';
  const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readGroup(n: number): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || n >= 100) {
      res += units[hundred] + ' trăm ';
      if (ten === 0 && unit > 0) res += 'lẻ ';
    }
    if (ten === 1) {
      res += 'mười ';
    } else if (ten > 1) {
      res += units[ten] + ' mươi ';
    }
    if (ten > 0 && unit === 1 && ten !== 1) {
      res += 'mốt ';
    } else if (ten > 0 && unit === 5) {
      res += 'lăm ';
    } else if (unit > 0) {
      res += units[unit] + ' ';
    }
    return res;
  }

  let words = '';
  let scaleIndex = 0;
  let remaining = Math.abs(Math.round(num));

  while (remaining > 0) {
    const group = remaining % 1000;
    if (group > 0) {
      const groupStr = readGroup(group);
      words = groupStr + scales[scaleIndex] + ' ' + words;
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  words = words.trim() + ' đồng chẵn.';
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const numberToVietnameseWords = numberToWordsVietnamese;

export const INITIAL_PERIOD_SUMMARIES: Record<string, PayrollPeriodSummary> = {
  '2026-10': {
    thang: '2026-10',
    thangDisplay: 'Tháng 10/2026',
    tongNhanSu: 3,
    tongQuyLuong: 20445000,
    tongHoaHong: 0,
    tongBHXH: 1155000,
    tongThueTNCN: 0,
    thuNhapBinhQuan: 6815000,
    isLocked: false,
  },
  '2026-09': {
    thang: '2026-09',
    thangDisplay: 'Tháng 09/2026',
    tongNhanSu: 2,
    tongQuyLuong: 8123268,
    tongHoaHong: 0,
    tongBHXH: 399808,
    tongThueTNCN: 0,
    thuNhapBinhQuan: 4061634,
    isLocked: true,
    ngayKhoaSo: '05/10/2026 18:00',
    nguoiKhoaSo: 'Kế toán trưởng (U004)',
  },
};

export const getEnrichedEmployee = (emp: EmployeePayroll): EmployeePayroll => {
  return calculateHanaPayrollRecord(emp);
};
