import React, { useState, useMemo } from 'react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';
import { 
  ExternalLink, Scale, Search, LayoutGrid, List,
  UserCheck, Landmark, Flame, ShieldCheck, Users, MapPin, Building2, Leaf, Globe,
  ChevronDown, ChevronUp, ChevronsUpDown, CheckCircle2, Clock
} from 'lucide-react';
import EditModal from './EditModal';

// Ánh xạ icon theo chủ đề
const getTopicIcon = (groupName: string) => {
  if (groupName.includes('ĐKKD') || groupName.includes('NĐDPL')) return <UserCheck className="text-amber-800 flex-shrink-0" size={20} />;
  if (groupName.includes('Thuế') || groupName.includes('Ngân hàng')) return <Landmark className="text-blue-800 flex-shrink-0" size={20} />;
  if (groupName.includes('PCCC') || groupName.includes('cháy')) return <Flame className="text-red-700 flex-shrink-0" size={20} />;
  if (groupName.includes('ANTT') || groupName.includes('An ninh')) return <ShieldCheck className="text-emerald-800 flex-shrink-0" size={20} />;
  if (groupName.includes('Nhân sự') || groupName.includes('KTV')) return <Users className="text-purple-800 flex-shrink-0" size={20} />;
  if (groupName.includes('Công an') || groupName.includes('Lưu trú')) return <MapPin className="text-indigo-800 flex-shrink-0" size={20} />;
  if (groupName.includes('Biển hiệu') || groupName.includes('Y tế')) return <Building2 className="text-teal-800 flex-shrink-0" size={20} />;
  if (groupName.includes('Môi trường') || groupName.includes('ATTP')) return <Leaf className="text-green-800 flex-shrink-0" size={20} />;
  if (groupName.includes('Website')) return <Globe className="text-sky-800 flex-shrink-0" size={20} />;
  return <Scale className="text-amber-800 flex-shrink-0" size={20} />;
};

