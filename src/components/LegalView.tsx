import React, { useState, useMemo } from 'react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';
import { ExternalLink, Scale, Search, Filter, LayoutGrid, List } from 'lucide-react';
import EditModal from './EditModal';

const LegalView: React.FC = () => {
  const { legal } = useHana();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Trích xuất danh sách các nhóm công tác
  const groups = useMemo(() => {
    const list = Array.from(new Set(legal.map(item => (item as any).group || 'Khác'))).filter(Boolean);
    return list;
  }, [legal]);

  // Bộ lọc dữ liệu
  const filteredLegal = useMemo(() => {
    return legal.filter(item => {
      const g = (item as any).group || 'Khác';
      if (selectedGroup !== 'all' && g !== selectedGroup) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchAgency = item.agency?.toLowerCase().includes(query) || false;
        const matchNote = item.note?.toLowerCase().includes(query) || false;
        const matchFile = (item as any).fileLabel?.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchAgency && !matchNote && !matchFile) return false;
      }
      return true;
    });
  }, [legal, selectedGroup, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="text-amber-800" size={24} />
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Hồ sơ Pháp lý & Thủ tục Hoạt động</h1>
          </div>
          <p className="text-[#8D6E63] mt-1 text-sm">
            Quản lý 33 hồ sơ & thủ tục mở cửa Hana Wellness (ĐKKD, PCCC, ANTT, Thuế, Nhân sự & Môi trường)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-[#F5F0E6] p-1 rounded-xl border border-[#E7E0D6]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'table' ? 'bg-white text-[#3D2B1A] shadow-xs' : 'text-[#8D6E63] hover:text-[#3D2B1A]'}`}
              title="Xem dạng bảng (giống Văn bản nội bộ)"
            >
              <List size={14} /> Dạng Bảng
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'cards' ? 'bg-white text-[#3D2B1A] shadow-xs' : 'text-[#8D6E63] hover:text-[#3D2B1A]'}`}
              title="Xem dạng thẻ card"
            >
              <LayoutGrid size={14} /> Dạng Thẻ
            </button>
          </div>

          <a
            href={DRIVE_LINKS.legalSheet}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#3D2B1A] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#5D4037] transition-colors text-xs shadow-sm"
            title="Mở bảng theo dõi gốc trên Google Sheets"
          >
            <ExternalLink size={14} className="text-amber-300" /> Bảng Tiến Độ Google Sheets
          </a>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8E6E1] grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
          <input
            type="text"
            placeholder="Tìm tên hồ sơ, cơ quan, tên file..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#E8E6E1] rounded-xl outline-none focus:border-amber-600 bg-[#FDFBF7] text-[#3D2B1A] font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#8D6E63] flex-shrink-0" />
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-[#E8E6E1] rounded-xl outline-none focus:border-amber-600 bg-[#FDFBF7] text-[#3D2B1A] font-medium"
          >
            <option value="all">Tất cả nhóm hồ sơ ({legal.length})</option>
            {groups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-[#E8E6E1] rounded-xl outline-none focus:border-amber-600 bg-[#FDFBF7] text-[#3D2B1A] font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: TABLE FORMAT (CHUẨN FORMAT VĂN BẢN NỘI BỘ) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E6E1] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F5F0E6]">
                <tr className="border-b border-[#E8E6E1] text-[#8D6E63] text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-4 w-12 text-center">STT</th>
                  <th className="py-4 px-5 w-4/12">Hồ sơ / Thủ tục pháp lý</th>
                  <th className="py-4 px-4 w-2/12">Nhóm công tác</th>
                  <th className="py-4 px-4 w-2/12">Cơ quan thụ lý</th>
                  <th className="py-4 px-3 w-1.5/12 text-center">Trạng thái</th>
                  <th className="py-4 px-4 w-2.5/12 text-right">Tài liệu Drive liên quan</th>
                </tr>
              </thead>
              <tbody className="text-[#3D2B1A] divide-y divide-gray-100">
                {filteredLegal.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-[#FDFBF7] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-xs text-[#8D6E63]">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-5 font-bold">
                      <div className="text-sm group-hover:text-amber-900 transition-colors" title={item.title}>
                        {item.title}
                      </div>
                      {item.note && (
                        <div className="text-xs text-[#8D6E63] font-normal line-clamp-1 mt-0.5">
                          {item.note}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#5D4037]">
                      <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded text-[11px] font-bold">
                        {(item as any).group || 'Pháp lý'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#3D2B1A]">
                      {item.agency}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={"px-2.5 py-1 text-[11px] rounded-full font-bold inline-block " + (
                        ["Đã hoàn thành", "Hoàn thành"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" :
                        ["Đang thực hiện", "Đang soạn thảo", "Đã chuẩn bị"].includes(item.status) ? "bg-[#FFF3CD] text-[#856404]" :
                        "bg-[#E2E3E5] text-[#383D41]"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      {(item as any).fileLink ? (
                        <a
                          href={(item as any).fileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors shadow-2xs max-w-[220px] truncate"
                          title={`Mở trên Google Drive: ${(item as any).fileLabel}`}
                        >
                          <ExternalLink size={12} className="text-amber-800 flex-shrink-0" />
                          <span className="truncate">{(item as any).fileLabel || 'Mở file'}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chưa có link</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLegal.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8D6E63] text-sm">
                      Không tìm thấy hồ sơ pháp lý nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: CARDS FORMAT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLegal.map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] rounded-md font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                      {(item as any).group || "Pháp lý"}
                    </span>
                    <span className={"px-2.5 py-1 text-xs rounded-full font-bold " + (
                      ["Đã hoàn thành", "Hoàn thành"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" : 
                      ["Đang thực hiện", "Đang soạn thảo", "Đã chuẩn bị"].includes(item.status) ? "bg-[#FFF3CD] text-[#856404]" : 
                      "bg-[#E2E3E5] text-[#383D41]"
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-xs text-amber-800 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Mở / Sửa →
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#3D2B1A] mb-3 group-hover:text-amber-800 transition-colors" title={item.title}>
                  {item.title}
                </h3>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8D6E63]">Cơ quan thụ lý:</span>
                  <span className="font-bold text-[#3D2B1A]">{item.agency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8D6E63]">Thời gian:</span>
                  <span className="font-bold text-[#3D2B1A]">{item.timeEstimate}</span>
                </div>
                {item.note && (
                  <div className="pt-2 text-xs text-[#8D6E63] italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                    "{item.note}"
                  </div>
                )}
                {(item as any).fileLink && (
                  <div className="pt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={(item as any).fileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors shadow-2xs max-w-full truncate"
                      title="Mở trực tiếp tài liệu này trên Google Drive"
                    >
                      <ExternalLink size={13} className="text-amber-700 flex-shrink-0" />
                      <span className="truncate">{(item as any).fileLabel || "Mở tài liệu Drive"}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <EditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default LegalView;
