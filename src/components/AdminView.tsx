import React, { useState } from "react";
import { useHana } from "../store/HanaContext";
import { Settings, Save, Database, Calendar, Type, RefreshCw, CheckCircle2, UserPlus, Trash2, Users, ShieldCheck, Mail, Send, Bell } from "lucide-react";

const AdminView: React.FC = () => {
  const { settings, updateSettings, tasks, legal, docs, capex, userPermissions, addUserPermission, removeUserPermission, updateUserRole } = useHana();
  
  const [formData, setFormData] = useState({
    logoText: settings.logoText,
    brandName: settings.brandName,
    subTitle: settings.subTitle,
    targetDate: settings.targetDate,
    reportEmail: settings.reportEmail || "phamtunghcm@gmail.com",
    zaloWebhook: settings.zaloWebhook || ""
  });

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [testReportModal, setTestReportModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccessMsg("Đã lưu thành công cấu hình web và thông tin Email/Zalo nhận báo cáo 8:00 AM!");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    addUserPermission(newEmail, newRole, newName);
    setNewEmail("");
    setNewName("");
    setSuccessMsg(`Đã cấp quyền ${newRole.toUpperCase()} thành công cho: ${newEmail}`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleResetData = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục dữ liệu ban đầu? Tất cả các chỉnh sửa đã lưu sẽ bị xóa.")) {
      localStorage.removeItem("hana_status_overrides");
      localStorage.removeItem("hana_item_edits");
      localStorage.removeItem("hana_new_items");
      localStorage.removeItem("hana_settings");
      localStorage.removeItem("hana_user_permissions");
      window.location.reload();
    }
  };

  // Merge docs with tasks for unified system stats (37 main tasks + 9 internal docs = 46 total)
  const combinedTasks = [
    ...tasks,
    ...docs.map(d => ({
      id: `doc_${d.id}`,
      title: `[Văn bản] ${d.title}`,
      status: d.status,
      pic: d.department,
      dueDate: d.deadline,
      daysLeft: d.status === "Hoàn thành" ? 0 : 10
    }))
  ];

  const completed = combinedTasks.filter(t => t.status === "Hoàn thành").length;
  const totalTasks = combinedTasks.length;
  const pct = Math.round((completed / totalTasks) * 100) || 0;
  const urgentTasks = combinedTasks.filter(t => t.status !== "Hoàn thành" && t.daysLeft < 15);

  const totalCapexAmount = capex.reduce((sum, c) => {
    const val = typeof c.totalPrice === "number" ? c.totalPrice : parseFloat(String(c.totalPrice).replace(/,/g, "")) || 0;
    return sum + val;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFEBE6]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#F5F0E6] text-[#3D2B1A] rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Trung tâm Quản trị & Cấu hình Web</h1>
            <p className="text-sm text-[#8D6E63]">Cấu hình Email nhận báo cáo 8:00 AM, quản lý người dùng, thương hiệu và mục tiêu khai trương</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Settings Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Email & Zalo Report Configuration Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[#8D6E63]/20 bg-linear-to-br from-white to-[#FAF8F5]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#3D2B1A] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#8D6E63]" />
                <span>Cấu hình Báo cáo Tự động 8:00 AM (Email & Zalo)</span>
              </h2>
              <span className="text-xs bg-[#8D6E63] text-white px-2.5 py-1 rounded-full font-bold">
                Tự động hàng ngày
              </span>
            </div>

            <p className="text-xs text-[#8D6E63] mb-4">
              Nhập địa chỉ Email và Zalo webhook bên dưới để nhận bản tin tóm lược tiến độ, công việc gấp và ngân sách CAPEX tự động gửi lúc 08:00 AM mỗi ngày.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5D4037] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#8D6E63]" />
                  <span>Email Nhận Báo Cáo Hàng Ngày:</span>
                </label>
                <input
                  type="email"
                  value={formData.reportEmail}
                  onChange={(e) => setFormData({ ...formData, reportEmail: e.target.value })}
                  placeholder="nhanbaocao@hanawellness-project.com, phamtunghcm@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  * Có thể nhập 1 hoặc nhiều Email (phân cách bằng dấu phẩy). Báo cáo sẽ gửi trực tiếp vào Hộp thư đến 8:00 AM.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] mb-1.5 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Zalo Webhook URL / Nhóm Zalo (Không bắt buộc):</span>
                </label>
                <input
                  type="text"
                  value={formData.zaloWebhook}
                  onChange={(e) => setFormData({ ...formData, zaloWebhook: e.target.value })}
                  placeholder="https://chat.zalo.me/webhook/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTestReportModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5F0E6] hover:bg-amber-100 text-[#3D2B1A] border border-[#E7E0D6] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#8D6E63]" />
                  <span>Gửi Thử Báo Cáo Mẫu Ngay</span>
                </button>

                <button
                  onClick={handleSaveSettings}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#3D2B1A] hover:bg-[#2C1F13] text-[#FDFBF7] font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Báo Cáo 8:00 AM</span>
                </button>
              </div>
            </div>
          </div>

          {/* Brand Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFEBE6]">
            <h2 className="text-lg font-bold text-[#3D2B1A] mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-[#8D6E63]" />
              <span>Cấu hình Thương hiệu & Mục tiêu</span>
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5D4037] mb-1">
                    Ký tự Logo (1-3 ký tự)
                  </label>
                  <input
                    type="text"
                    value={formData.logoText}
                    onChange={(e) => setFormData({ ...formData, logoText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm font-bold text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                    maxLength={5}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5D4037] mb-1">
                    Tên thương hiệu chính
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm font-bold text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5D4037] mb-1">
                    Tên phụ (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.subTitle}
                    onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5D4037] mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8D6E63]" />
                    <span>Ngày Mục tiêu Khai trương</span>
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-gray-200 rounded-xl text-sm font-semibold text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3D2B1A] hover:bg-[#2C1F13] text-[#FDFBF7] font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu hình Web</span>
                </button>
              </div>
            </form>
          </div>

          {/* User Management Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFEBE6]">
            <h2 className="text-lg font-bold text-[#3D2B1A] mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8D6E63]" />
                <span>Quản lý Danh sách Người dùng & Phân quyền</span>
              </span>
              <span className="text-xs bg-[#F5F0E6] text-[#8D6E63] px-2.5 py-1 rounded-full font-semibold">
                {userPermissions.length} Thành viên
              </span>
            </h2>

            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="mb-6 p-4 bg-[#FAF8F5] rounded-xl border border-gray-200">
              <p className="text-xs font-semibold text-[#5D4037] mb-3 flex items-center gap-1.5 uppercase">
                <UserPlus className="w-4 h-4 text-[#8D6E63]" />
                <span>Thêm Email được phép truy cập</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input
                  type="email"
                  placeholder="email@hanawellness-project.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                  required
                />
                <input
                  type="text"
                  placeholder="Tên / Bổ nhiệm (Không bắt buộc)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8D6E63] font-medium"
                >
                  <option value="user">USER (Chỉ xem dữ liệu)</option>
                  <option value="admin">ADMIN (Quản trị toàn quyền)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-[#8D6E63] hover:bg-[#6D4C41] text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cấp quyền truy cập</span>
              </button>
            </form>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-[#8D6E63] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Họ tên & Email</th>
                    <th className="py-2.5 px-3">Vai trò (Role)</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userPermissions.map((user) => (
                    <tr key={user.email} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#3D2B1A]">{user.name || user.email}</div>
                        <div className="text-gray-500 text-[11px]">{user.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.email, e.target.value as "admin" | "user")}
                          className={`px-2 py-1 rounded text-[11px] font-bold border ${
                            user.role === "admin" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-blue-50 border-blue-200 text-blue-800"
                          }`}
                        >
                          <option value="admin">ADMIN (Quản trị)</option>
                          <option value="user">USER (Xem)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Hoạt động
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {user.email.toLowerCase() !== "phamtunghcm@gmail.com" && (
                          <button
                            onClick={() => removeUserPermission(user.email)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Xóa quyền truy cập"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: System Stats & Backup */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EFEBE6]">
            <h2 className="text-lg font-bold text-[#3D2B1A] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#8D6E63]" />
              <span>Thống kê Hệ thống</span>
            </h2>
            <div className="space-y-3 text-sm text-[#5D4037]">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Tổng số Công việc:</span>
                <strong className="text-[#3D2B1A]">{tasks.length} tasks</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Hồ sơ Pháp lý:</span>
                <strong className="text-[#3D2B1A]">{legal.length} mục (gồm PCCC &gt;100m2)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Văn bản Nội bộ:</span>
                <strong className="text-[#3D2B1A]">{docs.length} tài liệu</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Danh mục CAPEX:</span>
                <strong className="text-[#3D2B1A]">{capex.length} hạng mục (513.74tr)</strong>
              </div>
              <div className="flex justify-between py-1 pt-2">
                <span>Quy định PCCC:</span>
                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Cơ sở &gt;100m2 (Thẩm duyệt)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-red-50/50 rounded-2xl p-6 shadow-sm border border-red-100">
            <h2 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <span>Quản trị Dữ liệu & Backup</span>
            </h2>
            <p className="text-xs text-red-700 mb-4">
              Nếu bạn muốn khôi phục lại dữ liệu gốc ban đầu từ các file CSV (xóa bỏ tất cả các chỉnh sửa lưu trên trình duyệt), hãy dùng nút dưới đây:
            </p>
            <button
              onClick={handleResetData}
              className="w-full py-2.5 px-4 bg-white border border-red-200 hover:bg-red-50 text-red-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Khôi phục Dữ liệu Ban đầu</span>
            </button>
          </div>
        </div>

      </div>

      {/* Test Report Modal Preview */}
      {testReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#E7E0D6]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-[#3D2B1A] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#8D6E63]" />
                <span>Xem trước Báo cáo Mẫu 8:00 AM</span>
              </h3>
              <button onClick={() => setTestReportModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
              <div className="bg-[#2C1A0E] text-white p-4">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Executive Briefing • 08:00 AM</div>
                <div className="text-base font-black">HANA WELLNESS PM HUB</div>
                <div className="text-[11px] text-gray-300">Bản tin điều hành dự án tự động gửi cho CEO</div>
              </div>
              
              <div className="p-4 bg-white space-y-4 text-[#3D2B1A]">
                {/* 3 KPI Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-gray-500 font-bold block">TỔNG CÔNG VIỆC</span>
                    <span className="text-base font-black text-sky-700">{totalTasks}</span>
                    <span className="text-[9px] text-gray-400 block">(37 việc + 9 VB)</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] text-emerald-800 font-bold block">ĐÃ HOÀN THÀNH</span>
                    <span className="text-base font-black text-emerald-600">{completed}</span>
                    <span className="text-[9px] text-emerald-700 font-bold block">{pct}%</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-[10px] text-amber-800 font-bold block">CAPEX DỰ KIẾN</span>
                    <span className="text-sm font-black text-amber-700">{(totalCapexAmount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})} tr</span>
                    <span className="text-[9px] text-amber-600 block">29 hạng mục</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Tiến độ thực tế toàn dự án:</span>
                    <span className="text-emerald-700">{pct}% ({completed}/{totalTasks} tasks)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                {/* Urgent tasks */}
                <div>
                  <div className="font-bold text-red-700 uppercase tracking-wider text-[11px] mb-2">
                    🚨 Hạng mục Cần Giám đốc Xử lý & Đôn đốc ({urgentTasks.length} việc):
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                    {urgentTasks.slice(0, 4).map(u => (
                      <div key={u.id} className="p-2 flex justify-between items-center text-[11px] bg-red-50/40">
                        <div>
                          <span className="font-bold text-gray-900 block">{u.title}</span>
                          <span className="text-gray-500 text-[10px]">Phụ trách: {u.pic}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-red-700 font-bold block">{u.dueDate}</span>
                          <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-semibold">{u.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-2">
                  <a href={window.location.origin} target="_blank" rel="noreferrer" className="inline-block bg-[#2C1A0E] text-white px-5 py-2 rounded-lg font-bold text-xs shadow-xs hover:bg-[#3D2B1A]">
                    Truy cập Hệ thống HANA PM Hub →
                  </a>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
              💌 <strong>Địa chỉ gửi đến:</strong> {formData.reportEmail || "Chưa nhập Email"}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTestReportModal(false)}
                className="px-4 py-2 bg-[#3D2B1A] text-white rounded-xl text-xs font-bold hover:bg-[#2C1F13]"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
