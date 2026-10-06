export interface EmployeeProfile {
  maNV: string;
  hoTen: string;
  chucVu: 'KTV' | 'CSKH' | 'Sale' | 'LeTan' | 'BacSi' | 'QuanLy' | 'BaoVe' | 'TapVu' | 'KeToan' | 'Marketing';
  chucVuLabel: string;
  ngach: 'KTV' | 'LT' | 'KT' | 'NS' | 'MKT' | 'SM' | 'GM' | 'BV' | 'LC';
  bac: 1 | 2 | 3;
  capBacTen: string;
  chiNhanh: string;
  chiNhanhTen: string;
  soDienThoai: string;
  email: string;
  ngaySinh: string;
  gioiTinh: 'Nam' | 'Nữ';
  soCCCD: string;
  ngayCapCCCD: string;
  noiCapCCCD: string;
  queQuan: string;
  diaChiThuongTru: string;
  choOHienNay: string;
  trinhDoChuyenMon: string;
  chungChiNghe: string;
  ngayVaoLam: string;
  loaiHopDong: string;
  soHopDong: string;
  luongThoaThuan: number;
  luongDongBHXH: number;
  mucLuongCamKet?: number;
  hinhThucLuong: 'LCBHoaHong' | 'CoDinh';
  trangThaiLamViec: 'Chính thức' | 'Thử việc' | 'Đã nghỉ việc';
  soTaiKhoan: string;
  nganHang: string;
  driveFolderUrl?: string;
  hoSoGiayTo: {
    hopDongLaoDong: boolean;
    banMoTaCongViecJD: boolean;
    phieuThongTinNhanSu: boolean;
    banCamKetThue08: boolean;
    banCamKetPDP: boolean;
    thoaThuanBaoMatNDA: boolean;
    giayKhamSucKhoe: boolean;
  };
  nguoiLienHeKhanCap?: {
    hoTen: string;
    quanHe: string;
    soDienThoai: string;
    diaChi: string;
  };
}

export interface LeaveRequest {
  id: string;
  maNV: string;
  hoTen: string;
  chucVuLabel: string;
  chiNhanhTen: string;
  loaiNghi: 'PhepNam' | 'ViecRieng' | 'NghiOm' | 'KhongLuong' | 'DoiCa';
  loaiNghiLabel: string;
  tuNgay: string;
  denNgay: string;
  soNgayNghi: number;
  lyDo: string;
  nguoiBanGiao: string;
  ngayTao: string;
  trangThai: 'ChoDuyet' | 'DaDuyet' | 'TuChoi';
  nguoiDuyet?: string;
  ngayDuyet?: string;
  ghiChuDuyet?: string;
}

export interface AttendanceMatrixRecord {
  maNV: string;
  hoTen: string;
  chucVuLabel: string;
  chiNhanhTen: string;
  // Bảng ngày: 1 -> 31: 'V' (Đủ công), '1/2' (Nửa công), 'P' (Phép), 'O' (Ốm), 'KL' (Không lương), 'M' (Muộn), 'OFF' (Nghỉ tuần)
  chamCongTheoNgay: Record<number, 'V' | '1/2' | 'P' | 'O' | 'KL' | 'M' | 'OFF'>;
  ngayCongChuan: number;
  ngayCongThucTe: number;
  ngayNghiPhep: number;
  ngayNghiKhongLuong: number;
  soLanDiMuon: number;
}

export interface SalaryRegulationScale {
  chucDanh: string;
  ngach: string;
  bac1: number;
  bac2: number;
  bac3: number;
  moTa: string;
  phuCapCom: string;
  phuCapXangXe: string;
  hoaHong: string;
  thuongKPI: string;
}
