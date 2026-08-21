import React, { useState, useMemo } from 'react';
import { useHana } from '../store/HanaContext';
import { Plus } from 'lucide-react';
import EditModal from './EditModal';

const TaskListView: React.FC = () => {
  const { tasks, legal, docs, capex } = useHana();
  const [filterMacroPhase, setFilterMacroPhase] = useState('');
  const [filterSubGroup, setFilterSubGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Unified list logic with Macro Phase categorization
  const unifiedList = useMemo(() => {
    const list: any[] = [];
    
    // Helper to determine Macro Phase
    const getMacroPhase = (ws: string) => {
      if (ws.includes('Khai trương chính thức') || ws.includes('Khai trương thử nghiệm') || ws === 'Khai trương') {
        return '🎉 Khai Trương';
      } else if (ws.includes('Tháng thứ')) {
        return '🚀 Sau Khai Trương (Hậu KT)';
      }
      return '📁 Trước Khai Trương';
    };

    // Original tasks
    tasks.forEach(t => list.push({
      ...t,
      macroPhase: getMacroPhase(t.workstream),
      _raw: t
    }));
    
    // Map Legal
    legal.forEach(l => list.push({
      id: l.id, type: 'legal', title: l.title, status: l.status, note: l.note,
      workstream: 'Trước khai trương: Pháp lý & Thiết lập (>100m2)',
      macroPhase: '📁 Trước Khai Trương',
      pic: l.agency, dueDate: l.timeEstimate, priority: 'Bắt buộc', percent: 0, _raw: l
    }));

    // Map Docs
    docs.forEach(d => list.push({
      id: d.id, type: 'doc', title: d.title, status: d.status, note: d.content,
      workstream: 'Trước khai trương: Văn bản Nội bộ',
      macroPhase: '📁 Trước Khai Trương',
      pic: d.department, dueDate: d.deadline, priority: d.level, percent: 0, _raw: d
    }));

    // Map Capex
    capex.forEach(c => list.push({
      id: c.id, type: 'capex', title: c.title, status: c.status, note: c.note,
      workstream: 'Trước khai trương: Cơ sở vật chất & Mua sắm (513.74tr)',
      macroPhase: '📁 Trước Khai Trương',
      pic: 'Admin', dueDate: '', priority: 'Cần thiết', percent: 0, _raw: c
    }));

    return list;
  }, [tasks, legal, docs, capex]);

  const macroPhases = ['📁 Trước Khai Trương', '🎉 Khai Trương', '🚀 Sau Khai Trương (Hậu KT)'];

  const availableSubGroups = useMemo(() => {
    let source = unifiedList;
    if (filterMacroPhase) {
      source = source.filter(t => t.macroPhase === filterMacroPhase);
    }
    return Array.from(new Set(source.map(t => t.workstream))).filter(Boolean);
  }, [unifiedList, filterMacroPhase]);

  const statuses = Array.from(new Set(unifiedList.map(t => t.status))).filter(Boolean);

  const filteredList = unifiedList.filter(t => {
    if (filterMacroPhase && t.macroPhase !== filterMacroPhase) return false;
    if (filterSubGroup && t.workstream !== filterSubGroup) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Bảng Công việc Toàn diện</h1>
            <p className="text-[#8D6E63] text-sm mt-1">
              Được phân theo 3 Giai đoạn chính: <strong>Trước Khai Trương</strong>, <strong>Khai Trương</strong> & <strong>Sau Khai Trương</strong>
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#3D2B1A] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#5D4037] transition-colors shadow-sm"
          >
            <Plus size={18} /> Thêm Công việc
          </button>
        </div>
        
        {/* Filters (Macro Phase -> Sub Group -> Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-[#8D6E63] uppercase mb-1">1. Giai đoạn chính</label>
            <select 
              value={filterMacroPhase} 
              onChange={e => { setFilterMacroPhase(e.target.value); setFilterSubGroup(''); }}
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2 text-[#3D2B1A] bg-white outline-none focus:border-amber-500 font-bold text-sm shadow-sm"
            >
              <option value="">Tất cả Giai đoạn (Trước / KT / Sau)</option>
              {macroPhases.map(mp => <option key={mp} value={mp}>{mp}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8D6E63] uppercase mb-1">2. Nhóm chi tiết</label>
            <select 
              value={filterSubGroup} 
              onChange={e => setFilterSubGroup(e.target.value)}
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2 text-[#3D2B1A] bg-white outline-none focus:border-amber-500 text-sm shadow-sm"
            >
              <option value="">Tất cả Nhóm công việc chi tiết</option>
              {availableSubGroups.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8D6E63] uppercase mb-1">3. Trạng thái</label>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full border border-[#E8E6E1] rounded-xl px-3 py-2 text-[#3D2B1A] bg-white outline-none focus:border-amber-500 text-sm shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E8E6E1]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F5F0E6]">
              <tr className="border-b border-[#E8E6E1] text-[#8D6E63] text-xs uppercase tracking-wider font-bold">
                <th className="py-4 px-5">Giai đoạn chính</th>
                <th className="py-4 px-5">Hạng mục công việc</th>
                <th className="py-4 px-5">Trạng thái</th>
                <th className="py-4 px-5">Nhóm chi tiết</th>
                <th className="py-4 px-5">Phụ trách</th>
                <th className="py-4 px-5">Thời gian</th>
              </tr>
            </thead>
            <tbody className="text-[#3D2B1A]">
              {filteredList.map((item, idx) => (
                <tr 
                  key={item.type + item.id + idx} 
                  onClick={() => setSelectedItem(item)}
                  className="border-b border-[#E8E6E1] last:border-0 hover:bg-[#FDFBF7] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5 text-xs font-bold text-[#8D6E63] whitespace-nowrap">
                    {item.macroPhase}
                  </td>
                  <td className="py-3.5 px-5 font-bold max-w-sm">
                    <div className="flex items-center gap-2" title={item.title}>
                      <span className={'w-2 h-2 rounded-full flex-shrink-0 ' + (item.type==='task' ? 'bg-blue-500' : item.type==='legal' ? 'bg-purple-500' : item.type==='doc' ? 'bg-orange-500' : 'bg-green-500')}></span>
                      <span>{item.title}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={'px-2.5 py-1 text-xs rounded-full font-bold ' + (['Hoàn thành', 'Đã chuẩn bị'].includes(item.status) ? 'bg-[#D4EDDA] text-[#155724]' : ['Đang thực hiện', 'Đang soạn thảo'].includes(item.status) ? 'bg-[#FFF3CD] text-[#856404]' : 'bg-[#E2E3E5] text-[#383D41]')}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#5D4037]">{item.workstream}</td>
                  <td className="py-3.5 px-5 text-xs font-medium">{item.pic}</td>
                  <td className="py-3.5 px-5 text-xs font-medium whitespace-nowrap">{item.dueDate}</td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8D6E63]">Không tìm thấy công việc nào phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <EditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {showAddModal && (
        <EditModal item={{ type: 'task', title: '', status: 'Chưa bắt đầu', workstream: 'Trước khai trương: Khác', pic: '', dueDate: '' }} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default TaskListView;
