import type { EmployeePayroll, PayrollPeriodSummary } from '../types/payroll';

export const HANA_DATA_VERSION = '2026-10-07-v4-clean-erp';
export const DINH_MUC_CHUAN_XANG_XE = 500000; // Tối đa 500.000 VNĐ/tháng theo quy chế 06/2026/QC-LT-HNW v120
export const DINH_MUC_CHUAN_THU_NHAP_10TR = 10000000; // Gói thu nhập chuẩn 10.000.000 VNĐ nếu đủ 26 công
export const PHU_CAP_COM_CO_DINH_CHUAN = 800000; // Cố định phụ cấp tiền cơm 800.000 VNĐ/tháng

/**
 * Hàm tính toán lương CBNV Hana Wellness theo 4 nguyên tắc chuẩn hóa mới:
 * 1. Bỏ phụ cấp trách nhiệm (phuCapTrachNhiem = 0).
 * 2. Cố định phụ cấp tiền cơm (mặc định 800.000 VNĐ/tháng).
 * 3. Phụ cấp xăng theo ngày công nhưng không quá định mức chuẩn 500.000 VNĐ.
 * 4. Thưởng KPI là kết quả cuối cùng sau khi lấy tổng thu nhập 10tr (nếu đủ 26 công) trừ lương BHXH, trừ phụ cấp xăng.
 */
export function calculateHanaPayrollRecord(emp: EmployeePayroll | any): EmployeePayroll {
  const ngayCongChuan = emp.ngayCongChuan || 26;
  const ngayCongThucTe = Number(emp.ngayCongThucTe) || 0;
  const luongDongBHXH = Number(emp.luongDongBHXH) || 5350000;

  // 1. Ô Cam kết thu nhập (tạm ghi 10tr và có thể sửa)
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

  // Phụ cấp xăng theo ngày công nhưng không quá định mức chuẩn (500k) - CHO PHÉP SỬA TỰ DO
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

  // Mức cam kết thu nhập theo công thực tế (tạm tính theo mức cam kết, mặc định 10tr)
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

  // Phạt đi muộn - Mặc định 50k/lần nhưng cho phép sửa tự do số tiền
  const soLanDiMuon = Number(emp.soLanDiMuon) || 0;
  const phatDiMuon = (emp.phatDiMuon !== undefined && emp.phatDiMuon !== null && !isNaN(Number(emp.phatDiMuon)))
    ? Number(emp.phatDiMuon)
    : (soLanDiMuon * 50000);

  // Tổng thu nhập Gross
  const tongThuNhap = luongThoiGian + phuCapAnTruaXangXe + tongHoaHong + thuongKPI;

  // Khấu trừ BHXH NLĐ (10.5%) - Chỉ tính nếu tháng này CÓ ĐÓNG BHXH (coDongBHXH === true)
  const bhxhNld8 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.08) : 0;
  const bhytNld1_5 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.015) : 0;
  const bhtnNld1 = coDongBHXH ? Math.round(luongDongBhxhThucTe * 0.01) : 0;
  const bhxhCaNhan = bhxhNld8 + bhytNld1_5 + bhtnNld1;

  const thueTNCN = Number(emp.thueTNCN) || 0;
  const tamUng = Number(emp.tamUng) || 0;
  const tongKhauTru = bhxhCaNhan + thueTNCN + tamUng + phatDiMuon;
  const thucLinh = tongThuNhap - tongKhauTru;

  // BHXH Doanh nghiệp đóng thêm (21.5%) - Chỉ tính nếu CÓ ĐÓNG BHXH
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

export const PAYROLL_MONTHS: { id: string; label: string; daysInMonth: number; workingDays: number }[] = [
  {
    "id": "2026-10",
    "label": "Tháng 10/2026 (Kỳ hiện tại)",
    "daysInMonth": 31,
    "workingDays": 26
  },
  {
    "id": "2026-09",
    "label": "Tháng 09/2026",
    "daysInMonth": 30,
    "workingDays": 26
  },
  {
    "id": "2026-08",
    "label": "Tháng 08/2026",
    "daysInMonth": 31,
    "workingDays": 26
  }
];

