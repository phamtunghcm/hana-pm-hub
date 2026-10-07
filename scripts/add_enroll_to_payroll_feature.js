import fs from 'fs';

// 1. CẬP NHẬT PayrollView.tsx
const payrollPath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/components/PayrollView.tsx';
let payrollCode = fs.readFileSync(payrollPath, 'utf8');

// Định nghĩa props cho PayrollView
if (!payrollCode.includes('export interface PayrollViewProps')) {
  payrollCode = payrollCode.replace(
    'export default function PayrollView() {',
    `export interface PayrollViewProps {
  payrollData?: Record<string, EmployeePayroll[]>;
  onUpdatePayrollData?: (newData: Record<string, EmployeePayroll[]>) => void;
  targetSelectedMaNV?: string | null;
}

export default function PayrollView({
  payrollData: propPayrollData,
  onUpdatePayrollData: propOnUpdatePayrollData,
  targetSelectedMaNV,
}: PayrollViewProps = {}) {`
  );

  // Thêm sync effect
  const effectCode = `
  // Đồng bộ props & sự kiện LANA_PAYROLL_UPDATED
  useEffect(() => {
    if (propPayrollData) {
      setPayrollData(propPayrollData);
    }
  }, [propPayrollData]);

  useEffect(() => {
    if (targetSelectedMaNV) {
      const match = (payrollData[selectedMonth] || []).find(e => e.maNV === targetSelectedMaNV);
      if (match) {
        setSelectedEmployee(match);
      }
    }
  }, [targetSelectedMaNV, payrollData, selectedMonth]);

  useEffect(() => {
    const handleSyncEvent = () => {
      const saved = localStorage.getItem('HANA_PAYROLL_DATA');
      if (saved) {
        try {
          setPayrollData(JSON.parse(saved));
        } catch {}
      }
    };
    window.addEventListener('storage', handleSyncEvent);
    window.addEventListener('HANA_PAYROLL_UPDATED', handleSyncEvent);
    return () => {
      window.removeEventListener('storage', handleSyncEvent);
      window.removeEventListener('HANA_PAYROLL_UPDATED', handleSyncEvent);
    };
  }, []);
`;

  payrollCode = payrollCode.replace(
    '  const [deletingPayrollEmp, setDeletingPayrollEmp] = useState<EmployeePayroll | null>(null);',
    `  const [deletingPayrollEmp, setDeletingPayrollEmp] = useState<EmployeePayroll | null>(null);\n${effectCode}`
  );

  // Thêm banner thông báo ở đầu PayrollView
  const bannerCode = `      {/* Banner thông báo quy trình: Nhân sự đưa lên từ tab Hồ sơ */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
            💡
          </div>
          <div className="text-[#5D4037]">
            <span className="font-extrabold text-[#4E342E]">Quy tắc đưa nhân sự vào Bảng Lương: </span>
            Nhân sự mới được tạo từ <strong>Hồ sơ nhân sự</strong> chỉ xuất hiện trên Bảng Lương khi người quản lý bấm nút <strong className="text-emerald-800">"➕ Đưa Lên Bảng Lương"</strong> trên thẻ nhân viên đó.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
            Kỳ {selectedMonth}: {currentMonthEmployees.length} nhân sự
          </span>
        </div>
      </div>\n\n      {/* Header Bar */}`;

  payrollCode = payrollCode.replace('      {/* Header Bar */}', bannerCode);

  // Ensure useEffect is imported in PayrollView
  if (!payrollCode.includes("import { useState, useMemo, useRef, useEffect }")) {
    payrollCode = payrollCode.replace(
      "import { useState, useMemo, useRef } from 'react';",
      "import { useState, useMemo, useRef, useEffect } from 'react';"
    );
  }

  fs.writeFileSync(payrollPath, payrollCode, 'utf8');
  console.log('PayrollView.tsx updated successfully with props and sync listeners.');
}

// 2. CẬP NHẬT HRManagementView.tsx
const hrPath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/components/HRManagementView.tsx';
let hrCode = fs.readFileSync(hrPath, 'utf8');

