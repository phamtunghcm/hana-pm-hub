
export default function LegalRadarView() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Legal Radar & Compliance</h2>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <p className="text-yellow-700 font-medium">
          <strong>NGUYÊN TẮC QUAN TRỌNG:</strong> KHÔNG sử dụng các từ ngữ y khoa (trị liệu, thăm khám, chữa bệnh, bệnh nhân) trong bất kỳ tài liệu nào để tránh vi phạm NĐ 117/2020.
        </p>
      </div>
      <div className="bg-white shadow rounded p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Hạng mục</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Nguyên tắc giảm thiểu</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">Giấy phép hoạt động Massage/Spa</td>
              <td className="px-6 py-4 text-sm text-gray-500"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Đã hoàn thành</span></td>
              <td className="px-6 py-4 text-sm text-gray-500">Chỉ cung cấp dịch vụ chăm sóc, thư giãn sâu. Tuyệt đối không dùng chữ "trị liệu".</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
