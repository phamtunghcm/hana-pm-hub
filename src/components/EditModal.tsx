import React, { useState } from 'react';
import { X, Save, AlertTriangle, ExternalLink } from 'lucide-react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';

interface EditModalProps {
  item: any;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose }) => {
  const { updateItem } = useHana();
  const [formData, setFormData] = useState({
    title: item.title || '',
    status: item.status || 'Chưa bắt đầu',
    workstream: item.workstream || item.group || '',
    pic: item.pic || item.agency || item.department || '',
    dueDate: item.dueDate || item.timeEstimate || item.deadline || '',
    priority: item.priority || item.level || 'Trung bình',
    note: item.note || item.content || '',
    qty: item.qty || 1,
    unitPrice: item.unitPrice || 0,
    totalPrice: item.totalPrice || 0,
  });

  const [showConfirm, setShowConfirm] = useState(false);

    // Lấy link file gốc trực tiếp từ item nếu có, hoặc fallback theo phân hệ
  const fileDirectLink = item.fileLink || (
    item.type === 'doc' ? DRIVE_LINKS.docsFolder :
    item.type === 'legal' ? (item.title.includes('PCCC') ? DRIVE_LINKS.legalPcccFolder : DRIVE_LINKS.legalAnttFolder) :
    DRIVE_LINKS.tasks
  );

  const sheetDirectLink = item.sheetLink || (
    item.type === 'doc' ? DRIVE_LINKS.docsSheet :
    item.type === 'legal' ? DRIVE_LINKS.legalSheet :
    DRIVE_LINKS.tasks
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    const updates: any = {
      title: formData.title,
      status: formData.status,
      note: formData.note,
    };

    if (item.type === 'task') {
      updates.workstream = formData.workstream;
      updates.pic = formData.pic;
      updates.dueDate = formData.dueDate;
      updates.priority = formData.priority;
    } else if (item.type === 'legal') {
      updates.agency = formData.pic;
      updates.timeEstimate = formData.dueDate;
    } else if (item.type === 'doc') {
      updates.department = formData.pic;
      updates.deadline = formData.dueDate;
      updates.level = formData.priority;
      updates.content = formData.note;
    } else if (item.type === 'capex') {
      updates.qty = Number(formData.qty);
      updates.unitPrice = Number(formData.unitPrice);
      updates.totalPrice = Number(formData.unitPrice) * Number(formData.qty);
    }

    updateItem(item.type, item.id, updates);
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#3D2B1A]/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E8E6E1]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[#E8E6E1] bg-[#F5F0E6]">
          <div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {item.type === 'task' ? 'Công việc' : item.type === 'legal' ? 'Hồ sơ Pháp lý' : item.type === 'doc' ? 'Văn bản Nội bộ' : 'Mua sắm CAPEX'}
            </span>
            <h2 className="text-lg font-bold text-[#3D2B1A] mt-1">Chi tiết & Cập nhật</h2>
          </div>
          <button onClick={onClose} className="text-[#8D6E63] hover:text-[#3D2B1A]">
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Direct File, Sheets & Folder Links */}
          <div className="bg-[#FAF8F5] border border-amber-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#5D4037] flex items-center gap-1.5">
                <span>📄 Hồ sơ & File Gốc Trực Tiếp</span>
              </span>
              <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                Mở đúng file thật
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a 
                href={fileDirectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-[#3D2B1A] text-white px-3.5 py-2 rounded-lg hover:bg-[#2C1F13] shadow-xs transition-colors"
                title="Mở trực tiếp file Word / Google Docs của văn bản này"
              >
                <ExternalLink size={13} className="text-amber-300" /> Mở File Gốc ({item.type === 'doc' ? 'Google Docs' : 'Hồ sơ thật'})
              </a>
              <a 
                href={sheetDirectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white text-[#155724] px-3.5 py-2 rounded-lg border border-emerald-300 hover:bg-emerald-50 shadow-xs transition-colors"
                title="Mở bảng Google Sheets theo dõi quản lý"
              >
                <ExternalLink size={13} className="text-emerald-600" /> Bảng Quản Lý (Sheets)
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1">Tiêu đề / Tên hạng mục *</label>
            <input 
              type="text" 
              required 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1">Trạng thái</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500 font-medium bg-white"
            >
              <option value="Chưa bắt đầu">Chưa bắt đầu</option>
              <option value="Đang thực hiện">Đang thực hiện</option>
              <option value="Đang soạn thảo">Đang soạn thảo</option>
              <option value="Đã chuẩn bị">Đã chuẩn bị</option>
              <option value="Cần mua">Cần mua</option>
              <option value="Đã mua / Đã chi">Đã mua / Đã chi</option>
              <option value="Hoàn thành">Hoàn thành / Đã ban hành</option>
            </select>
          </div>

          {item.type === 'task' && (
            <div>
              <label className="block text-sm font-bold text-[#5D4037] mb-1">Nhóm / Giai đoạn</label>
              <input 
                type="text" 
                value={formData.workstream} 
                onChange={e => setFormData({ ...formData, workstream: e.target.value })}
                className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#5D4037] mb-1">
                {item.type === 'legal' ? 'Cơ quan thụ lý' : item.type === 'doc' ? 'Phòng ban' : 'Người phụ trách'}
              </label>
              <input 
                type="text" 
                value={formData.pic} 
                onChange={e => setFormData({ ...formData, pic: e.target.value })}
                className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#5D4037] mb-1">
                {item.type === 'legal' ? 'Thời gian' : item.type === 'doc' ? 'Hạn chót' : 'Hạn chót'}
              </label>
              <input 
                type="text" 
                value={formData.dueDate} 
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {item.type === 'capex' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#5D4037] mb-1">Số lượng</label>
                <input 
                  type="number" 
                  value={formData.qty} 
                  onChange={e => setFormData({ ...formData, qty: Number(e.target.value) })}
                  className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#5D4037] mb-1">Đơn giá (VNĐ)</label>
                <input 
                  type="number" 
                  value={formData.unitPrice} 
                  onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#5D4037] mb-1">Ghi chú / Nội dung chi tiết</label>
            <textarea 
              rows={3} 
              value={formData.note} 
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="w-full border border-[#E8E6E1] rounded-lg px-3 py-2 text-[#3D2B1A] outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E8E6E1]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-[#5D4037] font-medium hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-[#3D2B1A] text-white font-bold rounded-lg hover:bg-[#5D4037] flex items-center gap-2"
            >
              <Save size={16} /> Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Strict Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-[#E8E6E1] text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#3D2B1A]">Xác nhận cập nhật dữ liệu?</h3>
            <p className="text-sm text-[#5D4037]">
              Bạn có chắc chắn muốn áp dụng các thay đổi cho hạng mục <span className="font-bold text-[#3D2B1A]">"{formData.title}"</span> không?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmSave} 
                className="px-5 py-2 text-sm font-bold bg-[#3D2B1A] text-white rounded-lg hover:bg-[#5D4037] shadow-md"
              >
                Đồng ý Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditModal;