// Thêm hàm createPayrollRecordFromEmployee & handlers vào HRManagementView
if (!hrCode.includes('handleAddToPayroll')) {
  // Import calculateHanaPayrollRecord
  if (!hrCode.includes('calculateHanaPayrollRecord')) {
    hrCode = hrCode.replace(
      "import { HANA_DATA_VERSION, INITIAL_PAYROLL_DATA } from '../data/payrollData';",
      "import { HANA_DATA_VERSION, INITIAL_PAYROLL_DATA, calculateHanaPayrollRecord, PAYROLL_MONTHS } from '../data/payrollData';\nimport type { EmployeePayroll } from '../types/payroll';"
    );
  }

  // Thêm state payrollData và selectedPayrollMonth trong HRManagementView
  const stateAddCode = `  // Payroll Integration State trong HRManagementView
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>('2026-10');
  const [targetSelectedMaNV, setTargetSelectedMaNV] = useState<string | null>(null);
  const [payrollData, setPayrollData] = useState<Record<string, EmployeePayroll[]>>(() => {
    const saved = localStorage.getItem('HANA_PAYROLL_DATA');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_PAYROLL_DATA;
  });

  const updatePayrollData = (newData: Record<string, EmployeePayroll[]>) => {
    setPayrollData(newData);
    localStorage.setItem('HANA_PAYROLL_DATA', JSON.stringify(newData));
    window.dispatchEvent(new Event('HANA_PAYROLL_UPDATED'));
  };

  // Hàm tạo record bảng lương từ hồ sơ nhân sự
  const createPayrollRecordFromEmp = (emp: EmployeeProfile): EmployeePayroll => {
    const baseSalary = Number(emp.luongDongBHXH || emp.luongThoaThuan) || 5500000;
    const commitment = Number(emp.mucLuongCamKet) || 10000000;
    return calculateHanaPayrollRecord({
      maNV: emp.maNV,
      hoTen: emp.hoTen,
      chucVu: emp.chucVu,
      chucVuLabel: emp.chucVuLabel,
      capBac: emp.capBacTen || 'Bậc 1',
      capBacTen: emp.capBacTen || 'Bậc 1',
      chiNhanh: emp.chiNhanh,
      chiNhanhTen: emp.chiNhanhTen,
      soDienThoai: emp.soDienThoai,
      soTaiKhoan: emp.soTaiKhoan || '',
      nganHang: emp.nganHang || '',
      ngayVaoLam: emp.ngayVaoLam || '01/10/2026',
      soNguoiPhuThuoc: 0,
      hinhThucLuong: emp.hinhThucLuong || 'LCBHoaHong',
      mucLuongCamKet: commitment,
      trangThaiLamViec: emp.trangThaiLamViec || 'Chính thức',
      cheDoNghi: '3 - 4 ngày/tháng (Hưởng nguyên lương)',
      ngayCongChuan: 26,
      ngayCongThucTe: 26,
      soLanDiMuon: 0,
      ngayNghiPhep: 0,
      ngayNghiKhongLuong: 0,
      luongDongBHXH: baseSalary,
      coDongBHXH: true,
      phuCapTrachNhiem: 0,
      luongThoaThuan: baseSalary,
      phuCapCom: 800000,
      phuCapGuiXe: 200000,
      phuCapXang: 500000,
      hhTourKtv: 0,
      hhBanLe: 0,
      hhDoanhSo: 0,
      tongHoaHong: 0,
      thuongKPI: commitment - baseSalary - 500000,
      phatDiMuon: 0,
      tamUng: 0,
      thueTNCN: 0,
      trangThai: 'TamTinh' as const,
      chiTietHoaHong: [],
      chiTietChamCong: [],
    });
  };

  // Xử lý đưa 1 nhân sự lên Bảng Lương
  const handleAddToPayroll = (emp: EmployeeProfile, month: string = selectedPayrollMonth) => {
    const currentList = payrollData[month] || [];
    if (currentList.some(p => p.maNV === emp.maNV)) {
      showToast(\`Nhân sự \${emp.hoTen} đã có trên Bảng Lương kỳ \${month}!\`, false);
      return;
    }

    const newRecord = createPayrollRecordFromEmp(emp);
    const updatedPayroll = {
      ...payrollData,
      [month]: [...currentList, newRecord],
    };
    updatePayrollData(updatedPayroll);
    showToast(\`✓ Đã đưa nhân sự \${emp.hoTen} lên Bảng Lương kỳ \${month} thành công!\`, true);
  };

  // Xử lý gỡ nhân sự khỏi Bảng Lương
  const handleRemoveFromPayroll = (emp: EmployeeProfile, month: string = selectedPayrollMonth) => {
    if (!window.confirm(\`Bạn có chắc chắn muốn gỡ nhân sự \${emp.hoTen} khỏi Bảng Lương kỳ \${month}?\`)) return;
    const currentList = payrollData[month] || [];
    const updatedPayroll = {
      ...payrollData,
      [month]: currentList.filter(p => p.maNV !== emp.maNV),
    };
    updatePayrollData(updatedPayroll);
    showToast(\`Đã gỡ nhân sự \${emp.hoTen} khỏi Bảng Lương kỳ \${month}!\`, true);
  };

  // Đưa tất cả nhân sự lên Bảng Lương
  const handleAddAllToPayroll = (month: string = selectedPayrollMonth) => {
    const currentList = payrollData[month] || [];
    const existingIds = new Set(currentList.map(p => p.maNV));
    const toAdd = employees.filter(e => !existingIds.has(e.maNV));

    if (toAdd.length === 0) {
      showToast(\`Tất cả nhân sự đã có trên Bảng Lương kỳ \${month}!\`, true);
      return;
    }

    const newRecords = toAdd.map(createPayrollRecordFromEmp);
    const updatedPayroll = {
      ...payrollData,
      [month]: [...currentList, ...newRecords],
    };
    updatePayrollData(updatedPayroll);
    showToast(\`✓ Đã đưa \${toAdd.length} nhân sự lên Bảng Lương kỳ \${month} thành công!\`, true);
  };
`;

  hrCode = hrCode.replace(
    '  // CRUD Employee States',
    `${stateAddCode}\n  // CRUD Employee States`
  );

  // Truyền props vào <PayrollView />
  hrCode = hrCode.replace(
    '<PayrollView />',
    `<PayrollView
            payrollData={payrollData}
            onUpdatePayrollData={updatePayrollData}
            targetSelectedMaNV={targetSelectedMaNV}
          />`
  );

  // Thêm nút "Đưa toàn bộ lên Bảng Lương" và bộ chọn kỳ trên toolbar tab Directory
  const oldToolbarSearch = `<button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              <span>Thêm Nhân Viên Mới</span>
            </button>`;

  const newToolbarButtons = `
            {/* Bộ chọn kỳ áp dụng lương */}
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#E7E0D6] text-xs">
              <span className="font-bold text-[#8D6E63]">Kỳ áp dụng:</span>
              <select
                value={selectedPayrollMonth}
                onChange={e => setSelectedPayrollMonth(e.target.value)}
                className="font-bold text-[#4E342E] bg-transparent outline-none cursor-pointer"
              >
                {PAYROLL_MONTHS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Nút Đưa Tất Cả Lên Bảng Lương */}
            <button
              onClick={() => handleAddAllToPayroll(selectedPayrollMonth)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
              title="Đưa toàn bộ nhân sự chưa có lên Bảng Lương kỳ hiện tại"
            >
              <Wallet size={15} />
              <span>Đưa Tất Cả Lên Bảng Lương</span>
            </button>

            ${oldToolbarSearch}`;

  hrCode = hrCode.replace(oldToolbarSearch, newToolbarButtons);

  // Cập nhật từng Card Nhân Viên để có nút "Đưa Lên Bảng Lương"
  const oldCardEnd = `{/* ACTION BAR: XEM CHI TIẾT + SỬA + XÓA */}
                <div className="mt-5 pt-3 border-t border-[#F0EAE1] flex items-center justify-between gap-2">`;

  const newCardEnrollmentSection = `{/* DẢI HÀNH ĐỘNG: ĐƯA LÊN BẢNG LƯƠNG */}
                {(() => {
                  const currentMonthList = payrollData[selectedPayrollMonth] || [];
                  const isEnrolled = currentMonthList.some(p => p.maNV === emp.maNV);
                  return (
                    <div className="mt-3 pt-3 border-t border-[#F0EAE1]">
                      {isEnrolled ? (
                        <div className="flex items-center justify-between gap-2 bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                            <span>Đã có trên Bảng Lương ({selectedPayrollMonth})</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSelectedMaNV(emp.maNV);
                                setActiveSubTab('payroll');
                              }}
                              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black cursor-pointer shadow-2xs"
                              title="Chuyển sang Bảng Lương xem chi tiết"
                            >
                              Xem Lương →
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromPayroll(emp, selectedPayrollMonth)}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] cursor-pointer"
                              title="Gỡ khỏi kỳ lương này"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToPayroll(emp, selectedPayrollMonth)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:shadow-md"
                          title="Bấm để đưa nhân sự này lên Bảng Lương kỳ hiện tại"
                        >
                          <Wallet size={15} />
                          <span>➕ Đưa Lên Bảng Lương ({selectedPayrollMonth})</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                ${oldCardEnd}`;

  hrCode = hrCode.replace(oldCardEnd, newCardEnrollmentSection);

  // Cập nhật trong Modal Chi Tiết Nhân Sự (selectedEmpDetail)
  const detailModalCloseBtn = `                <button
                  onClick={() => setSelectedEmpDetail(null)}
                  className="px-4 py-2 bg-[#EFEBE0] hover:bg-[#E2DACB] text-[#5D4037] text-xs font-bold rounded-xl transition-colors"
                >
                  Đóng
                </button>`;

  const detailModalEnrollBtn = `{(() => {
                  const currentMonthList = payrollData[selectedPayrollMonth] || [];
                  const isEnrolled = currentMonthList.some(p => p.maNV === selectedEmpDetail.maNV);
                  return isEnrolled ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetSelectedMaNV(selectedEmpDetail.maNV);
                        setSelectedEmpDetail(null);
                        setActiveSubTab('payroll');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wallet size={15} />
                      <span>Xem Lương Kỳ {selectedPayrollMonth} →</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddToPayroll(selectedEmpDetail, selectedPayrollMonth);
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wallet size={15} />
                      <span>➕ Đưa Lên Bảng Lương Kỳ {selectedPayrollMonth}</span>
                    </button>
                  );
                })()}
                ${detailModalCloseBtn}`;

  hrCode = hrCode.replace(detailModalCloseBtn, detailModalEnrollBtn);

  fs.writeFileSync(hrPath, hrCode, 'utf8');
  console.log('HRManagementView.tsx updated successfully with Add-to-Payroll buttons on each card, toolbar, and detail modal!');
}
