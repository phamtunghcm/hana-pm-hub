import React, { useMemo, useState } from 'react';
import { useHana, DRIVE_LINKS } from '../store/HanaContext';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import EditModal from './EditModal';

const CapexView: React.FC = () => {
  const { capex } = useHana();
  const [viewMode, setViewMode] = useState<'group' | 'zone'>('group');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Chi phí Cố định Ban đầu': true,
    'Nội thất & Vật tư cơ bản': true,
    'Thiết bị chuyên môn': true,
    'Sảnh Lễ tân': true,
    'Phòng Trị liệu': true,
  });
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const { groupedCapex, totalGrandAmount, totalItems } = useMemo(() => {
    let grandTotal = 0;
    let itemCount = 0;
    const groups: Record<string, { items: typeof capex, total: number }> = {};

    capex.forEach(item => {
      let g = viewMode === 'zone' ? (item.zone || 'Chưa phân khu vực') : (item.group || 'Khác');
      if (!groups[g]) {
        groups[g] = { items: [], total: 0 };
      }
      groups[g].items.push(item);
      
      const val = typeof item.totalPrice === 'number' ? item.totalPrice : parseFloat(String(item.totalPrice).replace(/,/g, '')) || 0;
      groups[g].total += val;
      grandTotal += val;
      if (!item.id.toString().startsWith("capex_0_")) {
          itemCount++;
      }
    });

    return { groupedCapex: groups, totalGrandAmount: grandTotal, totalItems: itemCount };
  }, [capex, viewMode]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 space-y-6 font-sans pb-32">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8E6E1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-amber-800" size={24} />
            <h1 className="text-2xl font-bold text-[#3D2B1A]">Ngân sách CAPEX Ban đầu</h1>
          </div>
          <p className="text-[#8D6E63] mt-1">Đã bao gồm: Đặt cọc thuê nhà (100tr), Thi công thô (110tr) & {totalItems} danh mục mua sắm</p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Tổng ngân sách dự kiến</p>
            <p className="text-2xl font-black text-amber-700">
              {totalGrandAmount.toLocaleString()} đ
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('group')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${viewMode === 'group' ? 'bg-[#3D2B1A] text-white' : 'bg-white text-[#3D2B1A] border border-[#E8E6E1] hover:bg-[#F5F0E6]'}`}
        >
          Nhóm theo Chủng loại
        </button>
        <button
          onClick={() => setViewMode('zone')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${viewMode === 'zone' ? 'bg-[#3D2B1A] text-white' : 'bg-white text-[#3D2B1A] border border-[#E8E6E1] hover:bg-[#F5F0E6]'}`}
        >
          Nhóm theo Khu vực
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedCapex).map(([group, data]) => (
          <div key={group} className="bg-white rounded-2xl shadow-sm border border-[#E8E6E1] overflow-hidden">
            <button 
              onClick={() => toggleGroup(group)}
              className="w-full flex justify-between items-center p-4 bg-[#F5F0E6] hover:bg-[#EFEBE0] transition-colors border-b border-[#E8E6E1]"
            >
              <div className="flex items-center gap-3">
                <svg 
                  className={"w-5 h-5 text-amber-900 transform transition-transform " + (expandedGroups[group] ? "rotate-90" : "")} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h2 className="text-base font-bold text-[#3D2B1A]">{group}</h2>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {data.items.length} hạng mục
                </span>
              </div>
              <div className="font-black text-[#3D2B1A]">
                {data.total.toLocaleString()} đ
              </div>
            </button>
            
            {expandedGroups[group] && (
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 text-[#8D6E63] text-xs uppercase tracking-wider border-b border-gray-200 font-bold">
                      <th className="py-3 px-5 w-5/12">Tên hạng mục</th>
                      <th className="py-3 px-5 text-right">Số lượng</th>
                      <th className="py-3 px-5 text-right">Đơn giá</th>
                      <th className="py-3 px-5 text-right">Thành tiền</th>
                      <th className="py-3 px-5 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#3D2B1A]">
                    {data.items.map(item => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        className="border-b border-gray-100 last:border-0 hover:bg-[#FDFBF7] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-5 font-bold">
                          <div>{item.title}</div>
                          {item.note && <div className="text-xs text-[#8D6E63] font-normal mt-0.5">{item.note}</div>}
                        </td>
                        <td className="py-3.5 px-5 text-right text-sm font-medium">{item.qty}</td>
                        <td className="py-3.5 px-5 text-right text-sm font-medium">{typeof item.unitPrice === 'number' ? item.unitPrice.toLocaleString() : item.unitPrice}</td>
                        <td className="py-3.5 px-5 text-right font-bold text-amber-900">{typeof item.totalPrice === 'number' ? item.totalPrice.toLocaleString() : item.totalPrice}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={"px-2.5 py-1 text-xs rounded-full font-bold inline-block " + (["Đã hoàn thành", "Đã mua", "Đã chi / Đang thi công"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" : ["Cần mua"].includes(item.status) ? "bg-[#F8D7DA] text-[#721C24]" : "bg-[#E2E3E5] text-[#383D41]")}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedItem && (
        <EditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default CapexView;
