import React, { useState, useMemo } from "react";
import { useHana, DRIVE_LINKS } from "../store/HanaContext";
import { 
  Calendar, AlertTriangle, ArrowRight, CheckCircle2, Clock, PieChart, BarChart3, 
  Wallet, FileText, Scale, BellRing, Zap, ShieldCheck, Flame, Users, Trash2, 
  ExternalLink, Check, ChevronRight, Receipt 
} from "lucide-react";
import EditModal from "./EditModal";

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { tasks, legal, docs, capex, settings, updateItemStatus, invoices, invoiceSettings } = useHana();

  // Merge docs & legal into tasks for global stats as requested: "VĂN BẢN NỘI BỘ & PHÁP LÝ ĐỀU LÀ TASK"
  const combinedTasks = useMemo(() => {
    const parseDeadline = (deadline: string) => {
      if (!deadline || deadline === "Đã hoàn thành") return 0;
      const parts = deadline.split("/");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const diff = d.getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
      }
      return 0;
    };

    const docTasks = docs.map(d => ({
      id: `doc_${d.id}`,
      type: "doc",
      workstream: `Văn bản nội bộ: ${d.group}`,
      title: `[Văn bản] ${d.title}`,
      pic: d.department,
      dueDate: d.deadline,
      priority: d.level,
      status: d.status,
      daysLeft: parseDeadline(d.deadline),
      percent: d.status === "Hoàn thành" ? "100%" : (d.status === "Đang soạn thảo" ? "50%" : "0%"),
      note: d.content
    } as any));

    const legalTasks = legal.map(l => {
      const parts = l.timeEstimate ? l.timeEstimate.split("->") : [];
      const endStr = parts.length > 1 ? parts[1].trim() : (parts[0] || "").trim();
      return {
        id: `legal_${l.id}`,
        type: "legal",
        workstream: `Pháp lý: ${(l as any).group || 'Thủ tục pháp lý'}`,
        title: l.title,
        pic: l.agency || "Pháp lý",
        dueDate: endStr,
        priority: "Bắt buộc",
        status: l.status,
        daysLeft: parseDeadline(endStr),
        percent: l.status === "Hoàn thành" ? "100%" : (l.status === "Đang thực hiện" ? "50%" : "0%"),
        note: l.note
      } as any;
    });

    const standardTasks = tasks.map(t => ({ ...t, type: "task" }));
    return [...standardTasks, ...docTasks, ...legalTasks];
  }, [tasks, docs, legal]);

  // 5 việc trọng điểm bắt buộc hoàn thành tuần sau (14/09 - 20/09/2026)
  const weeklyReminders = useMemo(() => {
    // 1. Hồ sơ CBNV
    const cbnvTask = tasks.find(t => t.id === 4) || {
      id: 4, type: "task", title: "Hồ sơ CBNV & Chứng chỉ KTV", status: "Đang thực hiện", pic: "HR / Phạm Vũ Tùng", dueDate: "18-Sep-2026"
    };
    // 2. Hồ sơ ANTT
    const anttTask = tasks.find(t => t.id === 6) || {
      id: 6, type: "task", title: "Hồ sơ ANTT (Lý lịch tư pháp & Chuẩn bị cơ sở)", status: "Đang thực hiện", pic: "Phạm Vũ Tùng / Vận hành", dueDate: "18-Sep-2026"
    };
    // 3. Liên hệ Công an khu vực PCCC
    const pcccTask = tasks.find(t => t.id === 40) || legal.find(l => l.id === 17) || {
      id: 40, type: "task", title: "Liên hệ Công an khu vực / CS PCCC hỏi vụ kiểm tra (PC10)", status: "Đang thực hiện", pic: "Phạm Vũ Tùng", dueDate: "16-Sep-2026"
    };
    // 4. Đồng hồ điện
    const electricTask = tasks.find(t => t.id === 38) || {
      id: 38, type: "task", title: "Thủ tục sang tên & tách đồng hồ điện kinh doanh EVN", status: "Đang thực hiện", pic: "Vận hành / Tùng", dueDate: "17-Sep-2026"
    };
    // 5. Hợp đồng thu gom rác thải
    const wasteTask = legal.find(l => l.id === 31) || tasks.find(t => t.id === 39) || {
      id: 31, type: "legal", title: "Hợp đồng thu gom rác thải sinh hoạt", status: "Đang thực hiện", pic: "Vận hành cơ sở", dueDate: "19-Sep-2026"
    };

    return [
      {
        stt: 1,
        key: "cbnv",
        title: "1. Hồ sơ CBNV & Chứng chỉ nghề KTV",
        targetItem: cbnvTask,
        itemType: (cbnvTask as any).type || "task",
        dueDate: "18/09/2026",
        daysLeftBadge: "Hạn: 18/09 (Còn 5 ngày)",
        priority: "BẮT BUỘC",
        priorityClass: "bg-red-50 text-red-700 border-red-200",
        pic: "HR / Phạm Vũ Tùng",
        agency: "Trường nghề / Sở Y tế",
        icon: Users,
        iconColor: "text-purple-600 bg-purple-50",
        status: cbnvTask.status || "Đang thực hiện",
        checklist: [
          "Khám sức khỏe theo TT 32/2023/TT-BYT (dán ảnh giáp lai, hạn 15/09)",
          "Thu thập 100% Chứng chỉ nghề Xoa bóp bấm huyệt KTV trị liệu (hạn 18/09)",
          "Ký kết Hợp đồng lao động chính thức mang tên NĐDPL Phạm Vũ Tùng",
          "Lập Sổ quản lý lao động & Bảng tính lương/KPI hệ thống"
        ],
        driveLink: DRIVE_LINKS.legalSheet,
        group: "5. Nhân sự & Chứng chỉ KTV"
      },
      {
        stt: 2,
        key: "antt",
        title: "2. Hồ sơ An ninh trật tự (ANTT cơ sở xoa bóp)",
        targetItem: anttTask,
        itemType: (anttTask as any).type || "task",
        dueDate: "18/09/2026",
        daysLeftBadge: "Hạn: 18/09 (Còn 5 ngày)",
        priority: "BẮT BUỘC",
        priorityClass: "bg-red-50 text-red-700 border-red-200",
        pic: "Phạm Vũ Tùng / Vận hành",
        agency: "Đội CSQLHC về TTXH - Công an Q.3",
        icon: ShieldCheck,
        iconColor: "text-emerald-600 bg-emerald-50",
        status: anttTask.status || "Đang thực hiện",
        checklist: [
          "Theo dõi nhận Phiếu Lý lịch tư pháp của ông Tùng (VNeID/Sở Tư pháp)",
          "Chuẩn hóa mặt bằng massage: Tháo bỏ chốt khóa trong, lắp chuông cấp cứu",
          "Hoàn thiện Đơn đề nghị Mẫu 03 & Bản khai lý lịch người đứng đầu Mẫu 02",
          "Chuẩn bị bộ hồ sơ nộp Công an Quận 3 theo Nghị định 96/2016/NĐ-CP"
        ],
        driveLink: DRIVE_LINKS.legalAnttFolder,
        group: "4. An ninh trật tự (ANTT)"
      },
      {
        stt: 3,
        key: "pccc",
        title: "3. Liên hệ Công an khu vực để hỏi vụ PCCC (PC10)",
        targetItem: pcccTask,
        itemType: (pcccTask as any).type || "task",
        dueDate: "16/09/2026",
        daysLeftBadge: "Hạn: 16/09 (Còn 3 ngày)",
        priority: "KHẨN CẤP",
        priorityClass: "bg-amber-50 text-amber-800 border-amber-300",
        pic: "Phạm Vũ Tùng",
        agency: "Công an Phường & CS PCCC Quận 3",
        icon: Flame,
        iconColor: "text-red-600 bg-red-50",
        status: pcccTask.status || "Đang thực hiện",
        checklist: [
          "Chủ động liên hệ Công an Phường & CS PCCC Quận 3 nắm lịch kiểm tra cơ sở",
          "Hoàn tất lắp đặt thiết bị PCCC thực tế (Bình bột ABC, CO2 có tem, đèn Exit)",
          "Phối hợp kiểm tra hiện trường 107/18 Trương Định & lấy Biên bản PC10",
          "Lưu Biên bản PC10 làm thành phần bắt buộc để nộp hồ sơ ANTT"
        ],
        driveLink: DRIVE_LINKS.legalPcccFolder,
        group: "3. Phòng cháy chữa cháy (PCCC)"
      },
      {
        stt: 4,
        key: "electric",
        title: "4. Đồng hồ điện (Sang tên & Tách công tơ EVN)",
        targetItem: electricTask,
        itemType: (electricTask as any).type || "task",
        dueDate: "17/09/2026",
        daysLeftBadge: "Hạn: 17/09 (Còn 4 ngày)",
        priority: "CẦN THIẾT",
        priorityClass: "bg-blue-50 text-blue-700 border-blue-200",
        pic: "Vận hành cơ sở / Phạm Vũ Tùng",
        agency: "Công ty Điện lực Sài Gòn (EVN Q.3)",
        icon: Zap,
        iconColor: "text-amber-600 bg-amber-50",
        status: electricTask.status || "Đang thực hiện",
        checklist: [
          "Lấy hợp đồng mua bán điện cũ & hồ sơ nhà 107/18 Trương Định từ chủ nhà",
          "Nộp hồ sơ sang tên hợp đồng điện sang Công ty TNHH Hana Wellness",
          "Đăng ký tách công tơ điện kinh doanh / 3 pha đảm bảo phụ tải máy trị liệu & lạnh"
        ],
        driveLink: DRIVE_LINKS.tasks,
        group: "Cơ sở vật chất & Hạ tầng điện"
      },
      {
        stt: 5,
        key: "waste",
        title: "5. Hợp đồng thu gom rác thải sinh hoạt",
        targetItem: wasteTask,
        itemType: (wasteTask as any).type || "legal",
        dueDate: "19/09/2026",
        daysLeftBadge: "Hạn: 19/09 (Còn 6 ngày)",
        priority: "BẮT BUỘC",
        priorityClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pic: "Vận hành cơ sở",
        agency: "Cty TNHH MTV DV Công ích đô thị Q.3",
        icon: Trash2,
        iconColor: "text-teal-600 bg-teal-50",
        status: wasteTask.status || "Đang thực hiện",
        checklist: [
          "Liên hệ Công ty DV Công ích đô thị Quận 3 / Đội thu gom rác dân lập",
          "Ký kết hợp đồng dịch vụ thu gom & vận chuyển rác sinh hoạt định kỳ",
          "Bố trí thùng rác có nắp đậy phân loại rác thải tại các tầng theo Luật BV Môi trường"
        ],
        driveLink: DRIVE_LINKS.legalSheet,
        group: "8. Môi trường & Rác thải"
      }
    ];
  }, [tasks, legal]);

  const handleToggleReminderStatus = (reminder: any) => {
    const current = reminder.status;
    let nextStatus = "Đang thực hiện";
    if (current === "Chưa bắt đầu") nextStatus = "Đang thực hiện";
    else if (current === "Đang thực hiện") nextStatus = "Hoàn thành";
    else nextStatus = "Chưa bắt đầu";

    updateItemStatus(reminder.itemType, reminder.targetItem.id, nextStatus);
  };

  const completedRemindersCount = useMemo(() => {
    return weeklyReminders.filter(r => r.status === "Hoàn thành").length;
  }, [weeklyReminders]);

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<any | null>(null);

  // Compute Days Left to Opening
  const daysToOpening = useMemo(() => {
    const target = new Date(settings.targetDate || "2026-11-02");
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

    combinedTasks.forEach(t => {
      if (t.status === "Hoàn thành") completed++;
      else if (t.status === "Đang thực hiện" || t.status === "Đang soạn thảo") {
        inProgress++;
        if (t.daysLeft < 0) overdue++;
      } else {
        pending++;
        if (t.daysLeft < 0) overdue++;
      }
    });

    const total = combinedTasks.length || 1;
    return {
      total: combinedTasks.length,
      completed,
      inProgress,
      overdue,
      pending,
      completedPct: Math.round((completed / total) * 100),
      inProgressPct: Math.round((inProgress / total) * 100),
      overduePct: Math.round((overdue / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
    };
  }, [combinedTasks]);


  // Specific lists for level-1 details
  const completedList = useMemo(() => combinedTasks.filter(t => t.status === "Hoàn thành"), [combinedTasks]);
  const doingList = useMemo(() => combinedTasks.filter(t => t.status === "Đang thực hiện" || t.status === "Đang soạn thảo"), [combinedTasks]);
  const overdueList = useMemo(() => combinedTasks.filter(t => t.status !== "Hoàn thành" && t.daysLeft < 0), [combinedTasks]);

  // Compute CAPEX Total & Group Breakdown
  const capexStats = useMemo(() => {
    let total = 0;
    const groupTotals: Record<string, number> = {};
    capex.forEach(c => {
      const val = typeof c.totalPrice === "number" ? c.totalPrice : parseFloat(String(c.totalPrice).replace(/,/g, "")) || 0;
      total += val;
      const g = c.group || "Khác";
      groupTotals[g] = (groupTotals[g] || 0) + val;
    });
    return { total, groupTotals };
  }, [capex]);

  // Urgent tasks (daysLeft < 15 or overdue, not completed)
  const urgentTasks = useMemo(() => {
    return combinedTasks.filter(t => t.status !== "Hoàn thành").slice(0, 4);
  }, [combinedTasks]);

  
  // Phase progress
  const phasesStats = useMemo(() => {
    const map: Record<string, { total: number; done: number; doing: number; pending: number }> = {
      "Trước khai trương": { total: 0, done: 0, doing: 0, pending: 0 },
      "Khai trương": { total: 0, done: 0, doing: 0, pending: 0 },
      "Hậu khai trương": { total: 0, done: 0, doing: 0, pending: 0 },
      "Văn bản nội bộ": { total: 0, done: 0, doing: 0, pending: 0 },
    };

    combinedTasks.forEach(t => {
      const ws = t.workstream || "";
      let phaseKey = "Trước khai trương";
      if (ws.includes("Khai trương chính thức") || ws.includes("Khai trương thử nghiệm")) phaseKey = "Khai trương";
      else if (ws.includes("Tháng thứ")) phaseKey = "Hậu khai trương";
      else if (ws.includes("Văn bản nội bộ")) phaseKey = "Văn bản nội bộ";

      map[phaseKey].total++;
      if (t.status === "Hoàn thành") map[phaseKey].done++;
      else if (t.status === "Đang thực hiện" || t.status === "Đang soạn thảo") map[phaseKey].doing++;
      else map[phaseKey].pending++;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      total: data.total,
      done: data.done,
      doing: data.doing,
      pending: data.pending,
      pct: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
    }));
  }, [combinedTasks]);


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
              <span className="text-xs text-[#8D6E63] font-medium">({settings.targetDate})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LỊCH NHẮC NHỞ TUẦN SAU (14/09 – 20/09/2026) — 5 HẠNG MỤC TRỌNG ĐIỂM */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#FFFBF2] via-[#FFF8EB] to-[#FFF3DC] rounded-2xl border-2 border-amber-300 shadow-sm p-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-amber-200/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                <BellRing size={13} className="animate-bounce" />
                Lịch nhắc nhở tuần sau
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Calendar size={13} />
                14/09 – 20/09/2026
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                Tiến độ: {completedRemindersCount}/5 hoàn tất
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#3D2B1A] mt-2 tracking-tight flex items-center gap-2">
              5 Nhiệm Vụ Bắt Buộc Hoàn Thành Đúng Hạn
            </h2>
            <p className="text-xs md:text-sm text-[#795548] mt-0.5 font-medium">
              Ưu tiên hoàn thiện hồ sơ nhân sự CBNV, PCCC PC10, thẩm định ANTT, đồng hồ điện và rác thải cơ sở 107/18 Trương Định
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => onNavigate("legal")}
              className="text-xs font-bold text-amber-900 bg-white/90 hover:bg-white border border-amber-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Scale size={14} /> Xem Bảng Pháp lý
            </button>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs font-bold text-white bg-[#5D4037] hover:bg-[#3E2723] px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileText size={14} /> Xem Bảng Task
            </button>
          </div>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {weeklyReminders.map((rem) => {
            const isDone = rem.status === "Hoàn thành";
            const isDoing = rem.status === "Đang thực hiện";

            return (
              <div 
                key={rem.key}
                className={`rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between bg-white relative group ${
                  isDone 
                    ? "border-emerald-300 bg-emerald-50/30 shadow-xs" 
                    : isDoing 
                    ? "border-amber-300 hover:border-amber-400 shadow-sm hover:shadow-md" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div>
                  {/* Card Header: Stt + Priority + Days Left */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-[#3D2B1A] text-amber-300 text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                        0{rem.stt}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${rem.priorityClass}`}>
                        {rem.priority}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                      <Clock size={11} /> {rem.daysLeftBadge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-sm text-[#3D2B1A] leading-snug mb-1 group-hover:text-amber-900 transition-colors">
                    {rem.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-[#8D6E63] mb-3">
                    <span>Phụ trách: <strong className="text-[#5D4037]">{rem.pic}</strong></span>
                    <span>•</span>
                    <span className="truncate">{rem.agency}</span>
                  </div>

                  {/* Checklist items */}
                  <div className="bg-[#FAF7F2] rounded-lg p-2.5 border border-[#EFEBE4] mb-3 space-y-1.5">
                    {rem.checklist.map((c: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-[#5D4037] leading-relaxed">
                        <CheckCircle2 size={13} className={`shrink-0 mt-0.5 ${isDone ? "text-emerald-600" : "text-amber-600"}`} />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar: Quick status toggle & Actions */}
                <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleReminderStatus(rem)}
                    className={`text-xs font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDone 
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                        : isDoing 
                        ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                    title="Click để đổi trạng thái"
                  >
                    {isDone ? <Check size={13} className="stroke-[3]" /> : <Clock size={13} />}
                    <span>{rem.status}</span>
                    <span className="text-[10px] opacity-70 font-normal">(đổi)</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {rem.driveLink && (
                      <a
                        href={rem.driveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#8D6E63] hover:text-[#3D2B1A] hover:bg-amber-50 rounded-lg transition-colors"
                        title="Mở Google Drive / Sheets gốc"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedItemForEdit(rem.targetItem)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sửa</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 1: KPI Summary Cards (Interactive Hover Level-1 Details) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số việc */}
        <div 
          onClick={() => onNavigate("tasks")}
          onMouseEnter={() => setHoveredSection("kpi_tasks")}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative group"
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
          {hoveredSection === "kpi_tasks" && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-[#3D2B1A] text-white text-xs p-3.5 rounded-xl shadow-2xl z-40 space-y-1.5 animate-in fade-in duration-150 border border-amber-900/40">
              <p className="font-bold border-b border-white/20 pb-1 text-amber-300">Chi tiết cấp 1 — Phân bổ Dữ liệu Gốc:</p>
              <p className="flex justify-between"><span>• Công việc chính:</span> <span className="font-bold text-amber-200">{tasks.length} tasks</span></p>
              <p className="flex justify-between"><span>• Hồ sơ pháp lý (PCCC &gt;100m2):</span> <span className="font-bold text-amber-200">{legal.length} mục</span></p>
              <p className="flex justify-between"><span>• Văn bản lập quy nội bộ:</span> <span className="font-bold text-amber-200">{docs.length} tài liệu</span></p>
              <p className="flex justify-between"><span>• Danh mục Mua sắm CAPEX:</span> <span className="font-bold text-amber-200">{capex.length} hạng mục</span></p>
            </div>
          )}
        </div>

        {/* Card 2: Hoàn thành */}
        <div 
          onClick={() => onNavigate("tasks")}
          onMouseEnter={() => setHoveredSection("kpi_done")}
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

          {hoveredSection === "kpi_done" && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-[#3D2B1A] text-white text-xs p-3.5 rounded-xl shadow-2xl z-40 space-y-1.5 animate-in fade-in duration-150 border border-green-900/40">
              <p className="font-bold border-b border-white/20 pb-1 text-green-300">Chi tiết cấp 1 — Đã hoàn thành ({taskStats.completed}):</p>
              {completedList.length > 0 ? (
                completedList.map(t => (
                  <p key={t.id} className="text-green-100 truncate">• {t.title} <span className="text-gray-400">({t.pic})</span></p>
                ))
              ) : (
                <p className="text-gray-300">• Chưa có mục hoàn thành</p>
              )}
            </div>
          )}
        </div>

        {/* Card 3: Đang làm */}
        <div 
          onClick={() => onNavigate("tasks")}
          onMouseEnter={() => setHoveredSection("kpi_doing")}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-[#E8E6E1] hover:border-amber-400 hover:shadow-md transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-center text-[#8D6E63] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Đang thực hiện</span>
            <Clock size={20} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{taskStats.inProgress}</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: taskStats.inProgressPct + "%" }}></div>
          </div>

          {hoveredSection === "kpi_doing" && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-[#3D2B1A] text-white text-xs p-3.5 rounded-xl shadow-2xl z-40 space-y-1.5 animate-in fade-in duration-150 border border-amber-900/40">
              <p className="font-bold border-b border-white/20 pb-1 text-amber-300">Chi tiết cấp 1 — Đang thực hiện ({taskStats.inProgress}):</p>
              {doingList.slice(0, 5).map(t => (
                <p key={t.id} className="text-amber-100 truncate">• {t.title} <span className="text-gray-400">({t.pic})</span></p>
              ))}
            </div>
          )}
        </div>

        {/* Card 4: Quá hạn */}
        <div 
          onClick={() => onNavigate("tasks")}
          onMouseEnter={() => setHoveredSection("kpi_overdue")}
          onMouseLeave={() => setHoveredSection(null)}
          className="bg-[#FFF5F5] p-5 rounded-2xl shadow-sm border border-red-200 hover:border-red-500 hover:shadow-md transition-all cursor-pointer relative group"
        >
          <div className="flex justify-between items-center text-red-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quá hạn / Cần gấp</span>
            <AlertTriangle size={20} className="text-red-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-red-600">{taskStats.overdue}</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: (taskStats.overduePct || 10) + "%" }}></div>
          </div>

          {hoveredSection === "kpi_overdue" && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#3D2B1A] text-white text-xs p-3.5 rounded-xl shadow-2xl z-40 space-y-1.5 animate-in fade-in duration-150 border border-red-900/40">
              <p className="font-bold border-b border-white/20 pb-1 text-red-300">Chi tiết cấp 1 — Cần xử lý gấp ({urgentTasks.length}):</p>
              {urgentTasks.map(t => (
                <p key={t.id} className="text-red-200 truncate">• {t.title} <span className="text-amber-300">({t.dueDate})</span></p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Diversity Visual Section: Donut Chart + Phase Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual 1: Donut SVG Chart for Status Ratio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col justify-between relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-[#3D2B1A] text-lg flex items-center gap-2">
              <PieChart size={18} className="text-amber-700" /> Tỷ lệ Trạng thái Công việc
            </h3>
            <span className="text-[11px] text-[#8D6E63] font-medium bg-[#F5F0E6] px-2 py-0.5 rounded">Rê chuột xem chi tiết</span>
          </div>

          <div 
            onMouseEnter={() => setHoveredSection("donut_center")}
            onMouseLeave={() => setHoveredSection(null)}
            className="flex items-center justify-center my-4 relative cursor-pointer group"
          >
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
            <div className="absolute text-center group-hover:scale-105 transition-transform">
              <span className="text-2xl font-black text-[#3D2B1A]">{taskStats.completedPct}%</span>
              <span className="block text-xs text-[#8D6E63] font-medium">Hoàn thành</span>
            </div>

            {/* Level 1 Detail Tooltip for Donut Center Hover */}
            {hoveredSection === "donut_center" && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-[#3D2B1A] text-white text-xs p-3.5 rounded-xl shadow-2xl z-40 space-y-1.5 animate-in fade-in duration-150 border border-amber-900/40">
                <p className="font-bold border-b border-white/20 pb-1 text-amber-300">Chi tiết Cấp 1 — Tỷ lệ Trạng thái ({taskStats.total} việc):</p>
                <p className="flex justify-between text-green-300"><span>• Hoàn thành:</span> <span className="font-bold">{taskStats.completed} tasks ({taskStats.completedPct}%)</span></p>
                <p className="flex justify-between text-amber-300"><span>• Đang thực hiện:</span> <span className="font-bold">{taskStats.inProgress} tasks ({taskStats.inProgressPct}%)</span></p>
                <p className="flex justify-between text-red-300"><span>• Quá hạn / Cần gấp:</span> <span className="font-bold">{taskStats.overdue} tasks ({taskStats.overduePct}%)</span></p>
                <p className="flex justify-between text-gray-300"><span>• Chưa thực hiện:</span> <span className="font-bold">{taskStats.pending} tasks ({taskStats.pendingPct}%)</span></p>
              </div>
            )}
          </div>

          {/* Interactive Legend Row (Hover each item -> Level 1 Popover) */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E8E6E1] text-xs font-semibold text-[#5D4037]">
            {/* Legend 1: Hoàn thành */}
            <div 
              onMouseEnter={() => setHoveredSection("donut_completed")}
              onMouseLeave={() => setHoveredSection(null)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-green-50 transition-colors cursor-pointer relative"
            >
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0"></span>
              <span className="truncate">Hoàn thành ({taskStats.completed})</span>

              {hoveredSection === "donut_completed" && (
                <div className="absolute left-0 bottom-full mb-2 w-64 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-2xl z-40 space-y-1 animate-in fade-in duration-150 border border-green-900/40">
                  <p className="font-bold border-b border-white/20 pb-1 text-green-300">Chi tiết — Đã hoàn thành ({taskStats.completed}):</p>
                  {completedList.length > 0 ? (
                    completedList.map(t => <p key={t.id} onClick={() => setSelectedItemForEdit(t)} className="text-green-100 truncate cursor-pointer hover:text-white hover:underline">• {t.title}</p>)
                  ) : (
                    <p className="text-gray-300">• Chưa có mục hoàn thành</p>
                  )}
                </div>
              )}
            </div>

            {/* Legend 2: Đang làm */}
            <div 
              onMouseEnter={() => setHoveredSection("donut_doing")}
              onMouseLeave={() => setHoveredSection(null)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer relative"
            >
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
              <span className="truncate">Đang làm ({taskStats.inProgress})</span>

              {hoveredSection === "donut_doing" && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-2xl z-40 space-y-1 animate-in fade-in duration-150 border border-amber-900/40">
                  <p className="font-bold border-b border-white/20 pb-1 text-amber-300">Chi tiết — Đang thực hiện ({taskStats.inProgress}):</p>
                  {doingList.slice(0, 5).map(t => (
                    <p key={t.id} onClick={() => setSelectedItemForEdit(t)} className="text-amber-100 truncate cursor-pointer hover:text-white hover:underline">• {t.title}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Legend 3: Quá hạn */}
            <div 
              onMouseEnter={() => setHoveredSection("donut_overdue")}
              onMouseLeave={() => setHoveredSection(null)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer relative"
            >
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
              <span className="truncate">Quá hạn ({taskStats.overdue})</span>

              {hoveredSection === "donut_overdue" && (
                <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-2xl z-40 space-y-1 animate-in fade-in duration-150 border border-red-900/40">
                  <p className="font-bold border-b border-white/20 pb-1 text-red-300">Chi tiết — Quá hạn ({taskStats.overdue}):</p>
                  {overdueList.length > 0 ? (
                    overdueList.map(t => (
                      <p key={t.id} onClick={() => setSelectedItemForEdit(t)} className="text-red-200 truncate cursor-pointer hover:text-white hover:underline">• {t.title} ({t.dueDate})</p>
                    ))
                  ) : (
                    <p className="text-gray-300">• Không có việc quá hạn</p>
                  )}
                </div>
              )}
            </div>

            {/* Legend 4: Chưa làm */}
            <div 
              onMouseEnter={() => setHoveredSection("donut_pending")}
              onMouseLeave={() => setHoveredSection(null)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer relative"
            >
              <span className="w-3 h-3 rounded-full bg-gray-400 shrink-0"></span>
              <span className="truncate">Chưa làm ({taskStats.pending})</span>

              {hoveredSection === "donut_pending" && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-2xl z-40 space-y-1 animate-in fade-in duration-150 border border-gray-700">
                  <p className="font-bold border-b border-white/20 pb-1 text-gray-300">Chi tiết — Chưa thực hiện ({taskStats.pending}):</p>
                  {phasesStats.map(p => (
                    <p key={p.name} className="flex justify-between text-gray-200">
                      <span>• {p.name}:</span>
                      <span className="font-bold">{p.pending} tasks</span>
                    </p>
                  ))}
                </div>
              )}
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
              onClick={() => onNavigate("tasks")}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer"
            >
              Bảng công việc <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-5 my-2">
            {phasesStats.map(p => (
              <div 
                key={p.name}
                onClick={() => onNavigate("tasks")}
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
                  <div className="absolute left-0 top-full mt-1 w-full bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-xl z-30 space-y-1 animate-in fade-in duration-150 border border-amber-900/40">
                    <p className="font-bold text-amber-300 border-b border-white/20 pb-1">Chi tiết cấp 1 — {p.name}:</p>
                    <p className="flex justify-between"><span>• Tổng số công việc:</span> <span className="font-bold">{p.total} tasks</span></p>
                    <p className="flex justify-between text-green-300"><span>• Đã hoàn thành:</span> <span className="font-bold">{p.done} tasks</span></p>
                    <p className="flex justify-between text-amber-300"><span>• Đang thực hiện:</span> <span className="font-bold">{p.doing} tasks</span></p>
                    <p className="flex justify-between text-gray-300"><span>• Chưa thực hiện:</span> <span className="font-bold">{p.pending} tasks</span></p>
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
          onClick={() => onNavigate("capex")}
          onMouseEnter={() => setHoveredSection("capex_summary")}
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
          {hoveredSection === "capex_summary" && (
            <div className="absolute left-0 top-full mt-2 w-full bg-[#3D2B1A] text-white text-xs p-4 rounded-xl shadow-2xl z-40 space-y-1.5 animate-in fade-in duration-150 border border-amber-900/40">
              <p className="font-bold text-amber-300 border-b border-white/20 pb-1">Chi tiết cấp 1 — 5 nhóm Ngân sách CAPEX:</p>
              {Object.entries(capexStats.groupTotals).map(([grp, amt]) => (
                <p key={grp} className="flex justify-between">
                  <span>• {grp}:</span>
                  <span className="font-bold text-amber-200">{amt.toLocaleString()} đ</span>
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
          <button 
            onClick={() => onNavigate("invoices")} 
            className="text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 px-3 py-2 rounded-lg border border-amber-300 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Quản lý và rà soát hóa đơn chi phí"
          >
            <Receipt size={14} /> Hóa Đơn Chi Phí ({invoices.length})
          </button>
          <a href={invoiceSettings?.driveFolderUrl || DRIVE_LINKS.invoicesFolder} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Thư mục Google Drive lưu trữ Hóa đơn & Chứng từ kế toán">
            <Receipt size={14} /> Drive Hóa Đơn & Chứng Từ
          </a>
          <a href={DRIVE_LINKS.tasks} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Bảng tính 46 Tasks & Mua sắm">
            <FileText size={14} /> Sheets Tasks
          </a>
          <a href={DRIVE_LINKS.legalSheet} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Bảng quản lý chung ANTT & PCCC">
            <Scale size={14} /> Sheets Quản Lý ANTT & PCCC
          </a>
          <a href={DRIVE_LINKS.docsSheet} target="_blank" rel="noreferrer" className="text-xs font-bold bg-[#F5F0E6] text-[#3D2B1A] hover:bg-amber-200 px-3 py-2 rounded-lg border border-[#E7E0D6] flex items-center gap-1.5" title="Bảng theo dõi văn bản nội bộ">
            <FileText size={14} /> Sheets Theo Dõi Văn Bản
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
