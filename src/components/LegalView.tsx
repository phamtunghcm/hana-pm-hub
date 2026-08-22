import React, { useState } from 'react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';
import { ExternalLink, Scale } from 'lucide-react';
import EditModal from './EditModal';

const LegalView: React.FC = () => {
  const { legal } = useHana();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="text-amber-800" size={24} />
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Hồ sơ Pháp lý & Thủ tục</h1>
          </div>
          <p className="text-[#8D6E63] mt-1">Quản lý giấy phép kép, PCCC, ANTT & đăng ký vận hành</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DRIVE_LINKS.legalSheet}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Bảng quản lý chung ANTT, PCCC"
          >
            <ExternalLink size={14} className="text-emerald-700" /> Bảng Quản Lý ANTT & PCCC
          </a>
          <a
            href={DRIVE_LINKS.legalPcccFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Folder hồ sơ PCCC (>100m2)"
          >
            <ExternalLink size={14} className="text-red-600" /> Folder Hồ Sơ PCCC
          </a>
          <a
            href={DRIVE_LINKS.legalAnttFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#F5F0E6] text-[#3D2B1A] font-bold px-3.5 py-2 rounded-xl border border-[#E7E0D6] hover:bg-amber-100 transition-colors text-xs shadow-xs"
            title="Folder hồ sơ ANTT"
          >
            <ExternalLink size={14} className="text-blue-600" /> Folder Hồ Sơ ANTT
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {legal.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={"px-2.5 py-1 text-xs rounded-full font-bold " + (["Đã hoàn thành", "Hoàn thành"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" : ["Đã chuẩn bị"].includes(item.status) ? "bg-[#FFF3CD] text-[#856404]" : "bg-[#E2E3E5] text-[#383D41]")}>
                  {item.status}
                </span>
                <span className="text-xs text-amber-800 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Sửa →
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#3D2B1A] mb-4 group-hover:text-amber-800 transition-colors" title={item.title}>
                {item.title}
              </h3>
            </div>
            
            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8D6E63]">Cơ quan thụ lý:</span>
                <span className="font-bold text-[#3D2B1A]">{item.agency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8D6E63]">Thời gian dự kiến:</span>
                <span className="font-bold text-[#3D2B1A]">{item.timeEstimate}</span>
              </div>
              {item.note && (
                <div className="pt-2 text-xs text-[#8D6E63] italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                  "{item.note}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <EditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default LegalView;
