import { calculateHanaPayrollRecord } from '../src/data/payrollData.js';

console.log('=== TEST 1: CHỨC NĂNG TẠO BẢN GHI LƯƠNG TỪ HỒ SƠ NHÂN SỰ ===');

const mockEmployee = {
  maNV: 'NV_TEST001',
  hoTen: 'NGUYỄN VĂN TEST',
  chucVu: 'KTV',
  chucVuLabel: 'Kỹ thuật viên Trị liệu',
  capBacTen: 'KTV - Bậc 1',
  chiNhanh: 'CN_Q3',
  chiNhanhTen: 'Chi nhánh Quận 3 (Trụ sở)',
  soDienThoai: '0912345678',
  soTaiKhoan: '1234567890',
  nganHang: 'Vietcombank',
  luongDongBHXH: 5500000,
  luongThoaThuan: 5500000,
  mucLuongCamKet: 10000000,
};

const payrollRecord = calculateHanaPayrollRecord({
  ...mockEmployee,
  ngayCongChuan: 26,
  ngayCongThucTe: 26,
  soLanDiMuon: 0,
  ngayNghiPhep: 0,
  ngayNghiKhongLuong: 0,
  coDongBHXH: true,
  phuCapTrachNhiem: 0,
  phuCapCom: 800000,
  phuCapGuiXe: 200000,
  phuCapXang: 500000,
  hhTourKtv: 0,
  hhBanLe: 0,
  hhDoanhSo: 0,
  thuongKPI: 10000000 - 5500000 - 500000, // 4tr
  phatDiMuon: 0,
  tamUng: 0,
  thueTNCN: 0,
  trangThai: 'TamTinh',
});

console.log(`- Mã NV: ${payrollRecord.maNV}`);
console.log(`- Họ tên: ${payrollRecord.hoTen}`);
console.log(`- Lương thời gian: ${payrollRecord.luongThoiGian.toLocaleString('vi-VN')} đ`);
console.log(`- Phụ cấp cơm: ${payrollRecord.phuCapCom.toLocaleString('vi-VN')} đ`);
console.log(`- Phụ cấp xăng: ${payrollRecord.phuCapXang.toLocaleString('vi-VN')} đ`);
console.log(`- Thưởng KPI: ${payrollRecord.thuongKPI.toLocaleString('vi-VN')} đ`);
console.log(`- BHXH cá nhân: ${payrollRecord.bhxhCaNhan.toLocaleString('vi-VN')} đ`);
console.log(`- Thực lĩnh: ${payrollRecord.thucLinh.toLocaleString('vi-VN')} đ`);

if (payrollRecord.thucLinh !== 10222500) {
  throw new Error(`Kỳ vọng thực lĩnh 10.222.500 đ, nhưng nhận được ${payrollRecord.thucLinh}`);
}

console.log('=== TEST 1 LOGIC ENROLLMENT: PASS 100% ===');
