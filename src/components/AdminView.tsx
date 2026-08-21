import React, { useState } from 'react';
import { useHana } from '../store/HanaContext';
import { Settings, Save, ShieldCheck, Database, Calendar, Type, RefreshCw, CheckCircle2 } from 'lucide-react';

const AdminView: React.FC = () => {
  const { settings, updateSettings, tasks, legal, docs, capex } = useHana();
  const [formData, setFormData] = useState({
    brandName: settings.brandName || 'HANA Wellness',
    subTitle: settings.subTitle || 'PM HUB',
    logoText: settings.logoText || 'H',
    targetDate: settings.targetDate || '2026-11-02',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa các thay đổi lưu tạm (localStorage) để khôi phục dữ liệu ban đầu không?')) {
      localStorage.removeItem('hana_status_overrides');
      localStorage.removeItem('hana_item_edits');
      localStorage.removeItem('hana_new_items');
      localStorage.removeItem('hana_settings');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="text-amber-800" size={24} />
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Trung tâm Quản trị & Cấu hình Web</h1>
          </div>
          <p className="text-[#8D6E63] mt-1">Tool Admin quản lý logo, ngày mục tiêu, liên kết Drive và khôi phục hệ thống</p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in">
            <CheckCircle2 size={18} /> Đã lưu cài đặt!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1]">
          <h2 className="text-lg font-bold text-[#3D2B1A] mb-4 pb-3 border-b border-[#E8E6E1] flex items-center gap-2">
            <Type size={20} className="text-amber-800" /> Cấu hình Thương hiệu & Mục tiêu
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#5D4037] mb-1">Ký tự Logo (1-3 ký tự)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={formData.logoText}
                  onChange={e => setFormData({ ...formData, logoText: e.target.value })}
                  className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 uppercase font-black tracking-wider outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#5D4037] mb-1">Tên thương hiệu chính</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 font-bold outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#5D4037] mb-1">Tên phụ (Subtitle)</label>
                <input
                  type="text"
                  value={formData.subTitle}
                  onChange={e => setFormData({ ...formData, subTitle: e.target.value })}
                  className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#5D4037] mb-1 flex items-center gap-1.5">
                  <Calendar size={16} /> Ngày Mục tiêu Khai trương
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-[#3D2B1A] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#5D4037] transition-colors shadow-md flex items-center gap-2"
              >
                <Save size={18} /> Lưu Cấu hình Web
              </button>
            </div>
          </form>
        </div>

        {/* System Info & Reset Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1]">
            <h2 className="text-lg font-bold text-[#3D2B1A] mb-4 pb-3 border-b border-[#E8E6E1] flex items-center gap-2">
              <Database size={20} className="text-amber-800" /> Thống kê Hệ thống
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
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Quy định PCCC:</span>
                <strong className="text-red-700 font-bold">Cơ sở &gt;100m2 (Thẩm duyệt)</strong>
              </div>
            </div>
          </div>

          <div className="bg-red-50/60 p-6 rounded-2xl border border-red-200/80">
            <h3 className="text-base font-bold text-red-900 mb-2 flex items-center gap-2">
              <ShieldCheck size={18} /> Quản trị Dữ liệu & Backup
            </h3>
            <p className="text-xs text-red-800 mb-4">
              Nếu bạn muốn khôi phục lại dữ liệu gốc ban đầu từ 4 file CSV (xóa bỏ tất cả các chỉnh sửa lưu trên trình duyệt), hãy dùng nút dưới đây:
            </p>
            <button
              onClick={handleResetData}
              className="w-full bg-white text-red-700 border border-red-300 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={14} /> Khôi phục Dữ liệu Ban đầu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