const LegalView: React.FC = () => {
  const { legal } = useHana();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Trạng thái thu gọn/mở rộng từng chủ đề
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});

  // Danh sách chủ đề duy nhất
  const topics = useMemo(() => {
    const list = Array.from(new Set(legal.map(item => (item as any).group || 'Khác'))).filter(Boolean);
    return list;
  }, [legal]);

  // Gom nhóm dữ liệu theo từng chủ đề
  const groupedData = useMemo(() => {
    // 1. Phân loại toàn bộ legal theo group
    const map: Record<string, any[]> = {};
    topics.forEach(t => { map[t] = []; });

    legal.forEach(item => {
      const g = (item as any).group || 'Khác';
      if (!map[g]) map[g] = [];
      map[g].push(item);
    });

    // 2. Lọc theo search, topic và status
    return topics.map(topicName => {
      const itemsInTopic = map[topicName] || [];
      const totalInTopic = itemsInTopic.length;
      const completedInTopic = itemsInTopic.filter(i => ['Đã hoàn thành', 'Hoàn thành'].includes(i.status)).length;

      // Lọc items
      const filtered = itemsInTopic.filter(item => {
        if (selectedTopic !== 'all' && topicName !== selectedTopic) return false;
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

      return {
        topicName,
        totalInTopic,
        completedInTopic,
        items: filtered,
        isVisible: selectedTopic === 'all' || selectedTopic === topicName
      };
    }).filter(group => group.isVisible && (group.items.length > 0 || (!searchQuery && statusFilter === 'all' && selectedTopic === group.topicName)));
  }, [legal, topics, selectedTopic, statusFilter, searchQuery]);

  // Toggle thu gọn 1 chủ đề
  const toggleTopic = (topicName: string) => {
    setCollapsedTopics(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  // Mở rộng tất cả hoặc thu gọn tất cả
  const allCollapsed = useMemo(() => {
    if (groupedData.length === 0) return false;
    return groupedData.every(g => !!collapsedTopics[g.topicName]);
  }, [groupedData, collapsedTopics]);

  const toggleAllTopics = () => {
    if (allCollapsed) {
      // Mở tất cả
      setCollapsedTopics({});
    } else {
      // Thu gọn tất cả
      const next: Record<string, boolean> = {};
      groupedData.forEach(g => { next[g.topicName] = true; });
      setCollapsedTopics(next);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      {/* 1. Header Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="text-amber-800" size={24} />
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Hồ sơ Pháp lý & Thủ tục Hoạt động</h1>
          </div>
          <p className="text-[#8D6E63] mt-1 text-sm">
            Phân nhóm theo 9 chủ đề chuyên môn: ĐKKD, Thuế, PCCC, ANTT, Nhân sự & Môi trường
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-[#F5F0E6] p-1 rounded-xl border border-[#E7E0D6]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'table' ? 'bg-white text-[#3D2B1A] shadow-xs' : 'text-[#8D6E63] hover:text-[#3D2B1A]'}`}
              title="Xem dạng bảng chuẩn văn bản nội bộ"
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

      {/* 2. Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8E6E1] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-8">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D6E63]" />
            <input
              type="text"
              placeholder="Tìm tên hồ sơ, cơ quan, tên file Google Drive..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm border border-[#E8E6E1] rounded-xl outline-none focus:border-amber-600 bg-[#FDFBF7] text-[#3D2B1A] font-medium"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-[#E8E6E1] rounded-xl outline-none focus:border-amber-600 bg-[#FDFBF7] text-[#3D2B1A] font-medium"
            >
              <option value="all">Tất cả trạng thái hồ sơ</option>
              <option value="Hoàn thành">Đã hoàn thành</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Chưa bắt đầu">Chưa bắt đầu</option>
            </select>
          </div>
        </div>

        {/* 3. Quick Topic Selector (Pills) */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedTopic === 'all'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'bg-[#F5F0E6] text-[#6D4C41] hover:bg-amber-100'
              }`}
            >
              <span>Tất cả chủ đề</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedTopic === 'all' ? 'bg-white/20 text-white' : 'bg-amber-200/70 text-amber-950'}`}>
                {legal.length}
              </span>
            </button>

            {topics.map(t => {
              const count = legal.filter(i => (i as any).group === t).length;
              const isSelected = selectedTopic === t;
              // Rút gọn label hiển thị trên pill
              const shortLabel = t.replace(/^\d+\.\s*/, '');
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-900 text-white shadow-xs'
                      : 'bg-[#F5F0E6] text-[#6D4C41] hover:bg-amber-100'
                  }`}
                  title={t}
                >
                  <span className="truncate max-w-[140px]">{shortLabel}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-200/70 text-amber-950'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={toggleAllTopics}
            className="flex-shrink-0 text-xs font-bold text-amber-900 hover:text-amber-950 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/70 flex items-center gap-1 transition-colors"
            title={allCollapsed ? "Mở rộng toàn bộ các chủ đề" : "Thu gọn toàn bộ các chủ đề"}
          >
            <ChevronsUpDown size={14} />
            <span className="hidden sm:inline">{allCollapsed ? 'Mở tất cả' : 'Thu gọn'}</span>
          </button>
        </div>
      </div>

      {/* 4. CONTENT AREA: GROUPED BY TOPIC */}
      <div className="space-y-6">
        {groupedData.map(group => {
          const isCollapsed = !!collapsedTopics[group.topicName];
          const percent = group.totalInTopic > 0 ? Math.round((group.completedInTopic / group.totalInTopic) * 100) : 0;

          return (
            <div 
              key={group.topicName} 
              className="bg-white rounded-2xl shadow-sm border border-[#E8E6E1] overflow-hidden transition-all"
            >
              {/* Topic Header Banner */}
              <div 
                onClick={() => toggleTopic(group.topicName)}
                className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF6F0] via-white to-[#FAF6F0] border-b border-[#E8E6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#F5EFE6]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs flex items-center justify-center">
                    {getTopicIcon(group.topicName)}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#3D2B1A] flex items-center gap-2">
                      {group.topicName}
                    </h2>
                    <div className="text-xs text-[#8D6E63] mt-0.5 flex items-center gap-3">
                      <span>Hiển thị: <b>{group.items.length}</b>/{group.totalInTopic} hồ sơ</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-800 font-bold">
                        <CheckCircle2 size={13} /> {group.completedInTopic} Hoàn thành
                      </span>
                      {group.totalInTopic - group.completedInTopic > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-800 font-bold">
                            <Clock size={13} /> {group.totalInTopic - group.completedInTopic} Chưa xong
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Collapse Toggle */}
                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-[#3D2B1A]">{percent}%</span>
                    <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          percent === 100 ? 'bg-emerald-600' : percent > 40 ? 'bg-amber-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    className="p-1.5 text-[#8D6E63] hover:text-[#3D2B1A] hover:bg-white rounded-lg transition-colors"
                    aria-label="Thu gọn hoặc mở rộng chủ đề"
                  >
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>
              </div>

              {/* Topic Content (Table or Cards) */}
              {!isCollapsed && (
                <div>
                  {viewMode === 'table' ? (
                    /* DẠNG BẢNG CHUẨN VĂN BẢN NỘI BỘ */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#FAF6F0]/80">
                          <tr className="border-b border-[#E8E6E1] text-[#8D6E63] text-xs uppercase tracking-wider font-bold">
                            <th className="py-3 px-4 w-12 text-center">STT</th>
                            <th className="py-3 px-5 w-5/12">Hồ sơ / Thủ tục chi tiết</th>
                            <th className="py-3 px-4 w-2.5/12">Cơ quan thụ lý</th>
                            <th className="py-3 px-3 w-1.5/12 text-center">Trạng thái</th>
                            <th className="py-3 px-4 w-3/12 text-right">Tài liệu Drive liên quan</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#3D2B1A] divide-y divide-gray-100">
                          {group.items.map(item => (
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
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors shadow-2xs max-w-[240px] truncate"
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
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* DẠNG THẺ CARD THEO TỪNG CHỦ ĐỀ */
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className="bg-[#FDFBF7] p-5 rounded-xl border border-[#E8E6E1] hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs font-bold text-[#8D6E63]">#{item.id}</span>
                              <span className={"px-2 py-0.5 text-[11px] rounded-full font-bold " + (
                                ["Đã hoàn thành", "Hoàn thành"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" : 
                                ["Đang thực hiện", "Đang soạn thảo", "Đã chuẩn bị"].includes(item.status) ? "bg-[#FFF3CD] text-[#856404]" : 
                                "bg-[#E2E3E5] text-[#383D41]"
                              )}>
                                {item.status}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-[#3D2B1A] mb-2 group-hover:text-amber-800 transition-colors" title={item.title}>
                              {item.title}
                            </h3>
                          </div>
                          
                          <div className="space-y-1.5 pt-3 border-t border-gray-200/60 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#8D6E63]">Cơ quan:</span>
                              <span className="font-bold text-[#3D2B1A]">{item.agency}</span>
                            </div>
                            {item.note && (
                              <div className="pt-1 text-[11px] text-[#8D6E63] italic line-clamp-2">
                                "{item.note}"
                              </div>
                            )}
                            {(item as any).fileLink && (
                              <div className="pt-2 flex justify-end" onClick={e => e.stopPropagation()}>
                                <a
                                  href={(item as any).fileLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md border border-amber-300 transition-colors max-w-full truncate"
                                  title="Mở trực tiếp trên Google Drive"
                                >
                                  <ExternalLink size={12} className="text-amber-700 flex-shrink-0" />
                                  <span className="truncate">{(item as any).fileLabel || "Mở Drive"}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {groupedData.length === 0 && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-[#E8E6E1] text-center text-[#8D6E63]">
            Không tìm thấy hồ sơ pháp lý nào phù hợp với bộ lọc tìm kiếm.
          </div>
        )}
      </div>

      {selectedItem && (
        <EditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default LegalView;
