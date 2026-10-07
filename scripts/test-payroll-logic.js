import { calculateHanaPayrollRecord, INITIAL_PAYROLL_DATA, INITIAL_PERIOD_SUMMARIES } from '../src/data/payrollData.js';
import { INITIAL_EMPLOYEES } from '../src/data/hrData.js';

console.log('=== TEST 1: KIỂM TRA SỐ LƯỢNG NHÂN SỰ CHUẨN ERP ===');
const realEmps = INITIAL_PAYROLL_DATA['2026-10'];
console.log(`Số lượng nhân sự kỳ 2026-10: ${realEmps.length} (Kỳ vọng: 4)`);
if (realEmps.length !== 4) {
  throw new Error(`Thất bại: số lượng nhân sự là ${realEmps.length}, không phải 4!`);
}

const expectedNames = [
  'HOÀNG THỊ BUÔN MÊ',
  'PHƯƠNG THỊ LƯƠNG',
  'VŨ THỊ THANH HOA',
  'LÂM TRẦN THANH TRÀ'
];

realEmps.forEach(e => {
  console.log(`- Mã: ${e.maNV} | Tên: ${e.hoTen} | Chức vụ: ${e.chucVuLabel} | Thực lĩnh: ${e.thucLinh.toLocaleString('vi-VN')} đ`);
  if (!expectedNames.includes(e.hoTen)) {
    throw new Error(`Phát hiện nhân sự lạ/cũ chưa xóa: ${e.hoTen} (${e.maNV})`);
  }
});

console.log('\n=== TEST 2: KIỂM TRA PHỤ CẤP XĂNG XE EDITABLE (SỬA ĐƯỢC MỌI CON SỐ) ===');
// Giả lập sửa phụ cấp xăng thành 350.000đ (khác mặc định)
const testEmpCustomXang = calculateHanaPayrollRecord({
  ...realEmps[0],
  ngayCongThucTe: 10,
  phuCapXang: 350000, // Sửa tay 350k thay vì 192.308đ
});
console.log(`Phụ cấp xăng xe khi sửa tay: ${testEmpCustomXang.phuCapXang.toLocaleString('vi-VN')} đ (Kỳ vọng: 350.000 đ)`);
if (testEmpCustomXang.phuCapXang !== 350000) {
  throw new Error(`Thất bại: phuCapXang không nhận giá trị sửa tay 350.000đ!`);
}

// Giả lập sửa phụ cấp xăng về 0đ
const testEmpZeroXang = calculateHanaPayrollRecord({
  ...realEmps[0],
  ngayCongThucTe: 10,
  phuCapXang: 0,
});
console.log(`Phụ cấp xăng xe khi sửa về 0đ: ${testEmpZeroXang.phuCapXang} đ (Kỳ vọng: 0 đ)`);
if (testEmpZeroXang.phuCapXang !== 0) {
  throw new Error(`Thất bại: phuCapXang không nhận giá trị 0đ!`);
}

console.log('\n=== TEST 3: KIỂM TRA TẤT CẢ CON SỐ KHÁC EDITABLE ===');
const testAllCustom = calculateHanaPayrollRecord({
  ...realEmps[0],
  ngayCongThucTe: 15,
  phuCapCom: 1000000, // sửa cơm
  phuCapXang: 400000, // sửa xăng
  phuCapGuiXe: 300000, // sửa xe
  hhTourKtv: 500000, // sửa hoa hồng tour
  hhBanLe: 200000, // sửa bán lẻ
  hhDoanhSo: 100000, // sửa doanh số
  soLanDiMuon: 2,
  phatDiMuon: 150000, // sửa tiền phạt trực tiếp (khác 2*50k = 100k)
  mucLuongCamKet: 12000000, // sửa cam kết
  thuongKPI: 3000000, // sửa KPI tự quyết
  tamUng: 500000, // sửa tạm ứng
  thueTNCN: 50000, // sửa thuế
});

console.log(`- Phụ cấp cơm: ${testAllCustom.phuCapCom.toLocaleString('vi-VN')} đ`);
console.log(`- Phụ cấp xăng: ${testAllCustom.phuCapXang.toLocaleString('vi-VN')} đ`);
console.log(`- Phụ cấp gửi xe: ${testAllCustom.phuCapGuiXe.toLocaleString('vi-VN')} đ`);
console.log(`- Phạt đi muộn: ${testAllCustom.phatDiMuon.toLocaleString('vi-VN')} đ`);
console.log(`- Thưởng KPI tự quyết: ${testAllCustom.thuongKPI.toLocaleString('vi-VN')} đ`);
console.log(`- Tổng hoa hồng: ${testAllCustom.tongHoaHong.toLocaleString('vi-VN')} đ`);
console.log(`- Tổng thu nhập Gross: ${testAllCustom.tongThuNhap.toLocaleString('vi-VN')} đ`);
console.log(`- Thực lĩnh: ${testAllCustom.thucLinh.toLocaleString('vi-VN')} đ`);

if (testAllCustom.phuCapXang !== 400000 || testAllCustom.phatDiMuon !== 150000 || testAllCustom.thuongKPI !== 3000000) {
  throw new Error('Thất bại: Một trong các con số sửa đổi không được phản ánh chính xác!');
}

console.log('\n=== TẤT CẢ UNIT TESTS PHƯƠNG PHÁP 1 ĐẠT 100% ===');
