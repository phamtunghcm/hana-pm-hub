import React, { useState } from 'react';
import { X, Settings, Calendar, Type } from 'lucide-react';
import { useHana } from '../store/HanaContext';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useHana();
  const [formData, setFormData] = useState({
    brandName: settings.brandName,
    subTitle: settings.subTitle,
    logoText: settings.logoText,
    targetDate: settings.targetDate,
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const confirmSave = () => {
    updateSettings(formData);
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#3D2B1A]/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-[#E8E6E1] bg-[#F5F0E6]">
          <div className="flex items-center gap-2 text-[#3D2B1A] font-bold text-lg">
            <Settings size={20} className="text-[#8D6E63]" />
            <span>Cấu hình Dự án & Logo</span>
          </div>
          <button onClick={onClose} className="text-[#8D6E63] hover:text-[#3D2B1A]">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1 flex items-center gap-1.5">
              <Type size={16} /> Ký tự Logo
            </label>
            <input
              type="text"
              maxLength={3}
              value={formData.logoText}
              onChange={e => setFormData({ ...formData, logoText: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 uppercase font-black tracking-wider outline-none focus:border-amber-500"
              placeholder="H"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1">Tên thương hiệu</label>
            <input
              type="text"
              value={formData.brandName}
              onChange={e => setFormData({ ...formData, brandName: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1">Tên phụ dự án</label>
            <input
              type="text"
              value={formData.subTitle}
              onChange={e => setFormData({ ...formData, subTitle: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1 flex items-center gap-1.5">
              <Calendar size={16} /> Ngày mục tiêu Khai trương
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#5D4037] font-medium hover:bg-gray-50 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#3D2B1A] text-white font-medium rounded-lg hover:bg-[#5D4037]"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-[#E8E6E1]">
            <h3 className="text-lg font-bold text-[#3D2B1A]">Xác nhận cập nhật?</h3>
            <p className="text-sm text-[#5D4037]">
              Bạn có chắc chắn muốn cập nhật cấu hình dự án (Tên thương hiệu, Logo, Ngày khai trương) không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-1.5 text-sm font-bold bg-[#3D2B1A] text-white rounded-lg hover:bg-[#5D4037]"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;
