import React, { useState, useMemo } from 'react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';
import { Calendar, AlertTriangle, ArrowRight, CheckCircle2, Clock, PieChart, BarChart3, Wallet, FileText, Scale } from 'lucide-react';
import EditModal from './EditModal';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { tasks, capex, settings } = useHana();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<any | null>(null);

  // Compute Days Left to Opening
  const daysToOpening = useMemo(() => {
    const target = new Date(settings.targetDate || '2026-11-02');
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [settings.targetDate]);

  // Compute Task Status Stats
  const taskStats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;
    let pending = 0;

    tasks.forEach(t => {
      if (t.status === 'Hoàn thành') completed++;
      else if (t.status === 'Đang thực hiện') {
        inProgress++;
        if (t.daysLeft < 0) overdue++;
      } else {
        pending++;
        if (t.daysLeft < 0) overdue++;
      }
    });

    const total = tasks.length || 1;
    return {
      total: tasks.length,
      completed,
      inProgress,
      overdue,
      pending,
      completedPct: Math.round((completed / total) * 100),
      inProgressPct: Math.round((inProgress / total) * 100),
      overduePct: Math.round((overdue / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
    };
  }, [tasks]);

  // Compute CAPEX Total & Group Breakdown
  const capexStats = useMemo(() => {
    let total = 0;
    const groupTotals: Record<string, number> = {};
    capex.forEach(c => {
      const val = typeof c.totalPrice === 'number' ? c.totalPrice : parseFloat(String(c.totalPrice).replace(/,/g, '')) || 0;
      total += val;
      const g = c.group || 'Khác';
      groupTotals[g] = (groupTotals[g] || 0) + val;
    });
    return { total, groupTotals };
  }, [capex]);

  // Urgent tasks (daysLeft < 15 or overdue, not completed)
  const urgentTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'Hoàn thành').slice(0, 4);
  }, [tasks]);

  // Phase progress
  const phasesStats = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {
      'Trước khai trương': { total: 0, done: 0 },
      'Khai trương': { total: 0, done: 0 },
      'Hậu khai trương': { total: 0, done: 0 },
    };

    tasks.forEach(t => {
      const ws = t.workstream || '';
      let phaseKey = 'Trước khai trương';
      if (ws.includes('Khai trương chính thức') || ws.includes('Khai trương thử nghiệm')) phaseKey = 'Khai trương';
      else if (ws.includes('Tháng thứ')) phaseKey = 'Hậu khai trương';

      map[phaseKey].total++;
      if (t.status === 'Hoàn thành') map[phaseKey].done++;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      total: data.total,
      done: data.done,
      pct: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0,
    }));
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
            <h1 className="text-2xl font-black text-[#3D2B1A] uppercase tracking-tight">
              Tổng quan Dự án {settings.brandName}
            </h1>
          </div>
          <p className="text-[#8D6E63] text-sm mt-1">
            Theo dõi tiến độ, thủ tục pháp lý & ngân sách mua sắm toàn diện
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#F5F0E6] px-5 py-3 rounded-xl border border-[#E7E0D6]">
          <Calendar className="text-amber-700" size={28} />
          <div>
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Mục tiêu Khai trương</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-600">{daysToOpening} ngày</span>
              <span className="text-xs text-[#5D4037] font-medium">({settings.targetDate})</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Clickable + Hover Level 1 Detail) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Tasks */}
        <div 
          onClick={() => onNavigate('tasks')}
          onMouseEnter={() => setHoveredSection('kpi_tasks')}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-center text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng số việc</span>
            <BarChart3 size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-600">{taskStats.total}</div>
          <p className="text-xs text-[#8D6E63] mt-2 flex items-center gap-1 group-hover:text-blue-600 font-medium">
            Xem danh sách công việc <ArrowRight size={12} />
          </p>

          {/* Level 1 Detail Hover Tooltip */}
          {hoveredSection === 'kpi_tasks' && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-xl z-30 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-bold border-b border-white/20 pb-1 text-amber-300">Chi tiết phân bổ:</p>
              <p className="flex justify-between"><span>Công việc chính:</span> <span className="font-bold">36 tasks</span></p>
              <p className="flex justify-between"><span>Hồ sơ pháp lý:</span> <span className="font-bold">5 mục</span></p>
              <p className="flex justify-between"><span>Văn bản nội bộ:</span> <span className="font-bold">9 tài liệu</span></p>
              <p className="flex justify-between"><span>Vật dụng capex:</span> <span className="font-bold">29 hạng mục</span></p>
            </div>
          )}
        </div>

        {/* Card 2: Hoàn thành */}
        <div 
          onClick={() => onNavigate('tasks')}
          onMouseEnter={() => setHoveredSection('kpi_done')}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-green-400 hover:shadow-md transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-center text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hoàn thành</span>
            <CheckCircle2 size={20} className="text-green-500" />
          </div>
          <div className="text-3xl font-black text-green-600">{taskStats.completed}</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: taskStats.completedPct + "%" }}></div>
          </div>

          {hoveredSection === 'kpi_done' && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-xl z-30 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-bold border-b border-white/20 pb-1 text-green-300">Tỷ lệ đạt mục tiêu:</p>
              <p className="flex justify-between"><span>Tỷ lệ hoàn thành:</span> <span className="font-bold text-green-400">{taskStats.completedPct}%</span></p>
              <p className="flex justify-between"><span>Đã chốt hợp đồng:</span> <span className="font-bold">CEO</span></p>
              <p className="flex justify-between"><span>Đã hoàn thành PCCC:</span> <span className="font-bold">Hồ sơ xong</span></p>
            </div>
          )}
        </div>

        {/* Card 3: Đang làm */}
        <div 
          onClick={() => onNavigate('tasks')}
          onMouseEnter={() => setHoveredSection('kpi_doing')}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-center text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Đang thực hiện</span>
            <Clock size={20} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{taskStats.inProgress}</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: taskStats.completedPct + "%" }}></div>
          </div>

          {hoveredSection === 'kpi_doing' && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-xl z-30 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-bold border-b border-white/20 pb-1 text-amber-300">Công việc đang triển khai:</p>
              <p className="flex justify-between"><span>Care Passport / AI:</span> <span className="font-bold">IT / Ops</span></p>
              <p className="flex justify-between"><span>Học & thi chứng chỉ:</span> <span className="font-bold">Training</span></p>
              <p className="flex justify-between"><span>Nội quy & Sơ đồ JD:</span> <span className="font-bold">Đang soạn</span></p>
            </div>
          )}
        </div>

        {/* Card 4: Quá hạn */}
        <div 
          onClick={() => onNavigate('tasks')}
          onMouseEnter={() => setHoveredSection('kpi_overdue')}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-red-400 hover:shadow-md transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-center text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quá hạn / Cần gấp</span>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-black text-red-600">{taskStats.overdue}</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: taskStats.completedPct + "%" }}></div>
          </div>

          {hoveredSection === 'kpi_overdue' && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-xl z-30 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-bold border-b border-white/20 pb-1 text-red-300">Công việc trễ hạn:</p>
              <p className="text-red-200">• Chốt mô hình kinh doanh (-21 ngày)</p>
              <p className="text-red-200">• Care Passport EHR (-51 ngày)</p>
              <p className="text-red-200">• CRM & AI vận hành (-32 ngày)</p>
            </div>
          )}
        </div>
      </div>

      {/* Diversity Visual Section: Donut Chart + Phase Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual 1: Donut SVG Chart for Status Ratio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#3D2B1A] text-lg flex items-center gap-2">
              <PieChart size={18} className="text-amber-700" /> Tỷ lệ Trạng thái Công việc
            </h3>
          </div>

          <div className="flex items-center justify-center my-4 relative">
            {/* SVG Donut Chart */}
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Completed stroke */}
              <path
                className="text-green-500 transition-all duration-500"
                strokeDasharray={taskStats.completedPct + ", 100"}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-[#3D2B1A]">{taskStats.completedPct}%</span>
              <span className="block text-xs text-[#8D6E63] font-medium">Hoàn thành</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E6E1] text-xs font-medium text-[#5D4037]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Hoàn thành ({taskStats.completed})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Đang làm ({taskStats.inProgress})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>Quá hạn ({taskStats.overdue})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              <span>Chưa làm ({taskStats.pending})</span>
            </div>
          </div>
        </div>

        {/* Visual 2: Phase Progress Bars (Click to Navigate) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#3D2B1A] text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-700" /> Tiến độ theo Giai đoạn Dự án
            </h3>
            <button 
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1"
            >
              Bảng công việc <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-5 my-2">
            {phasesStats.map(p => (
              <div 
                key={p.name}
                onClick={() => onNavigate('tasks')}
                onMouseEnter={() => setHoveredSection("phase_" + p.name)}
                onMouseLeave={() => setHoveredSection(null)}
                className="cursor-pointer p-3 rounded-xl hover:bg-[#FDFBF7] transition-all border border-transparent hover:border-[#E8E6E1] relative"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-[#3D2B1A] text-sm">{p.name}</span>
                  <span className="text-xs font-bold text-[#8D6E63]">
                    {p.done}/{p.total} tasks ({p.pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={"h-3 rounded-full transition-all duration-500 " + (p.name === "Trước khai trương" ? "bg-amber-600" : p.name === "Khai trương" ? "bg-orange-500" : "bg-green-600")}
                    style={{ width: p.pct + "%" }}
                  ></div>
                </div>

                {/* Level 1 Detail Tooltip for Phase */}
                {hoveredSection === "phase_" + p.name && (
                  <div className="absolute left-0 top-full mt-1 w-full bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-xl z-30 space-y-1 animate-in fade-in duration-150">
                    <p className="font-bold text-amber-300 border-b border-white/20 pb-1">Chi tiết {p.name}:</p>
                    <p>• Tổng số hạng mục: {p.total} công việc</p>
                    <p>• Đã hoàn tất: {p.done} mục</p>
                    <p>• Bấm để lọc danh sách công việc của giai đoạn này</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-xs text-[#8D6E63] pt-2 border-t border-[#E8E6E1] flex justify-between">
            <span>Giai đoạn quan trọng nhất: <strong className="text-[#3D2B1A]">Trước Khai Trương</strong></span>
            <span>Cập nhật mới nhất từ Drive</span>
          </div>
        </div>
      </div>

      {/* Row 3: Urgent Tasks (Click to Edit Modal) + CAPEX Summary (Full 513M) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks (Interactive Click -> EditModal) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#3D2B1A] text-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Cảnh báo việc gấp (Click để cập nhật)
            </h3>
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
              {urgentTasks.length} việc gấp
            </span>
          </div>

          <div className="space-y-3">
            {urgentTasks.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedItemForEdit(t)}
                className="p-3.5 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 transition-all cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <h4 className="font-bold text-[#3D2B1A] text-sm group-hover:text-amber-800 transition-colors">
                    {t.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[#8D6E63] mt-1">
                    <span>Phụ trách: <strong>{t.pic}</strong></span>
                    <span>Hạn chót: <strong>{t.dueDate}</strong></span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-white border border-amber-200 px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  Cập nhật →
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CAPEX Summary Card (Includes Renovation & Rent Deposit) */}
        <div 
          onClick={() => onNavigate('capex')}
          onMouseEnter={() => setHoveredSection('capex_summary')}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between relative"
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[#3D2B1A] text-lg flex items-center gap-2">
                <Wallet size={18} className="text-amber-700" /> Ngân sách CAPEX Ban đầu
              </h3>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                29 hạng mục
              </span>
            </div>

            <div className="my-3">
              <span className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider block">Tổng ngân sách dự kiến</span>
              <span className="text-3xl font-black text-amber-700">
                {capexStats.total.toLocaleString()} đ
              </span>
              <span className="text-xs text-[#8D6E63] block mt-1">
                (Đã gồm 110tr Thi công thô + 100tr Đặt cọc mặt bằng + 303tr Mua sắm)
              </span>
            </div>

            {/* Subgroup breakdown */}
            <div className="space-y-2 mt-4 pt-3 border-t border-[#E8E6E1] text-xs">
              {Object.entries(capexStats.groupTotals).slice(0, 3).map(([grp, amt]) => (
                <div key={grp} className="flex justify-between text-[#5D4037]">
                  <span>{grp}:</span>
                  <span className="font-bold">{amt.toLocaleString()} đ</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E6E1] flex justify-between items-center text-xs font-bold text-amber-800">
            <span>Xem bảng kê chi tiết 29 hạng mục mua sắm</span>
            <ArrowRight size={14} />
          </div>

          {/* Level 1 Detail Tooltip */}
          {hoveredSection === 'capex_summary' && (
            <div className="absolute left-0 top-full mt-2 w-full bg-[#3D2B1A] text-white text-xs p-4 rounded-xl shadow-xl z-30 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-bold text-amber-300 border-b border-white/20 pb-1">Chi tiết 5 nhóm Ngân sách:</p>
              {Object.entries(capexStats.groupTotals).map(([grp, amt]) => (
                <p key={grp} className="flex justify-between">
                  <span>{grp}:</span>
                  <span className="font-bold">{amt.toLocaleString()} đ</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Source Drive Links Quick Access */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">
            📂
          </div>
          <div>
            <h4 className="font-bold text-[#3D2B1A] text-sm">Trang tính dữ liệu gốc trên Google Drive</h4>
            <p className="text-xs text-[#8D6E63]">Xem và đối chiếu file Sheets gốc từ công ty</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={DRIVE_LINKS.tasks} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5">
            <FileText size={14} /> Sheets Tasks
          </a>
          <a href={DRIVE_LINKS.legal} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5">
            <Scale size={14} /> Sheets Pháp lý
          </a>
          <a href={DRIVE_LINKS.docs} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5">
            <FileText size={14} /> Sheets Văn bản
          </a>
        </div>
      </div>

      {/* Edit Modal Popup */}
      {selectedItemForEdit && (
        <EditModal item={selectedItemForEdit} onClose={() => setSelectedItemForEdit(null)} />
      )}
    </div>
  );
};

export default DashboardView;
