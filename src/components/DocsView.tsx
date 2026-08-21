import React, { useState } from 'react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';
import { ExternalLink, FileText } from 'lucide-react';
import EditModal from './EditModal';

const DocsView: React.FC = () => {
  const { docs } = useHana();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-amber-800" size={24} />
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Văn bản Nội bộ & Quy chế</h1>
          </div>
          <p className="text-[#8D6E63] mt-1">Quản lý điều lệ, nội quy lao động, thang bảng lương & quy chế tài chính</p>
        </div>

        <a
          href={DRIVE_LINKS.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-4 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-200 transition-colors text-sm shadow-sm"
        >
          <ExternalLink size={16} /> File Gốc Google Sheets
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E8E6E1] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F5F0E6]">
              <tr className="border-b border-[#E8E6E1] text-[#8D6E63] text-sm uppercase tracking-wider font-bold">
                <th className="py-4 px-5">Tên văn bản</th>
                <th className="py-4 px-5">Nhóm quy định</th>
                <th className="py-4 px-5">Cấp độ</th>
                <th className="py-4 px-5">Phòng ban</th>
                <th className="py-4 px-5">Trạng thái</th>
                <th className="py-4 px-5">Hạn chót</th>
              </tr>
            </thead>
            <tbody className="text-[#3D2B1A]">
              {docs.map(doc => (
                <tr 
                  key={doc.id} 
                  onClick={() => setSelectedItem(doc)}
                  className="border-b border-[#E8E6E1] last:border-0 hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-5 font-bold max-w-md">
                    <div title={doc.title}>{doc.title}</div>
                    {doc.note && <div className="text-xs text-[#8D6E63] font-normal truncate mt-0.5">{doc.note}</div>}
                  </td>
                  <td className="py-3.5 px-5 text-sm text-[#5D4037]">{doc.group}</td>
                  <td className="py-3.5 px-5 text-sm">
                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold">
                      {doc.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-sm">{doc.department}</td>
                  <td className="py-3.5 px-5">
                    <span className={"px-2.5 py-1 text-xs rounded-full font-bold " + (["Đã ban hành", "Hoàn thành"].includes(doc.status) ? "bg-[#D4EDDA] text-[#155724]" : ["Đang soạn thảo"].includes(doc.status) ? "bg-[#D1ECF1] text-[#0C5460]" : "bg-[#FFF3CD] text-[#856404]")}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-sm font-medium whitespace-nowrap">{doc.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <EditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default DocsView;
