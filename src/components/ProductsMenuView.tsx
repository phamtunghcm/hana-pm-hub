
export default function ProductsMenuView() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Sản Phẩm & Dịch Vụ</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-teal-200 rounded p-4 bg-teal-50">
          <h3 className="font-bold text-teal-800">HANA First Touch (45 mins)</h3>
          <p className="text-gray-600 mt-2">Giá: 399,000 VND | Margin: 84%</p>
          <p className="text-sm mt-2">Tripwire product để thu hút khách hàng trải nghiệm dịch vụ chăm sóc thư giãn.</p>
        </div>
        <div className="border border-teal-200 rounded p-4 bg-teal-50">
          <h3 className="font-bold text-teal-800">HANA Signature Reset (60 mins)</h3>
          <p className="text-gray-600 mt-2">Giá: 500,000 VND | Margin: 83%</p>
          <p className="text-sm mt-2">Core product giúp phục hồi cảm giác dễ chịu.</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 mt-8">Care Passport Forms</h2>
      <ul className="list-disc pl-5 space-y-2 text-gray-700">
        <li><strong>FORM-01:</strong> Intake Form</li>
        <li><strong>FORM-02:</strong> Session Note</li>
        <li><strong>FORM-03:</strong> Body Map (Lưu ý: Chỉ "Ánh xạ" từ dữ liệu gốc)</li>
        <li><strong>FORM-04:</strong> Recovery Report</li>
        <li><strong>FORM-05:</strong> Aftercare Log</li>
        <li><strong>FORM-06:</strong> Claim-ready Pack</li>
      </ul>
    </div>
  );
}
