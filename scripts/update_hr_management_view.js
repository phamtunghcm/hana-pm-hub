import fs from 'fs';

const filePath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/components/HRManagementView.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Thêm import
if (!code.includes('HANA_DATA_VERSION')) {
  code = code.replace(
    "import { useState, useMemo, useEffect } from 'react';\nimport {",
    "import { useState, useMemo, useEffect } from 'react';\nimport { Sparkles,"
  );
  code = code.replace(
    "import PayrollView from './PayrollView';",
    "import PayrollView from './PayrollView';\nimport { HANA_DATA_VERSION, INITIAL_PAYROLL_DATA } from '../data/payrollData';"
  );
}

// 2. Thay thế State khởi tạo employees
const oldEmployeesInit = `  // Employee Directory States
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() => {
    const saved = localStorage.getItem('HANA_EMPLOYEES_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_EMPLOYEES;
      }
    }
    return INITIAL_EMPLOYEES;
  });`;

const newEmployeesInit = `  // Employee Directory States với Auto-Clean dữ liệu cũ
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() => {
    const version = localStorage.getItem('HANA_EMPLOYEES_DATA_VERSION');
    const saved = localStorage.getItem('HANA_EMPLOYEES_DATA');
    if (saved && version === HANA_DATA_VERSION) {
      try {
        const parsed = JSON.parse(saved);
        const hasLegacyDummy = parsed.some((e: any) => ['NV001', 'NV002', 'NV003', 'NV004', 'NV005', 'NV006', 'NV007', 'NV008', 'NV009', 'NV010', 'NV011'].includes(e.maNV));
        if (!hasLegacyDummy && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    // Tự động làm sạch dữ liệu cũ và lưu 4 KTV chuẩn ERP
    localStorage.setItem('HANA_EMPLOYEES_DATA_VERSION', HANA_DATA_VERSION);
    localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(INITIAL_EMPLOYEES));
    return INITIAL_EMPLOYEES;
  });`;

if (code.includes(oldEmployeesInit)) {
  code = code.replace(oldEmployeesInit, newEmployeesInit);
}

// 3. Thêm hàm reset
const resetFuncCode = `
  // Làm sạch danh sách và khôi phục 4 KTV chuẩn từ Google Drive/ERP
  const handleResetEmployeesERP = () => {
    if (window.confirm('Khôi phục danh sách chuẩn 4 KTV chính thức thực tế từ Google Drive/ERP (loại bỏ toàn bộ nhân sự cũ đã xóa)?')) {
      localStorage.setItem('HANA_EMPLOYEES_DATA_VERSION', HANA_DATA_VERSION);
      localStorage.setItem('HANA_EMPLOYEES_DATA', JSON.stringify(INITIAL_EMPLOYEES));
      localStorage.setItem('HANA_PAYROLL_DATA_VERSION', HANA_DATA_VERSION);
      localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(INITIAL_PAYROLL_DATA));
      setEmployees(INITIAL_EMPLOYEES);
      setToast({
        show: true,
        message: 'Đã làm sạch và đồng bộ chuẩn 4 KTV thực tế từ Google Drive/ERP!',
        success: true,
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  };
`;

if (!code.includes('handleResetEmployeesERP')) {
  code = code.replace('  // Handle Save New Employee', `${resetFuncCode}\n  // Handle Save New Employee`);
}

// 4. Thêm nút "Làm sạch & Chuẩn ERP" vào toolbar của Employee Directory
const searchBarCode = `<button
                onClick={() => setShowAddEmpModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8D6E63] hover:bg-[#6D4C41] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Thêm nhân sự</span>
              </button>`;

const newButtons = `<button
                onClick={handleResetEmployeesERP}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Làm sạch dữ liệu và chỉ giữ lại 4 KTV chính thức thực tế từ Google Drive/ERP"
              >
                <Sparkles size={15} />
                <span>Chuẩn hóa ERP (4 KTV)</span>
              </button>
              ${searchBarCode}`;

if (code.includes(searchBarCode) && !code.includes('Chuẩn hóa ERP (4 KTV)')) {
  code = code.replace(searchBarCode, newButtons);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Updated HRManagementView successfully!');