export const INITIAL_PAYROLL_DATA: Record<string, EmployeePayroll[]> = {
  "2026-10": [
    {
      "maNV": "NV_DEMO",
      "hoTen": "HOÀNG THỊ BUÔN MÊ",
      "chucVu": "KTV",
      "chucVuLabel": "Kỹ thuật viên Spa",
      "capBac": "CB02",
      "capBacTen": "Kỹ thuật viên Spa (Bậc 2)",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0908123456",
      "soTaiKhoan": "190366882299",
      "nganHang": "Techcombank - CN Sài Gòn",
      "ngayVaoLam": "01/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 10000000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 10,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 2115385,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 192308,
      "phuCapAnTruaXangXe": 992308,
      "hhTourKtv": 0,
      "hhBanLe": 0,
      "hhDoanhSo": 0,
      "tongHoaHong": 0,
      "thuongKPI": 1538461,
      "phatDiMuon": 0,
      "tongThuNhap": 4646154,
      "luongDongBhxhThucTe": 2115385,
      "bhxhNld8": 169231,
      "bhytNld1_5": 31731,
      "bhtnNld1": 21154,
      "bhxhCaNhan": 222116,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 222116,
      "thucLinh": 4424038,
      "bhxhDoanhNghiep17": 359615,
      "bhytDoanhNghiep3": 63462,
      "bhtnDoanhNghiep1_5": 31731,
      "tongBhxhDoanhNghiep": 454808,
      "tongGiaTriDaiNgoToanDien": 5100962,
      "trangThai": "TamTinh",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_PTL102",
      "hoTen": "PHƯƠNG THỊ LƯƠNG",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Điện sinh học DDS",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN_Q3",
      "chiNhanhTen": "Chi nhánh Quận 3 (Trụ sở)",
      "soDienThoai": "0974689419",
      "soTaiKhoan": "0974689419",
      "nganHang": "MBBank - CN Quận 12",
      "ngayVaoLam": "01/10/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 26,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5500000,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 500000,
      "phuCapAnTruaXangXe": 1300000,
      "hhTourKtv": 1200000,
      "hhBanLe": 300000,
      "hhDoanhSo": 0,
      "tongHoaHong": 1500000,
      "thuongKPI": 2500000,
      "phatDiMuon": 0,
      "tongThuNhap": 10800000,
      "luongDongBhxhThucTe": 5500000,
      "bhxhNld8": 440000,
      "bhytNld1_5": 82500,
      "bhtnNld1": 55000,
      "bhxhCaNhan": 577500,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 577500,
      "thucLinh": 10222500,
      "bhxhDoanhNghiep17": 935000,
      "bhytDoanhNghiep3": 165000,
      "bhtnDoanhNghiep1_5": 82500,
      "tongBhxhDoanhNghiep": 1182500,
      "tongGiaTriDaiNgoToanDien": 11982500,
      "trangThai": "TamTinh",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_VTTH092",
      "hoTen": "VŨ THỊ THANH HOA",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Trị liệu & CSKH",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0909112334",
      "soTaiKhoan": "1029384756",
      "nganHang": "Vietcombank - CN Tân Định",
      "ngayVaoLam": "20/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 25,
      "soLanDiMuon": 1,
      "ngayNghiPhep": 1,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5288462,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 480769,
      "phuCapAnTruaXangXe": 1280769,
      "hhTourKtv": 950000,
      "hhBanLe": 200000,
      "hhDoanhSo": 0,
      "tongHoaHong": 1150000,
      "thuongKPI": 2403846,
      "phatDiMuon": 50000,
      "tongThuNhap": 10123077,
      "luongDongBhxhThucTe": 5288462,
      "bhxhNld8": 423077,
      "bhytNld1_5": 79327,
      "bhtnNld1": 52885,
      "bhxhCaNhan": 555289,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 605289,
      "thucLinh": 9517788,
      "bhxhDoanhNghiep17": 899039,
      "bhytDoanhNghiep3": 158654,
      "bhtnDoanhNghiep1_5": 79327,
      "tongBhxhDoanhNghiep": 1137020,
      "tongGiaTriDaiNgoToanDien": 11260097,
      "trangThai": "TamTinh",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_LTTT094",
      "hoTen": "LÂM TRẦN THANH TRÀ",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Trị liệu & CSKH",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0908777888",
      "soTaiKhoan": "072186005457",
      "nganHang": "Vietcombank - CN Sài Gòn",
      "ngayVaoLam": "20/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 24,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 2,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5076923,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 461538,
      "phuCapAnTruaXangXe": 1261538,
      "hhTourKtv": 800000,
      "hhBanLe": 150000,
      "hhDoanhSo": 0,
      "tongHoaHong": 950000,
      "thuongKPI": 2307692,
      "phatDiMuon": 0,
      "tongThuNhap": 9596153,
      "luongDongBhxhThucTe": 5076923,
      "bhxhNld8": 406154,
      "bhytNld1_5": 76154,
      "bhtnNld1": 50769,
      "bhxhCaNhan": 533077,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 533077,
      "thucLinh": 9063076,
      "bhxhDoanhNghiep17": 863077,
      "bhytDoanhNghiep3": 152308,
      "bhtnDoanhNghiep1_5": 76154,
      "tongBhxhDoanhNghiep": 1091539,
      "tongGiaTriDaiNgoToanDien": 10687692,
      "trangThai": "TamTinh",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    }
  ],
  "2026-09": [
    {
      "maNV": "NV_DEMO",
      "hoTen": "HOÀNG THỊ BUÔN MÊ",
      "chucVu": "KTV",
      "chucVuLabel": "Kỹ thuật viên Spa",
      "capBac": "CB02",
      "capBacTen": "Kỹ thuật viên Spa (Bậc 2)",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0908123456",
      "soTaiKhoan": "190366882299",
      "nganHang": "Techcombank - CN Sài Gòn",
      "ngayVaoLam": "01/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 10000000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 10,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 2115385,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 192308,
      "phuCapAnTruaXangXe": 992308,
      "hhTourKtv": 0,
      "hhBanLe": 0,
      "hhDoanhSo": 0,
      "tongHoaHong": 0,
      "thuongKPI": 1538461,
      "phatDiMuon": 0,
      "tongThuNhap": 4646154,
      "luongDongBhxhThucTe": 2115385,
      "bhxhNld8": 169231,
      "bhytNld1_5": 31731,
      "bhtnNld1": 21154,
      "bhxhCaNhan": 222116,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 222116,
      "thucLinh": 4424038,
      "bhxhDoanhNghiep17": 359615,
      "bhytDoanhNghiep3": 63462,
      "bhtnDoanhNghiep1_5": 31731,
      "tongBhxhDoanhNghiep": 454808,
      "tongGiaTriDaiNgoToanDien": 5100962,
      "trangThai": "ChoDuyet",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_PTL102",
      "hoTen": "PHƯƠNG THỊ LƯƠNG",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Điện sinh học DDS",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN_Q3",
      "chiNhanhTen": "Chi nhánh Quận 3 (Trụ sở)",
      "soDienThoai": "0974689419",
      "soTaiKhoan": "0974689419",
      "nganHang": "MBBank - CN Quận 12",
      "ngayVaoLam": "01/10/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 26,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5500000,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 500000,
      "phuCapAnTruaXangXe": 1300000,
      "hhTourKtv": 1200000,
      "hhBanLe": 300000,
      "hhDoanhSo": 0,
      "tongHoaHong": 1500000,
      "thuongKPI": 2500000,
      "phatDiMuon": 0,
      "tongThuNhap": 10800000,
      "luongDongBhxhThucTe": 5500000,
      "bhxhNld8": 440000,
      "bhytNld1_5": 82500,
      "bhtnNld1": 55000,
      "bhxhCaNhan": 577500,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 577500,
      "thucLinh": 10222500,
      "bhxhDoanhNghiep17": 935000,
      "bhytDoanhNghiep3": 165000,
      "bhtnDoanhNghiep1_5": 82500,
      "tongBhxhDoanhNghiep": 1182500,
      "tongGiaTriDaiNgoToanDien": 11982500,
      "trangThai": "ChoDuyet",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_VTTH092",
      "hoTen": "VŨ THỊ THANH HOA",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Trị liệu & CSKH",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0909112334",
      "soTaiKhoan": "1029384756",
      "nganHang": "Vietcombank - CN Tân Định",
      "ngayVaoLam": "20/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 25,
      "soLanDiMuon": 1,
      "ngayNghiPhep": 1,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5288462,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 480769,
      "phuCapAnTruaXangXe": 1280769,
      "hhTourKtv": 950000,
      "hhBanLe": 200000,
      "hhDoanhSo": 0,
      "tongHoaHong": 1150000,
      "thuongKPI": 2403846,
      "phatDiMuon": 50000,
      "tongThuNhap": 10123077,
      "luongDongBhxhThucTe": 5288462,
      "bhxhNld8": 423077,
      "bhytNld1_5": 79327,
      "bhtnNld1": 52885,
      "bhxhCaNhan": 555289,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 605289,
      "thucLinh": 9517788,
      "bhxhDoanhNghiep17": 899039,
      "bhytDoanhNghiep3": 158654,
      "bhtnDoanhNghiep1_5": 79327,
      "tongBhxhDoanhNghiep": 1137020,
      "tongGiaTriDaiNgoToanDien": 11260097,
      "trangThai": "ChoDuyet",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_LTTT094",
      "hoTen": "LÂM TRẦN THANH TRÀ",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Trị liệu & CSKH",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0908777888",
      "soTaiKhoan": "072186005457",
      "nganHang": "Vietcombank - CN Sài Gòn",
      "ngayVaoLam": "20/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 24,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 2,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5076923,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 461538,
      "phuCapAnTruaXangXe": 1261538,
      "hhTourKtv": 800000,
      "hhBanLe": 150000,
      "hhDoanhSo": 0,
      "tongHoaHong": 950000,
      "thuongKPI": 2307692,
      "phatDiMuon": 0,
      "tongThuNhap": 9596153,
      "luongDongBhxhThucTe": 5076923,
      "bhxhNld8": 406154,
      "bhytNld1_5": 76154,
      "bhtnNld1": 50769,
      "bhxhCaNhan": 533077,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 533077,
      "thucLinh": 9063076,
      "bhxhDoanhNghiep17": 863077,
      "bhytDoanhNghiep3": 152308,
      "bhtnDoanhNghiep1_5": 76154,
      "tongBhxhDoanhNghiep": 1091539,
      "tongGiaTriDaiNgoToanDien": 10687692,
      "trangThai": "ChoDuyet",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    }
  ],
  "2026-08": [
    {
      "maNV": "NV_DEMO",
      "hoTen": "HOÀNG THỊ BUÔN MÊ",
      "chucVu": "KTV",
      "chucVuLabel": "Kỹ thuật viên Spa",
      "capBac": "CB02",
      "capBacTen": "Kỹ thuật viên Spa (Bậc 2)",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0908123456",
      "soTaiKhoan": "190366882299",
      "nganHang": "Techcombank - CN Sài Gòn",
      "ngayVaoLam": "01/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 10000000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 10,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 2115385,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 192308,
      "phuCapAnTruaXangXe": 992308,
      "hhTourKtv": 0,
      "hhBanLe": 0,
      "hhDoanhSo": 0,
      "tongHoaHong": 0,
      "thuongKPI": 1538461,
      "phatDiMuon": 0,
      "tongThuNhap": 4646154,
      "luongDongBhxhThucTe": 2115385,
      "bhxhNld8": 169231,
      "bhytNld1_5": 31731,
      "bhtnNld1": 21154,
      "bhxhCaNhan": 222116,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 222116,
      "thucLinh": 4424038,
      "bhxhDoanhNghiep17": 359615,
      "bhytDoanhNghiep3": 63462,
      "bhtnDoanhNghiep1_5": 31731,
      "tongBhxhDoanhNghiep": 454808,
      "tongGiaTriDaiNgoToanDien": 5100962,
      "trangThai": "DaThanhToan",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_PTL102",
      "hoTen": "PHƯƠNG THỊ LƯƠNG",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Điện sinh học DDS",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN_Q3",
      "chiNhanhTen": "Chi nhánh Quận 3 (Trụ sở)",
      "soDienThoai": "0974689419",
      "soTaiKhoan": "0974689419",
      "nganHang": "MBBank - CN Quận 12",
      "ngayVaoLam": "01/10/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 26,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5500000,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 500000,
      "phuCapAnTruaXangXe": 1300000,
      "hhTourKtv": 1200000,
      "hhBanLe": 300000,
      "hhDoanhSo": 0,
      "tongHoaHong": 1500000,
      "thuongKPI": 2500000,
      "phatDiMuon": 0,
      "tongThuNhap": 10800000,
      "luongDongBhxhThucTe": 5500000,
      "bhxhNld8": 440000,
      "bhytNld1_5": 82500,
      "bhtnNld1": 55000,
      "bhxhCaNhan": 577500,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 577500,
      "thucLinh": 10222500,
      "bhxhDoanhNghiep17": 935000,
      "bhytDoanhNghiep3": 165000,
      "bhtnDoanhNghiep1_5": 82500,
      "tongBhxhDoanhNghiep": 1182500,
      "tongGiaTriDaiNgoToanDien": 11982500,
      "trangThai": "DaThanhToan",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_VTTH092",
      "hoTen": "VŨ THỊ THANH HOA",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Trị liệu & CSKH",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0909112334",
      "soTaiKhoan": "1029384756",
      "nganHang": "Vietcombank - CN Tân Định",
      "ngayVaoLam": "20/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 25,
      "soLanDiMuon": 1,
      "ngayNghiPhep": 1,
      "ngayNghiKhongLuong": 0,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5288462,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 480769,
      "phuCapAnTruaXangXe": 1280769,
      "hhTourKtv": 950000,
      "hhBanLe": 200000,
      "hhDoanhSo": 0,
      "tongHoaHong": 1150000,
      "thuongKPI": 2403846,
      "phatDiMuon": 50000,
      "tongThuNhap": 10123077,
      "luongDongBhxhThucTe": 5288462,
      "bhxhNld8": 423077,
      "bhytNld1_5": 79327,
      "bhtnNld1": 52885,
      "bhxhCaNhan": 555289,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 605289,
      "thucLinh": 9517788,
      "bhxhDoanhNghiep17": 899039,
      "bhytDoanhNghiep3": 158654,
      "bhtnDoanhNghiep1_5": 79327,
      "tongBhxhDoanhNghiep": 1137020,
      "tongGiaTriDaiNgoToanDien": 11260097,
      "trangThai": "DaThanhToan",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    },
    {
      "maNV": "NV_LTTT094",
      "hoTen": "LÂM TRẦN THANH TRÀ",
      "chucVu": "KTV",
      "chucVuLabel": "KTV Trị liệu & CSKH",
      "capBac": "CB01",
      "capBacTen": "Kỹ thuật viên Spa & Trị liệu - Bậc 1",
      "chiNhanh": "CN1",
      "chiNhanhTen": "Chi nhánh 1 — Quận 1",
      "soDienThoai": "0908777888",
      "soTaiKhoan": "072186005457",
      "nganHang": "Vietcombank - CN Sài Gòn",
      "ngayVaoLam": "20/09/2026",
      "soNguoiPhuThuoc": 0,
      "hinhThucLuong": "LCBHoaHong",
      "mucLuongCamKet": 8500000,
      "trangThaiLamViec": "Chính thức",
      "cheDoNghi": "3 - 4 ngày/tháng (Hưởng nguyên lương)",
      "ngayCongChuan": 26,
      "ngayCongThucTe": 24,
      "soLanDiMuon": 0,
      "ngayNghiPhep": 0,
      "ngayNghiKhongLuong": 2,
      "luongDongBHXH": 5500000,
      "coDongBHXH": true,
      "phuCapTrachNhiem": 0,
      "luongThoaThuan": 5500000,
      "luongThoiGian": 5076923,
      "phuCapCom": 800000,
      "phuCapGuiXe": 200000,
      "phuCapXang": 461538,
      "phuCapAnTruaXangXe": 1261538,
      "hhTourKtv": 800000,
      "hhBanLe": 150000,
      "hhDoanhSo": 0,
      "tongHoaHong": 950000,
      "thuongKPI": 2307692,
      "phatDiMuon": 0,
      "tongThuNhap": 9596153,
      "luongDongBhxhThucTe": 5076923,
      "bhxhNld8": 406154,
      "bhytNld1_5": 76154,
      "bhtnNld1": 50769,
      "bhxhCaNhan": 533077,
      "thueTNCN": 0,
      "tamUng": 0,
      "tongKhauTru": 533077,
      "thucLinh": 9063076,
      "bhxhDoanhNghiep17": 863077,
      "bhytDoanhNghiep3": 152308,
      "bhtnDoanhNghiep1_5": 76154,
      "tongBhxhDoanhNghiep": 1091539,
      "tongGiaTriDaiNgoToanDien": 10687692,
      "trangThai": "DaThanhToan",
      "chiTietHoaHong": [],
      "chiTietChamCong": []
    }
  ]
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
    tongNhanSu: 4,
    tongQuyLuong: 35165384,
    tongHoaHong: 3600000,
    tongBHXH: 1887982,
    tongThueTNCN: 0,
    thuNhapBinhQuan: 8791346,
    isLocked: false,
  },
  '2026-09': {
    thang: '2026-09',
    thangDisplay: 'Tháng 09/2026',
    tongNhanSu: 4,
    tongQuyLuong: 35165384,
    tongHoaHong: 3600000,
    tongBHXH: 1887982,
    tongThueTNCN: 0,
    thuNhapBinhQuan: 8791346,
    isLocked: true,
    ngayKhoaSo: '05/10/2026 18:00',
    nguoiKhoaSo: 'Kế toán trưởng (U004)',
  },
};

export const getEnrichedEmployee = (emp: EmployeePayroll): EmployeePayroll => {
  return calculateHanaPayrollRecord(emp);
};
