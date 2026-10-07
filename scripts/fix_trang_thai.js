import fs from 'fs';

const payrollFilePath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/data/payrollData.ts';
let content = fs.readFileSync(payrollFilePath, 'utf8');

// Thay thế tất cả "DaDuyet" thành "ChoDuyet", "DaChiTra" thành "DaThanhToan"
content = content.replaceAll('"DaDuyet"', '"ChoDuyet"').replaceAll('"DaChiTra"', '"DaThanhToan"');

fs.writeFileSync(payrollFilePath, content, 'utf8');
console.log('Fixed trangThai in payrollData.ts');
