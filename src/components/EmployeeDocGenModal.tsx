import { useState } from 'react';
import { X, Download, FolderOpen, ExternalLink } from 'lucide-react';
import type { EmployeeProfile } from '../types/hr';
import {
  generateLaborContractDoc,
  generateAppointmentDoc,
  generateNDATrainingDoc,
  generateSalaryNoticeDoc,
  downloadWordDocument,
  toNonAccentVietnamese,
} from '../utils/generateEmployeeDocs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile | null;
  onUpdateEmployee?: (updated: EmployeeProfile) => void;
}

type DocType = 'contract' | 'appointment' | 'nda' | 'salary';

export default function EmployeeDocGenModal({ isOpen, onClose, employee, onUpdateEmployee }: Props) {
  const [selectedDoc, setSelectedDoc] = useState<DocType>('contract');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [driveFolderInput, setDriveFolderInput] = useState(employee?.driveFolderUrl || '');

  if (!isOpen || !employee) return null;

  const cleanName = toNonAccentVietnamese(employee.hoTen);
  const maNV = employee.maNV;

  // 4 Văn bản tương ứng
  const docsConfig = [
    {
      id: 'contract' as DocType,
      title: '1. Hợp Đồng Lao Động (12 tháng)',
      shortTitle: 'Hợp Đồng Lao Động',
      filename: `01_HOP_DONG_LAO_DONG_${maNV}_${cleanName}`,
      description: 'Hợp đồng lao động chuẩn Bộ LĐ-TB&XH, ghi rõ lương cơ bản đóng BHXH và điều khoản làm việc.',
      icon: '📝',
      getContent: () => generateLaborContractDoc(employee),
    },
    {
      id: 'appointment' as DocType,
      title: '2. Quyết Định Tiếp Nhận & Xếp Lương',
      shortTitle: 'Quyết Định Tiếp Nhận',
      filename: `02_QUYET_DINH_TIEP_NHAN_${maNV}_${cleanName}`,
      description: 'Quyết định bổ nhiệm vào vị trí, đơn vị công tác và xếp ngạch bậc lương theo quy chế 06.',
      icon: '🏛️',
      getContent: () => generateAppointmentDoc(employee),
    },
    {
      id: 'nda' as DocType,
      title: '3. Cam Kết Đào Tạo & Bảo Mật (NDA)',
      shortTitle: 'Cam Kết Đào Tạo & NDA',
      filename: `03_CAM_KET_DAO_TAO_VA_BAO_MAT_NDA_${maNV}_${cleanName}`,
      description: 'Cam kết thời gian phục vụ sau đào tạo DDS và bảo mật thông tin khách hàng Care Passport.',
      icon: '🔒',
      getContent: () => generateNDATrainingDoc(employee),
    },
    {
      id: 'salary' as DocType,
      title: '4. Phiếu Báo Lương & Đãi Ngộ CBNV',
      shortTitle: 'Phiếu Báo Lương',
      filename: `04_PHIEU_BAO_LUONG_DAI_NGO_${maNV}_${cleanName}`,
      description: 'Phiếu báo thu nhập, lương hiệu suất bù gói 10tr và trích trừ BHXH 10.5%.',
      icon: '💼',
      getContent: () => generateSalaryNoticeDoc(employee),
    },
  ];

  const currentDocObj = docsConfig.find(d => d.id === selectedDoc) || docsConfig[0];
  const currentHtmlContent = currentDocObj.getContent();

  // Tải 1 file
  const handleDownloadSingle = (docId: DocType) => {
    const doc = docsConfig.find(d => d.id === docId);
    if (!doc) return;
    downloadWordDocument(doc.filename, doc.getContent());
  };

  // Tải trọn bộ 4 file
  const handleDownloadAll = () => {
    setIsDownloadingAll(true);
    docsConfig.forEach((doc, index) => {
      setTimeout(() => {
        downloadWordDocument(doc.filename, doc.getContent());
        if (index === docsConfig.length - 1) {
          setIsDownloadingAll(false);
        }
      }, index * 400);
    });
  };

  // Lưu link folder Drive nếu có thay đổi
  const handleSaveDriveLink = () => {
    if (onUpdateEmployee && driveFolderInput.trim()) {
      onUpdateEmployee({
        ...employee,
        driveFolderUrl: driveFolderInput.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-[#E7E0D6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* HEADER MODAL */}
        <div className="p-5 border-b border-[#E7E0D6] bg-gradient-to-r from-[#FAF7F0] to-[#F5F0E6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8D6E63] text-white flex items-center justify-center font-black shadow-xs text-xl">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#4E342E]">
                  Tự Sinh Bộ Hồ Sơ Word Chuẩn Hóa
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Google Drive Ready
                </span>
              </div>
              <p className="text-xs text-[#8D6E63] mt-0.5">
                Nhân sự: <strong className="text-[#4E342E]">{employee.hoTen}</strong> · Mã: <span className="font-mono font-bold text-amber-900">{employee.maNV}</span> · Vị trí: {employee.chucVuLabel} ({employee.chiNhanhTen})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/80 text-[#8D6E63] hover:text-[#4E342E] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* THÔNG BÁO VỀ LINK DRIVE & NÚT TẢI TOÀN BỘ */}
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-amber-950">
            <FolderOpen size={16} className="text-amber-800 shrink-0" />
            <span>
              Thư mục Google Drive:{' '}
              {employee.driveFolderUrl ? (
                <a
                  href={employee.driveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-amber-900 hover:text-amber-950 inline-flex items-center gap-1"
                >
                  <span>Mở Thư Mục Hồ Sơ Trên Drive</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="italic text-[#8D6E63]">Chưa gắn link thư mục Drive</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download size={14} />
              <span>{isDownloadingAll ? 'Đang Tải...' : '📦 Tải Trọn Bộ 4 File Word (.doc)'}</span>
            </button>

            {employee.driveFolderUrl && (
              <a
                href={employee.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <FolderOpen size={14} />
                <span>Mở Drive</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* BODY: SIDEBAR CHỌN FILE + PREVIEW NỘI DUNG */}
        <div className="grid grid-cols-1 md:grid-cols-12 grow overflow-hidden">
          {/* CỘT TRÁI: DANH SÁCH 4 FILE WORD */}
          <div className="md:col-span-4 border-r border-[#E7E0D6] bg-[#FAF7F0] p-4 space-y-2.5 overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8D6E63] px-1">
              Bộ 4 Văn Bản Pháp Lý Chuẩn Hóa
            </p>

            {docsConfig.map(doc => {
              const isSelected = selectedDoc === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#8D6E63] shadow-md ring-2 ring-[#8D6E63]/20'
                      : 'bg-white/60 hover:bg-white border-[#E7E0D6] hover:border-[#8D6E63]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#4E342E]">
                      <span className="text-base">{doc.icon}</span>
                      <span>{doc.shortTitle}</span>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8D6E63] mt-1.5 line-clamp-2">
                    {doc.description}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-[#F0EAE1] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#A1887F]">.doc Microsoft Word</span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDownloadSingle(doc.id);
                      }}
                      className="px-2 py-1 bg-[#FAF7F0] hover:bg-[#8D6E63] hover:text-white text-[#5D4037] text-[10px] font-bold rounded-lg border border-[#E7E0D6] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={10} />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Ô GẮN LINK FOLDER DRIVE (NẾU CHƯA CÓ HOẶC MUỐN ĐỔI) */}
            <div className="mt-4 p-3.5 bg-white rounded-2xl border border-[#E7E0D6] space-y-2">
              <label className="block text-[11px] font-bold text-[#4E342E]">
                🔗 Cập nhật Link Thư Mục Google Drive:
              </label>
              <input
                type="url"
                value={driveFolderInput}
                onChange={e => setDriveFolderInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-2.5 py-1.5 bg-[#FDFBF7] border border-[#E7E0D6] rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-[#8D6E63]"
              />
              <button
                type="button"
                onClick={handleSaveDriveLink}
                className="w-full py-1.5 bg-[#FAF7F0] hover:bg-[#EFEBE0] text-[#4E342E] text-[11px] font-bold rounded-xl border border-[#E7E0D6] transition-colors"
              >
                Lưu Link Drive Cho {employee.hoTen}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: XEM TRƯỚC (PREVIEW) NỘI DUNG VĂN BẢN WORD */}
          <div className="md:col-span-8 p-4 flex flex-col overflow-hidden bg-[#F5F2EB]/50">
            {/* Toolbar xem trước */}
            <div className="bg-white rounded-2xl px-4 py-2.5 border border-[#E7E0D6] mb-3 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentDocObj.icon}</span>
                <span className="font-bold text-xs text-[#4E342E] truncate max-w-md">
                  {currentDocObj.title}
                </span>
              </div>
              <button
                onClick={() => handleDownloadSingle(selectedDoc)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Download size={13} />
                <span>Tải File Word Này (.doc)</span>
              </button>
            </div>

            {/* Khung tài liệu giấy A4 phong cách Word */}
            <div className="grow overflow-y-auto bg-white rounded-2xl border border-[#E7E0D6] p-6 shadow-inner">
              <div
                className="prose prose-sm max-w-none text-black font-serif"
                dangerouslySetInnerHTML={{ __html: currentHtmlContent }}
              />
            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="p-4 border-t border-[#E7E0D6] bg-[#FAF7F0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#8D6E63] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Quy trình 3 bước: <strong>1. Bấm Tải trọn bộ 4 file</strong> &rarr; <strong>2. Bấm Mở Thư Mục Drive</strong> &rarr; <strong>3. Kéo thả file vào thư mục nhân viên</strong>.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#FAF7F0] hover:bg-[#EFEBE0] text-[#5D4037] border border-[#E7E0D6] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
}
