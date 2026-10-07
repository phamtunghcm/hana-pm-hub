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
  coDongBHXH?: boolean; // Tháng này có tham gia đóng BHXH và các quỹ bảo hiểm hay không (mặc định true)
  luongDongBHXH: number; // Mức lương đóng BHXH theo ngạch bậc (vd: 5.500.000 VNĐ hoặc 5.350.000 VNĐ)
  phuCapTrachNhiem?: number; // Đã bỏ phụ cấp trách nhiệm (mặc định 0)
  luongThoaThuan: number; // Mức lương cơ sở / thỏa thuận
  luongThoiGian: number; // Lương thời gian: luongDongBHXH / ngayCongChuan * ngayCongThucTe
  mucLuongCamKet?: number; // Mức tổng thu nhập cam kết (mặc định 10.000.000 VNĐ, có thể sửa)
  trangThaiLamViec?: string; // "Chính thức" | "Thử việc"
  cheDoNghi?: string; // "3 - 4 ngày/tháng (Hưởng nguyên lương)"

  // Đãi ngộ Cơm & Xăng xe & Gửi xe theo quy chế mới
  phuCapCom: number; // Cố định phụ cấp tiền cơm (mặc định 800.000 VNĐ/tháng)
  phuCapXang: number; // Phụ cấp xăng theo ngày công, tối đa định mức chuẩn 500.000 VNĐ/tháng
  phuCapGuiXe?: number; // Tiền gửi xe cố định hàng tháng (200.000đ)
  phuCapAnTruaXangXe: number; // Tổng phụ cấp cơm + xăng xe (+ gửi xe nếu có)

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

  // Khấu trừ Bảo hiểm NLĐ (10.5%)
  luongDongBhxhThucTe?: number; // Căn cứ đóng BHXH thực tế = luongDongBHXH / 26 * ngayCongThucTe
  bhxhNld8?: number; // 8.0%
  bhytNld1_5?: number; // 1.5%
  bhtnNld1?: number; // 1.0%
  bhxhCaNhan: number; // 10.5% * luongDongBhxhThucTe

  thueTNCN: number;
  tamUng: number;
  tongKhauTru: number;

  // Quyền lợi BHXH Công ty đóng thêm (21.5%) theo mẫu Google Sheet
  bhxhDoanhNghiep17?: number; // Quỹ hưu trí, thai sản (17%)
  bhytDoanhNghiep3?: number; // Quỹ BHYT (3%)
  bhtnDoanhNghiep1_5?: number; // Quỹ BHTN + TNLĐ (1.5%)
  tongBhxhDoanhNghiep?: number; // 21.5%
  tongGiaTriDaiNgoToanDien?: number; // Tổng giá trị đãi ngộ toàn diện = Tổng thu nhập + BHXH công ty đóng thêm

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
