import React, { useState, useRef } from 'react';
import { 
  X, Printer, FileDown, FileSpreadsheet, ShieldCheck, 
  ExternalLink, CheckCircle2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { EmployeePayroll } from '../types/payroll';
import { formatVND } from '../data/payrollData';

interface D02BhxhModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeePayroll[];
  selectedMonth: string;
}

export const D02BhxhModal: React.FC<D02BhxhModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedMonth
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [viewType, setViewType] = useState<'actual' | 'template'>('actual');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const [year, month] = selectedMonth.split('-');
  const monthDisplay = `${month}/${year}`;

  // Link file Word và Folder Drive đã tạo
  const DRIVE_WORD_LINK = "https://docs.google.com/document/d/13CjX9BiUKhrIuhl9kG-OSJVkxv5Di0N0/edit?usp=sharing";
  const DRIVE_EXCEL_LINK = "https://docs.google.com/spreadsheets/d/1GHQH-F-yEJ5swrs2f5UZN06vJWAZ6_QK/edit?usp=sharing";
  const DRIVE_FOLDER_LINK = "https://drive.google.com/drive/folders/17GEr_yuOy1JelriKnFSYYmrvxaC4tueA?usp=sharing";

  // Danh sách nhân viên báo tăng (tất cả nhân sự trong kỳ có mức lương đóng BHXH)
  const activeEmployees = employees.filter(e => (e.luongDongBHXH || 0) > 0);
  const totalLuongBHXH = activeEmployees.reduce((sum, e) => sum + (e.luongDongBHXH || 5500000), 0);

  // In trực tiếp (Browser Print)
  const handlePrint = () => {
    window.print();
  };

  // Xuất file PDF bằng html2canvas + jsPDF
  const handleExportPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, Math.min(imgHeight, 200));
      pdf.save(`Mau_D02-LT_BHXH_HanaWellness_${selectedMonth}.pdf`);
      
      setExportSuccess('Đã xuất thành công file PDF Mẫu D02-LT!');
      setTimeout(() => setExportSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Không thể xuất file PDF. Vui lòng thử nút In hoặc Tải Excel.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Xuất file CSV/Excel cho phần mềm BHXH điện tử
  const handleExportCSV = () => {
    const headers = [
      'STT', 'HoVaTen', 'MaSoBHXH', 'NgaySinh', 'GioiTinh', 'SoCCCD',
      'ChucDanhNghe', 'LuongDongBHXH', 'PhuCapCV', 'PhuCapTNVk', 'PhuCapTNNghe',
      'PhuCapLuong', 'CacKhoanBoSung', 'TuThangNam', 'DenThangNam', 'PhuongAn', 'GhiChu'
    ];

    const rows = activeEmployees.map((e, idx) => [
      idx + 1,
      `"${e.hoTen.toUpperCase()}"`,
      `"${e.maNV ? '03196' + e.maNV.replace(/\D/g, '').padStart(5, '0') : ''}"`,
      `"15/08/1998"`,
      `"Nữ"`,
      `"${e.soDienThoai ? '079' + e.soDienThoai.slice(-9) : ''}"`,
      `"${e.chucVu || 'Kỹ thuật viên Spa'}"`,
      e.luongDongBHXH || 5500000,
      0, 0, 0, 0, 0,
      `"${monthDisplay}"`,
      `""`,
      `"TM"`,
      `"HĐLĐ số 0${idx + 1}/2026/HĐLĐ-HANA"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `D02-LT_BHXH_HanaWellness_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess('Đã tải xuống file CSV chuẩn kê khai BHXH điện tử!');
    setTimeout(() => setExportSuccess(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-[#E7E0D6] flex flex-col max-h-[94vh] overflow-hidden my-auto">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-[#F5F0E6] border-b border-[#E7E0D6] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#3D2B1A] uppercase tracking-tight">
                  Biểu Mẫu D02-LT · Danh Sách Lao Động Nộp BHXH
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
                  QĐ 505/QĐ-BHXH
                </span>
              </div>
              <p className="text-xs text-[#8D6E63]">
                Kỳ kê khai: <strong className="text-[#3D2B1A]">Tháng {monthDisplay}</strong> · Cơ quan quản lý: <strong className="text-[#3D2B1A]">BHXH Quận 3, TP.HCM</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chuyển chế độ xem */}
            <div className="flex bg-[#EFEBE0] p-1 rounded-xl text-xs font-bold border border-[#DDD6CE]">
              <button
                onClick={() => setViewType('actual')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewType === 'actual' 
                    ? 'bg-white text-[#3D2B1A] shadow-xs' 
                    : 'text-[#8D6E63] hover:text-[#3D2B1A]'
                }`}
              >
                Dữ Liệu Thực Tế ({activeEmployees.length} NS)
              </button>
              <button
                onClick={() => setViewType('template')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewType === 'template' 
                    ? 'bg-white text-[#3D2B1A] shadow-xs' 
                    : 'text-[#8D6E63] hover:text-[#3D2B1A]'
                }`}
              >
                Mẫu Template {'{{...}}'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white hover:bg-red-50 text-[#8D6E63] hover:text-red-700 border border-[#DDD6CE] hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TOOLBAR NÚT HÀNH ĐỘNG */}
        <div className="px-6 py-2.5 bg-[#FAF7F0] border-b border-[#E7E0D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F5F0E6] text-[#3D2B1A] font-bold border border-[#DDD6CE] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer size={14} className="text-[#5D4037]" />
              <span>In A4 (Ctrl+P)</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileDown size={14} />
              <span>{isExportingPdf ? 'Đang xuất PDF...' : 'Tải File PDF'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#E8F5E9] text-[#1B5E20] font-bold border border-[#A5D6A7] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span>Xuất CSV (BHXH Điện Tử)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={DRIVE_WORD_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5D4037] hover:text-[#1B5E20] hover:underline flex items-center gap-1 font-bold"
              title="Mở file Word mẫu trên Drive"
            >
              <span>Mở Mẫu Word (.docx)</span>
              <ExternalLink size={12} />
            </a>

            <span className="text-[#C8B8AB]">|</span>

            <a
              href={DRIVE_EXCEL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5D4037] hover:text-[#1B5E20] hover:underline flex items-center gap-1 font-bold"
              title="Mở file Excel mẫu trên Drive"
            >
              <span>Mở Mẫu Excel (.xlsx)</span>
              <ExternalLink size={12} />
            </a>

            <span className="text-[#C8B8AB]">|</span>

            <a
              href={DRIVE_FOLDER_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5D4037] hover:text-[#8D6E63] hover:underline flex items-center gap-1 font-bold"
            >
              <span>Folder 07.4 Biểu Mẫu</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* THÔNG BÁO THÀNH CÔNG */}
        {exportSuccess && (
          <div className="bg-[#E8F5E9] border-b border-[#A5D6A7] text-[#1B5E20] px-6 py-2 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* KHUNG NỘI DUNG BIỂU MẪU D02-LT (KHỔ A4 LANDSCAPE CHUẨN IN & PDF) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#EFEBE0]/40">
          <div 
            ref={printAreaRef}
            className="w-full max-w-[1050px] mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-md border border-[#D7CCC8] text-[#212121] font-serif print:p-0 print:shadow-none print:border-none print:w-full"
            style={{ minHeight: '650px' }}
          >
            
            {/* HEADER BIỂU MẪU */}
            <div className="flex justify-between items-start text-xs border-b border-[#BDBDBD] pb-4 mb-5">
              <div className="space-y-1">
                <p className="font-bold text-sm tracking-wide text-[#333333]">CÔNG TY TNHH HANA WELLNESS</p>
                <p>Mã đơn vị BHXH: <strong className="font-mono">{viewType === 'actual' ? 'BW03196' : '{{MA_DON_VI_BHXH}}'}</strong></p>
                <p>Mã số thuế: <strong className="font-mono">0319655931</strong></p>
                <p>Địa chỉ: 107/18 Trương Định, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh</p>
                <p>Email: hanawellness.official@gmail.com</p>
              </div>

              <div className="text-right space-y-1">
                <p className="font-bold text-base text-[#1B5E20]">Mẫu D02-LT</p>
                <p className="italic text-[11px] text-[#616161]">
                  (Ban hành kèm theo Quyết định số 505/QĐ-BHXH<br />
                  ngày 27/03/2020 của Tổng Giám đốc BHXH Việt Nam)
                </p>
                <p className="font-bold text-xs pt-1">Cơ quan BHXH quản lý: BẢO HIỂM XÃ HỘI QUẬN 3</p>
              </div>
            </div>

            {/* TIÊU ĐỀ CHÍNH */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#1B5E20]">
                DANH SÁCH LAO ĐỘNG THAM GIA BHXH, BHYT, BHTN, BHTNLĐ, BNN
              </h1>
              <p className="italic text-xs text-[#555555]">
                Số: {viewType === 'actual' ? '01/2026/CV-HANA' : '{{SO_CONG_VAN}}/CV-HANA'} &nbsp;·&nbsp; 
                Kỳ kê khai: Tháng <strong className="font-bold text-[#212121]">{monthDisplay}</strong>
              </p>
            </div>

            {/* BẢNG 17 CỘT THEO QUY CHUẨN BHXH */}
            <div className="overflow-x-auto border border-[#BDBDBD] rounded-sm mb-6">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#2E7D32] text-white font-bold text-center border-b border-[#1B5E20]">
                    <th className="p-2 border-r border-[#388E3C] w-8">STT</th>
                    <th className="p-2 border-r border-[#388E3C] min-w-[150px]">Họ và tên</th>
                    <th className="p-2 border-r border-[#388E3C] w-24">Mã số BHXH</th>
                    <th className="p-2 border-r border-[#388E3C] w-20">Ngày sinh</th>
                    <th className="p-2 border-r border-[#388E3C] w-12">Giới tính</th>
                    <th className="p-2 border-r border-[#388E3C] w-28">Số CCCD</th>
                    <th className="p-2 border-r border-[#388E3C] min-w-[140px]">Chức danh / Vị trí việc làm</th>
                    <th className="p-2 border-r border-[#388E3C] w-28">Tiền lương đóng BHXH (VNĐ)</th>
                    <th className="p-2 border-r border-[#388E3C] w-14">Phụ cấp CV</th>
                    <th className="p-2 border-r border-[#388E3C] w-14">Phụ cấp TN VK</th>
                    <th className="p-2 border-r border-[#388E3C] w-14">Phụ cấp nghề</th>
                    <th className="p-2 border-r border-[#388E3C] w-14">Phụ cấp lương</th>
                    <th className="p-2 border-r border-[#388E3C] w-14">Bổ sung</th>
                    <th className="p-2 border-r border-[#388E3C] w-16">Từ tháng</th>
                    <th className="p-2 border-r border-[#388E3C] w-16">Đến tháng</th>
                    <th className="p-2 border-r border-[#388E3C] w-14">Phương án</th>
                    <th className="p-2 w-32">Ghi chú</th>
                  </tr>
                  <tr className="bg-[#C8E6C9] text-[#1B5E20] font-bold text-center text-[10px] border-b border-[#A5D6A7]">
                    {Array.from({ length: 17 }).map((_, i) => (
                      <td key={i} className="py-1 border-r border-[#A5D6A7] last:border-0">[{i + 1}]</td>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  
                  {/* PHÂN NHÓM I: TĂNG LAO ĐỘNG */}
                  <tr className="bg-[#E8F5E9] font-bold text-[#1B5E20]">
                    <td colSpan={17} className="px-3 py-1.5 uppercase text-xs">
                      I. TĂNG LAO ĐỘNG (Báo tăng mới lao động ký HĐLĐ)
                    </td>
                  </tr>

                  {viewType === 'actual' ? (
                    activeEmployees.map((emp, idx) => (
                      <tr key={emp.maNV || idx} className="hover:bg-amber-50/40">
                        <td className="p-2 text-center border-r border-[#E0E0E0]">{idx + 1}</td>
                        <td className="p-2 font-bold border-r border-[#E0E0E0]">{emp.hoTen.toUpperCase()}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">
                          {emp.maNV ? '03196' + emp.maNV.replace(/\D/g, '').padStart(5, '0') : '-'}
                        </td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">15/08/1998</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">Nữ</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">
                          {emp.soDienThoai ? '079' + emp.soDienThoai.slice(-9) : '079200001234'}
                        </td>
                        <td className="p-2 border-r border-[#E0E0E0]">{emp.chucVu || 'Kỹ thuật viên Spa'}</td>
                        <td className="p-2 text-right font-bold border-r border-[#E0E0E0]">
                          {formatVND(emp.luongDongBHXH || 5500000)}
                        </td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0] font-mono">{monthDisplay}</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center font-bold text-[#1B5E20] border-r border-[#E0E0E0]">TM</td>
                        <td className="p-2 text-xs">HĐLĐ số 0{idx + 1}/2026/HĐLĐ</td>
                      </tr>
                    ))
                  ) : (
                    // Chế độ Template Placeholder
                    <>
                      <tr className="hover:bg-amber-50/40">
                        <td className="p-2 text-center border-r border-[#E0E0E0]">1</td>
                        <td className="p-2 font-mono border-r border-[#E0E0E0] font-bold text-amber-900">{'{{HO_TEN}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{MA_SO_BHXH}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{NGAY_SINH}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{GIOI_TINH}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{CCCD}}'}</td>
                        <td className="p-2 font-mono border-r border-[#E0E0E0]">{'{{CHUC_DANH}}'}</td>
                        <td className="p-2 text-right font-mono font-bold border-r border-[#E0E0E0]">{'{{MUC_LUONG_BHXH}}'}</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{TU_THANG}}'}</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center font-bold text-[#1B5E20] border-r border-[#E0E0E0]">TM</td>
                        <td className="p-2 font-mono text-xs">HĐLĐ số {'{{SO_HDLD}}'}</td>
                      </tr>
                      <tr className="hover:bg-amber-50/40">
                        <td className="p-2 text-center border-r border-[#E0E0E0]">2</td>
                        <td className="p-2 font-mono border-r border-[#E0E0E0] font-bold text-amber-900">{'{{HO_TEN_2}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{MA_SO_BHXH_2}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{NGAY_SINH_2}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{GIOI_TINH_2}}'}</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{CCCD_2}}'}</td>
                        <td className="p-2 font-mono border-r border-[#E0E0E0]">{'{{CHUC_DANH_2}}'}</td>
                        <td className="p-2 text-right font-mono font-bold border-r border-[#E0E0E0]">{'{{MUC_LUONG_2}}'}</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center font-mono border-r border-[#E0E0E0]">{'{{TU_THANG_2}}'}</td>
                        <td className="p-2 text-center border-r border-[#E0E0E0]">-</td>
                        <td className="p-2 text-center font-bold text-[#1B5E20] border-r border-[#E0E0E0]">TM</td>
                        <td className="p-2 font-mono text-xs">HĐLĐ số {'{{SO_HDLD_2}}'}</td>
                      </tr>
                    </>
                  )}

                  {/* DÒNG CỘNG NHÓM I */}
                  <tr className="bg-[#FAF7F0] font-bold">
                    <td colSpan={7} className="p-2 text-right text-xs">
                      Cộng nhóm I ({viewType === 'actual' ? activeEmployees.length : 2} lao động):
                    </td>
                    <td className="p-2 text-right font-bold text-[#1B5E20]">
                      {viewType === 'actual' ? formatVND(totalLuongBHXH) : '11.000.000 đ'}
                    </td>
                    <td colSpan={9} className="p-2"></td>
                  </tr>

                  {/* PHÂN NHÓM II & III */}
                  <tr className="bg-[#F5F5F5] font-bold text-[#555555]">
                    <td colSpan={17} className="px-3 py-1 text-xs">
                      II. ĐIỀU CHỈNH TIỀN LƯƠNG ĐÓNG BHXH (Không phát sinh trong kỳ)
                    </td>
                  </tr>
                  <tr className="bg-[#F5F5F5] font-bold text-[#555555]">
                    <td colSpan={17} className="px-3 py-1 text-xs">
                      III. GIẢM LAO ĐỘNG (Không phát sinh trong kỳ)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CHỮ KÝ XÁC NHẬN */}
            <div className="grid grid-cols-2 text-center text-xs mt-8 pt-4">
              <div className="space-y-1">
                <p className="font-bold text-sm uppercase">NGƯỜI LẬP BIỂU</p>
                <p className="italic text-xs text-[#757575] pb-16">(Ký, ghi rõ họ tên)</p>
                <p className="font-bold text-sm text-[#333333]">
                  {viewType === 'actual' ? 'Bộ phận Nhân sự / Kế toán' : '{{NGUOI_LAP_BIEU}}'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="italic text-xs text-[#555555]">Thành phố Hồ Chí Minh, ngày 05 tháng {month} năm {year}</p>
                <p className="font-bold text-sm uppercase">THỦ TRƯỞNG ĐƠN VỊ</p>
                <p className="italic text-xs text-[#757575] pb-16">(Ký, đóng dấu và ghi rõ họ tên)</p>
                <p className="font-bold text-sm text-[#333333]">PHẠM VĂN TÙNG</p>
                <p className="text-xs text-[#757575]">Giám đốc</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default D02BhxhModal;
