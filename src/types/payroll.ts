export interface CommissionDetailItem {
  id: string;
  ngay: string;
  maLichHen?: string;
  maHoaDon?: string;
  tenKhachHang: string;
  tenDichVu_SanPham: string;
  vaiTro: 'KTVChinh' | 'KTVPhu' | 'BanLe' | 'Sale';
  vaiTroLabel: string;
  doanhSo: number;
  tyLe: number;
  tienCoDinh: number;
  soTienHoaHong: number;
}

export interface AttendanceRecord {
  ngay: string;
  gioVao: string;
  gioRa: string;
  soGioLam: number;
  isLate: boolean;
  ghiChu?: string;
}

export interface EmployeePayroll {
  maNV: string;
  hoTen: string;
  chucVu: 'KTV' | 'CSKH' | 'Sale' | 'LeTan' | 'BacSi' | 'QuanLy' | 'BaoVe' | 'TapVu';
  chucVuLabel: string;
  capBac?: string;
  capBacTen?: string;
  chiNhanh: string;
  chiNhanhTen: string;
  soDienThoai: string;
  soTaiKhoan: string;
  nganHang: string;
  ngayVaoLam: string;
  soNguoiPhuThuoc: number;
  hinhThucLuong: 'LCBHoaHong' | 'CoDinh';

  // Chấm công
  ngayCongChuan: number;
  ngayCongThucTe: number;
  soLanDiMuon: number;
  ngayNghiPhep: number;
  ngayNghiKhongLuong: number;

  // Thu nhập cố định & thời gian
  luongDongBHXH: number; // Cố định 5.350.000 VNĐ theo QĐ 30/08/2026
  phuCapTrachNhiem: number; // Phần chênh lệch lương thỏa thuận cũ - 5.350.000đ
  luongThoaThuan: number; // luongDongBHXH + phuCapTrachNhiem
  luongThoiGian: number; // (luongDongBHXH + phuCapTrachNhiem) / 26 * ngayCongThucTe
  phuCapAnTruaXangXe: number; // Phụ cấp ăn trưa, xăng xe, điện thoại

  // Hoa hồng
  hhTourKtv: number; // Hoa hồng đi tour (KTV Chính + Phụ)
  hhBanLe: number; // Hoa hồng bán lẻ mỹ phẩm / thảo dược
  hhDoanhSo: number; // Hoa hồng tư vấn / bán gói thẻ
  tongHoaHong: number; // hhTourKtv + hhBanLe + hhDoanhSo

  // Thưởng & Phạt
  thuongKPI: number;
  phatDiMuon: number; // soLanDiMuon * 50.000đ

  // Tổng thu nhập trước thuế & khấu trừ
  tongThuNhap: number;

  // Khấu trừ
  bhxhCaNhan: number; // 10.5% * 5.350.000 = 561.750 VNĐ
  thueTNCN: number;
  tamUng: number;
  tongKhauTru: number;

  // Thực lĩnh
  thucLinh: number;
  trangThai: 'DaThanhToan' | 'TamTinh' | 'ChoDuyet';

  // Chi tiết phục vụ Payslip
  chiTietHoaHong: CommissionDetailItem[];
  chiTietChamCong: AttendanceRecord[];
}

export interface PayrollPeriodSummary {
  thang: string; // VD: "2026-10"
  thangDisplay: string; // VD: "Tháng 10/2026"
  tongNhanSu: number;
  tongQuyLuong: number;
  tongHoaHong: number;
  tongBHXH: number;
  tongThueTNCN: number;
  thuNhapBinhQuan: number;
  isLocked: boolean;
  ngayKhoaSo?: string;
  nguoiKhoaSo?: string;
}
