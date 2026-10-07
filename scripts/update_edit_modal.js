import fs from 'fs';

const filePath = '/Users/tungpv/.gemini/antigravity-ide/scratch/hana-pm-hub/src/components/PayrollView.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const startTag = '{/* MODAL: SỬA CHI TIẾT LƯƠNG NHÂN VIÊN */}';
const endTag = '{/* MODAL: XÁC NHẬN XÓA KHỎI KỲ LƯƠNG */}';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find modal tags in PayrollView.tsx');
  process.exit(1);
}

const newModalCode = `{/* MODAL: SỬA CHI TIẾT LƯƠNG NHÂN VIÊN */}
      {showEditPayrollModal && editingPayrollEmp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#E7E0D6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-5 border-b border-[#E7E0D6] bg-gradient-to-r from-[#FAF7F0] to-[#F5F0E6] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8D6E63] text-white flex items-center justify-center font-black shadow-xs">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#4E342E]">
                    Chỉnh Sửa Lương & Đãi Ngộ Kỳ {selectedMonth}
                  </h3>
                  <p className="text-xs text-[#8D6E63]">
                    Nhân sự: <strong className="text-[#4E342E]">{editingPayrollEmp.hoTen}</strong> · Mã: <span className="font-mono font-bold text-amber-900">{editingPayrollEmp.maNV}</span> · Vị trí: {editingPayrollEmp.chucVuLabel} ({editingPayrollEmp.chiNhanhTen})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPayrollModal(false)}
                className="p-2 rounded-full hover:bg-white/80 text-[#8D6E63] hover:text-[#4E342E] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body - 5 Khối Khoa học & Mọi con số đều sửa được */}
            <form onSubmit={handleSaveEditPayroll} className="p-6 space-y-6 text-xs text-[#5D4037] overflow-y-auto grow">
              
              {/* KHỐI 1: THỜI GIAN LÀM VIỆC & KỶ LUẬT LAO ĐỘNG */}
              <div className="p-4 bg-[#FAF7F0] border border-[#E7E0D6] rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-[#6D4C41] flex items-center gap-1.5">
                    <span>⏱️ Khối 1: Thời gian làm việc & Kỷ luật lao động</span>
                  </h4>
                  <span className="text-[11px] text-[#8D6E63]">Chuẩn định mức: <strong>{editingPayrollEmp.ngayCongChuan || 26} công/tháng</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">
                      Ngày công thực tế (Chuẩn 26) <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="31"
                      required
                      value={editingPayrollEmp.ngayCongThucTe}
                      onChange={e => {
                        const newCong = Number(e.target.value);
                        const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                        const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                        const camKet = Number(editingPayrollEmp.mucLuongCamKet || 10000000);
                        
                        // Tự động tính lại phụ cấp xăng nếu chưa sửa tay
                        const newXangTheoCong = Math.min(500000, Math.round((500000 / congChuan) * newCong));
                        const currentXang = editingPayrollEmp.phuCapXang;
                        const shouldUpdateXang = currentXang === undefined || currentXang === Math.min(500000, Math.round((500000 / congChuan) * (Number(editingPayrollEmp.ngayCongThucTe) || 0)));

                        const newBhxhTheoCong = Math.round((luongBhxh / congChuan) * newCong);
                        const newCamKetTheoCong = (newCong >= congChuan) ? camKet : Math.round((camKet / congChuan) * newCong);
                        const newAutoKpi = Math.max(0, newCamKetTheoCong - newBhxhTheoCong - (shouldUpdateXang ? newXangTheoCong : Number(currentXang || 0)));

                        setEditingPayrollEmp({
                          ...editingPayrollEmp,
                          ngayCongThucTe: newCong,
                          phuCapXang: shouldUpdateXang ? newXangTheoCong : currentXang,
                          thuongKPI: newAutoKpi,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Căn cứ tính lương thời gian</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Nghỉ phép hưởng lương (P):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingPayrollEmp.ngayNghiPhep || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, ngayNghiPhep: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Phép năm chế độ</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Nghỉ không lương (KL):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingPayrollEmp.ngayNghiKhongLuong || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, ngayNghiKhongLuong: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Số ngày nghỉ việc riêng</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Số lần đi muộn (lần):</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editingPayrollEmp.soLanDiMuon || 0}
                      onChange={e => {
                        const times = Number(e.target.value);
                        setEditingPayrollEmp({
                          ...editingPayrollEmp,
                          soLanDiMuon: times,
                          phatDiMuon: times * 50000,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Tự động gợi ý phạt 50k/lần</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#4E342E]">Tiền phạt kỷ luật / Đi muộn (VNĐ):</label>
                      <button
                        type="button"
                        onClick={() => {
                          const times = Number(editingPayrollEmp.soLanDiMuon || 0);
                          setEditingPayrollEmp({ ...editingPayrollEmp, phatDiMuon: times * 50000 });
                        }}
                        className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                        title="Tính lại tiền phạt theo số lần đi muộn x 50.000đ"
                      >
                        ↺ Mặc định ({formatVND((Number(editingPayrollEmp.soLanDiMuon) || 0) * 50000)})
                      </button>
                    </div>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editingPayrollEmp.phatDiMuon !== undefined ? editingPayrollEmp.phatDiMuon : ((Number(editingPayrollEmp.soLanDiMuon) || 0) * 50000)}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, phatDiMuon: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block">Khoản khấu trừ phạt vào lương thực lĩnh</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: CHẾ ĐỘ HỢP ĐỒNG & BẢO HIỂM XÃ HỘI */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <span>📋 Khối 2: Chế độ Lương hợp đồng & Trích nộp BHXH</span>
                  </h4>
                  <span className="text-[11px] text-emerald-800 font-semibold">Tỷ lệ: NLĐ 10.5% · DN 21.5%</span>
                </div>

                {/* Checkbox tham gia BHXH */}
                <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingPayrollEmp.coDongBHXH !== undefined ? Boolean(editingPayrollEmp.coDongBHXH) : true}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, coDongBHXH: e.target.checked })}
                      className="w-5 h-5 text-emerald-700 rounded border-[#E7E0D6] focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#4E342E] block">
                        Tháng này CBNV có tham gia đóng BHXH và các quỹ bảo hiểm bắt buộc
                      </span>
                      <span className="text-[10px] text-[#8D6E63] block">
                        {editingPayrollEmp.coDongBHXH !== false 
                          ? '✓ Trích trừ 10.5% vào lương NLĐ và 21.5% trách nhiệm Doanh nghiệp đóng thêm' 
                          : '⚠️ Không trích trừ BHXH tháng này (khấu trừ BHXH cá nhân = 0đ)'}
                      </span>
                    </div>
                  </label>
                  <span className={\`px-2.5 py-1 rounded-lg text-[10px] font-extrabold \${
                    editingPayrollEmp.coDongBHXH !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }\`}>
                    {editingPayrollEmp.coDongBHXH !== false ? 'CÓ ĐÓNG BHXH' : 'KHÔNG ĐÓNG BHXH'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-emerald-950">
                      Mức cam kết thu nhập (VNĐ/tháng khi đủ 26 công) <span className="text-emerald-700">*</span>:
                    </label>
                    <input
                      type="number"
                      step="500000"
                      value={editingPayrollEmp.mucLuongCamKet !== undefined ? editingPayrollEmp.mucLuongCamKet : 10000000}
                      onChange={e => {
                        const newCamKet = Number(e.target.value);
                        const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                        const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                        const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                        const xang = editingPayrollEmp.phuCapXang !== undefined ? Number(editingPayrollEmp.phuCapXang) : Math.min(500000, Math.round((500000 / congChuan) * congLam));
                        const bhxhTheoCong = Math.round((luongBhxh / congChuan) * congLam);
                        const camKetTheoCong = (congLam >= congChuan) ? newCamKet : Math.round((newCamKet / congChuan) * congLam);
                        const autoKpi = Math.max(0, camKetTheoCong - bhxhTheoCong - xang);

                        setEditingPayrollEmp({
                          ...editingPayrollEmp,
                          mucLuongCamKet: newCamKet,
                          thuongKPI: autoKpi,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="10000000"
                    />
                    <span className="text-[10px] text-emerald-800 mt-0.5 block">
                      Tạm ghi 10.000.000đ (có thể chỉnh sửa tự do theo thỏa thuận)
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">
                      Mức lương cơ bản đóng BHXH (Hợp đồng, VNĐ) <span className="text-rose-600">*</span>:
                    </label>
                    <input
                      type="number"
                      step="100000"
                      value={editingPayrollEmp.luongDongBHXH}
                      onChange={e => {
                        const newBhxh = Number(e.target.value);
                        setEditingPayrollEmp({ ...editingPayrollEmp, luongDongBHXH: newBhxh });
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">
                      Lương ghi trên HĐLĐ (thường 5.500.000đ hoặc 5.350.000đ)
                    </span>
                  </div>
                </div>

                {/* Tóm tắt Lương thời gian căn bản */}
                {(() => {
                  const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                  const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                  const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                  const ltg = Math.round((luongBhxh / congChuan) * congLam);
                  return (
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-[11px] flex items-center justify-between">
                      <span className="text-emerald-900 font-semibold">
                        💵 Lương thời gian căn bản ({congLam}/{congChuan} công):
                      </span>
                      <strong className="font-mono text-emerald-950 text-xs">{formatVND(ltg)}</strong>
                    </div>
                  );
                })()}
              </div>

              {/* KHỐI 3: CÁC KHOẢN PHỤ CẤP ĐÃI NGỘ (SỬA TỰ DO - PHỤ CẤP XE SỬA ĐƯỢC) */}
              <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <span>🍱 Khối 3: Các khoản Phụ cấp đãi ngộ (Tất cả con số đều sửa được)</span>
                  </h4>
                  <span className="text-[11px] text-amber-800 font-semibold">Quy chế 06/2026/QC-LT-HNW</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Phụ cấp cơm */}
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Phụ cấp tiền cơm (Cố định, VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.phuCapCom !== undefined ? editingPayrollEmp.phuCapCom : 800000}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, phuCapCom: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Cố định chuẩn 800.000đ/tháng</span>
                  </div>

                  {/* PHỤ CẤP XĂNG XE - CHO PHÉP SỬA TỰ DO VÀ CÓ NÚT TÍNH THEO CÔNG */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#4E342E] flex items-center gap-1">
                        <span>Phụ cấp xăng xe (VNĐ):</span>
                        <span className="text-emerald-700 font-black text-[10px] bg-emerald-100 px-1 rounded">Sửa được</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                          const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                          const xangChuan = Math.min(500000, Math.round((500000 / congChuan) * congLam));
                          setEditingPayrollEmp({ ...editingPayrollEmp, phuCapXang: xangChuan });
                        }}
                        className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                        title="Tính lại theo công thực tế: tối đa 500k"
                      >
                        ↺ Tính theo công
                      </button>
                    </div>
                    {(() => {
                      const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                      const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                      const xangMacDinh = Math.min(500000, Math.round((500000 / congChuan) * congLam));
                      const currentVal = (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null)
                        ? editingPayrollEmp.phuCapXang
                        : xangMacDinh;

                      return (
                        <>
                          <input
                            type="number"
                            step="10000"
                            min="0"
                            value={currentVal}
                            onChange={e => {
                              const val = e.target.value === '' ? ('' as any) : Number(e.target.value);
                              setEditingPayrollEmp({ ...editingPayrollEmp, phuCapXang: val });
                            }}
                            className="w-full px-3 py-2 bg-white border-2 border-amber-400 rounded-xl text-xs font-mono font-black text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder={xangMacDinh.toString()}
                          />
                          <span className="text-[10px] text-amber-800 mt-0.5 block">
                            Mặc định: {formatVND(xangMacDinh)} ({congLam}/{congChuan} công) · Có thể sửa tự do
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Phụ cấp gửi xe */}
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Phụ cấp gửi xe (VNĐ):</label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editingPayrollEmp.phuCapGuiXe !== undefined ? editingPayrollEmp.phuCapGuiXe : 200000}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, phuCapGuiXe: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-[#4E342E] focus:ring-2 focus:ring-[#8D6E63] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Mặc định 200.000đ/tháng · Sửa được</span>
                  </div>
                </div>

                {/* Tóm tắt tổng phụ cấp */}
                {(() => {
                  const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                  const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                  const com = editingPayrollEmp.phuCapCom !== undefined ? Number(editingPayrollEmp.phuCapCom) : 800000;
                  const xang = (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null && (editingPayrollEmp.phuCapXang as any) !== '')
                    ? Number(editingPayrollEmp.phuCapXang)
                    : Math.min(500000, Math.round((500000 / congChuan) * congLam));
                  const guiXe = editingPayrollEmp.phuCapGuiXe !== undefined ? Number(editingPayrollEmp.phuCapGuiXe) : 200000;
                  const tongPhuCap = com + xang + guiXe;

                  return (
                    <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] flex items-center justify-between">
                      <span className="text-amber-900 font-semibold">
                        🍱 Tổng phụ cấp đãi ngộ (Cơm {formatVND(com)} + Xăng {formatVND(xang)} + Gửi xe {formatVND(guiXe)}):
                      </span>
                      <strong className="font-mono text-amber-950 text-xs font-black">{formatVND(tongPhuCap)}</strong>
                    </div>
                  );
                })()}
              </div>

              {/* KHỐI 4: HOA HỒNG DỊCH VỤ & KHẤU TRỪ KHÁC (SỬA TỰ DO) */}
              <div className="p-4 bg-[#FAF7F0] border border-[#E7E0D6] rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-2">
                  <h4 className="text-[12px] font-black uppercase tracking-wider text-[#6D4C41] flex items-center gap-1.5">
                    <span>💇‍♀️ Khối 4: Doanh số, Hoa hồng dịch vụ & Các khoản khấu trừ khác</span>
                  </h4>
                  <span className="text-[11px] text-[#8D6E63]">Nhập số tiền thực tế</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Hoa hồng Tour KTV trị liệu (VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.hhTourKtv || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, hhTourKtv: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Tour làm trực tiếp cho khách</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Hoa hồng Bán lẻ mỹ phẩm (VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.hhBanLe || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, hhBanLe: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">5% doanh số bán lẻ thảo dược</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Hoa hồng Doanh số chung (VNĐ):</label>
                    <input
                      type="number"
                      step="50000"
                      min="0"
                      value={editingPayrollEmp.hhDoanhSo || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, hhDoanhSo: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8D6E63] mt-0.5 block">Thưởng doanh số cơ sở chi nhánh</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Tạm ứng trong kỳ (VNĐ):</label>
                    <input
                      type="number"
                      step="100000"
                      min="0"
                      value={editingPayrollEmp.tamUng || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, tamUng: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block">Trừ trực tiếp khi chi lương</span>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#4E342E]">Khấu trừ Thuế TNCN (VNĐ):</label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={editingPayrollEmp.thueTNCN || 0}
                      onChange={e => setEditingPayrollEmp({ ...editingPayrollEmp, thueTNCN: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs font-mono text-rose-700 font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-rose-700 mt-0.5 block">Thuế TNCN tạm khấu trừ</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 5: TỰ QUYẾT ĐỊNH THƯỞNG KPI & TỔNG KẾT THỰC LĨNH NET */}
              {(() => {
                const congChuan = editingPayrollEmp.ngayCongChuan || 26;
                const congLam = Number(editingPayrollEmp.ngayCongThucTe) || 0;
                const luongBhxh = Number(editingPayrollEmp.luongDongBHXH) || 5350000;
                const luongBhxhTheoCong = Math.round((luongBhxh / congChuan) * congLam);
                
                const phuCapCom = editingPayrollEmp.phuCapCom !== undefined ? Number(editingPayrollEmp.phuCapCom) : 800000;
                const xang = (editingPayrollEmp.phuCapXang !== undefined && editingPayrollEmp.phuCapXang !== null && (editingPayrollEmp.phuCapXang as any) !== '')
                  ? Number(editingPayrollEmp.phuCapXang)
                  : Math.min(500000, Math.round((500000 / congChuan) * congLam));

                const hhTour = Number(editingPayrollEmp.hhTourKtv) || 0;
                const hhBanLe = Number(editingPayrollEmp.hhBanLe) || 0;
                const hhDoanhSo = Number(editingPayrollEmp.hhDoanhSo) || 0;
                const tongHoaHong = hhTour + hhBanLe + hhDoanhSo;

                const phatDiMuon = (editingPayrollEmp.phatDiMuon !== undefined && editingPayrollEmp.phatDiMuon !== null && (editingPayrollEmp.phatDiMuon as any) !== '')
                  ? Number(editingPayrollEmp.phatDiMuon)
                  : ((Number(editingPayrollEmp.soLanDiMuon) || 0) * 50000);
                const tamUng = Number(editingPayrollEmp.tamUng) || 0;
                const thueTNCN = Number(editingPayrollEmp.thueTNCN) || 0;

                // 1. MỨC CAM KẾT THU NHẬP
                const mucCamKet = (editingPayrollEmp.mucLuongCamKet !== undefined && editingPayrollEmp.mucLuongCamKet !== null && !isNaN(Number(editingPayrollEmp.mucLuongCamKet)))
                  ? Number(editingPayrollEmp.mucLuongCamKet)
                  : 10000000;

                // 2. TRẠNG THÁI ĐÓNG BHXH THÁNG NÀY
                const isCoDongBHXH = editingPayrollEmp.coDongBHXH !== false;

                // TỔNG THU NHẬP CỦA CÁC MỤC KHÁC (TRƯỚC KHI CỘNG KPI)
                const tongThuNhapChuaKpi = luongBhxhTheoCong + phuCapCom + xang + tongHoaHong;

                // MỨC CHUẨN GÓI CAM KẾT THEO CÔNG & GỢI Ý BÙ ĐỦ
                const mucTieuCamKetTheoCong = (congLam >= congChuan) ? mucCamKet : Math.round((mucCamKet / congChuan) * congLam);
                const kpiGoiYBuDuCamKet = Math.max(0, mucTieuCamKetTheoCong - luongBhxhTheoCong - xang);

                // THƯỞNG KPI HIỆN TẠI DO QUẢN LÝ ĐIỀN / CHỌN
                const currentKpi = (editingPayrollEmp.thuongKPI !== undefined && editingPayrollEmp.thuongKPI !== null && (editingPayrollEmp.thuongKPI as any) !== '')
                  ? Number(editingPayrollEmp.thuongKPI)
                  : kpiGoiYBuDuCamKet;
                const isOverridden = currentKpi !== kpiGoiYBuDuCamKet;

                // DỰ KIẾN KẾT QUẢ CUỐI CÙNG
                const tongGrossDuKien = tongThuNhapChuaKpi + currentKpi;
                const bhxhCaNhanDuKien = isCoDongBHXH
                  ? Math.round(luongBhxhTheoCong * 0.08) + Math.round(luongBhxhTheoCong * 0.015) + Math.round(luongBhxhTheoCong * 0.01)
                  : 0;
                const tongKhauTruDuKien = bhxhCaNhanDuKien + thueTNCN + tamUng + phatDiMuon;
                const thucLinhDuKien = tongGrossDuKien - tongKhauTruDuKien;

                return (
                  <div className="space-y-4 pt-1">
                    {/* BẢNG TỔNG HỢP CÁC MỤC KHÁC (TRƯỚC KHI TỰ QUYẾT KPI) */}
                    <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-extrabold text-[#4E342E] text-xs flex items-center gap-1.5">
                          <span>📊 TỔNG THU NHẬP CÁC MỤC KHÁC (TRƯỚC KHI CỘNG KPI):</span>
                        </span>
                        <span className="font-mono text-base font-black text-amber-950 bg-white px-3 py-1 rounded-xl border border-amber-300 shadow-2xs self-start sm:self-auto">
                          {formatVND(tongThuNhapChuaKpi)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#6D4C41] pt-1 border-t border-amber-200">
                        <div>
                          <span className="text-[#8D6E63] block">1. Lương cơ bản ({congLam}c):</span>
                          <strong className="font-mono">{formatVND(luongBhxhTheoCong)}</strong>
                        </div>
                        <div>
                          <span className="text-[#8D6E63] block">2. Tiền cơm cố định:</span>
                          <strong className="font-mono">{formatVND(phuCapCom)}</strong>
                        </div>
                        <div>
                          <span className="text-[#8D6E63] block">3. Phụ cấp xăng ({congLam}c):</span>
                          <strong className="font-mono text-amber-950">{formatVND(xang)}</strong>
                        </div>
                        <div>
                          <span className="text-[#8D6E63] block">4. Tổng hoa hồng:</span>
                          <strong className="font-mono text-emerald-800">{formatVND(tongHoaHong)}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[#6D4C41]">
                          🎯 Cam kết thu nhập theo công: <strong>{formatVND(mucTieuCamKetTheoCong)}</strong> (Gói chuẩn: {formatVND(mucCamKet)}/tháng)
                        </span>
                        <span className="text-emerald-800 font-bold">
                          💡 Gợi ý bù đủ cam kết: <strong>{formatVND(kpiGoiYBuDuCamKet)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* BƯỚC CUỐI CÙNG: Ô ĐIỀN THƯỞNG KPI TỰ QUYẾT ĐỊNH */}
                    <div className="p-4 bg-emerald-50/60 border-2 border-emerald-500 rounded-2xl space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="font-black text-emerald-950 text-xs flex items-center gap-2">
                            <span>🎯 Khối 5: TỰ QUYẾT ĐỊNH THƯỞNG KPI (EDITABLE)</span>
                            {isOverridden ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ✏️ Đã tự điều chỉnh
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                ✓ Đang theo mức bù đủ cam kết
                              </span>
                            )}
                          </label>
                          <p className="text-[10px] text-emerald-800 mt-0.5">
                            Quản lý xem tổng thu nhập các mục trên ({formatVND(tongThuNhapChuaKpi)}) rồi nhập số thưởng KPI theo quyết định cuối cùng.
                          </p>
                        </div>

                        {/* Nút thao tác nhanh */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayrollEmp({
                                ...editingPayrollEmp,
                                thuongKPI: kpiGoiYBuDuCamKet,
                              });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                            title="Điền mức bù đủ cam kết thu nhập"
                          >
                            ↺ Bù đủ cam kết ({formatVND(kpiGoiYBuDuCamKet)})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayrollEmp({
                                ...editingPayrollEmp,
                                thuongKPI: 0,
                              });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-[#E7E0D6] rounded-lg text-[11px] font-bold text-[#8D6E63] hover:text-rose-700 transition-colors shadow-2xs cursor-pointer"
                            title="Không thưởng KPI"
                          >
                            0đ
                          </button>
                        </div>
                      </div>

                      {/* Ô nhập số tiền KPI lớn */}
                      <div className="relative">
                        <input
                          type="number"
                          step="50000"
                          min="0"
                          value={editingPayrollEmp.thuongKPI !== undefined ? editingPayrollEmp.thuongKPI : kpiGoiYBuDuCamKet}
                          onChange={e => {
                            const val = e.target.value === '' ? ('' as any) : Number(e.target.value);
                            setEditingPayrollEmp({
                              ...editingPayrollEmp,
                              thuongKPI: val,
                            });
                          }}
                          className="w-full px-4 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-base font-mono font-black text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-inner"
                          placeholder={kpiGoiYBuDuCamKet.toString()}
                        />
                      </div>

                      {/* DỰ KIẾN KẾT QUẢ SAU KHI ĐIỀN KPI */}
                      <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                          <div className="bg-[#FAF7F0] p-2.5 rounded-lg border border-[#E7E0D6]">
                            <span className="text-[10px] text-[#8D6E63] font-bold block">Tổng Gross dự kiến:</span>
                            <span className="font-mono font-bold text-xs text-[#4E342E]">
                              {formatVND(tongGrossDuKien)}
                            </span>
                          </div>

                          <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-200">
                            <span className="text-[10px] text-rose-700 font-bold block">Khấu trừ BHXH (10.5%):</span>
                            <span className="font-mono font-bold text-xs text-rose-700">
                              {isCoDongBHXH ? \`-\${formatVND(bhxhCaNhanDuKien)}\` : '0 đ (Không đóng)'}
                            </span>
                          </div>

                          <div className="bg-emerald-100/80 p-2.5 rounded-lg border-2 border-emerald-400">
                            <span className="text-[10px] text-emerald-900 font-black block">THỰC LĨNH CHUYỂN KHOẢN:</span>
                            <span className="font-mono font-black text-base text-emerald-950">
                              {formatVND(thucLinhDuKien)}
                            </span>
                          </div>
                        </div>

                        {isOverridden && (
                          <p className="text-[10px] text-amber-800 text-center font-semibold italic">
                            (Đã tự quyết định: {currentKpi > kpiGoiYBuDuCamKet ? 'Tăng +' : 'Giảm -'}{formatVND(Math.abs(currentKpi - kpiGoiYBuDuCamKet))} so với mức bù đủ gói cam kết)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Footer Modal Actions */}
              <div className="pt-4 border-t border-[#E7E0D6] flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] text-[#8D6E63] italic">
                  💡 Nhấn "Lưu & Tính Lại Lương" để áp dụng ngay toàn bộ các số liệu vừa chỉnh sửa.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPayrollModal(false)}
                    className="px-4 py-2.5 bg-[#EFEBE0] hover:bg-[#E2DACB] text-[#5D4037] rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#8D6E63] hover:bg-[#6D4C41] text-white rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Save size={16} />
                    <span>Lưu & Tính Lại Lương</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      `;

code = code.slice(0, startIndex) + newModalCode + code.slice(endIndex);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Updated edit modal successfully with 5 scientific blocks and all numbers editable!');
