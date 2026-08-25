with open("src/components/AdminView.tsx", "r") as f:
    admin_code = f.read()

# Update the test report modal in AdminView.tsx to show the new executive CEO layout preview
old_modal_content = """            <div className="bg-[#FAF8F5] p-4 rounded-xl text-xs font-mono whitespace-pre-wrap text-[#3D2B1A] leading-relaxed border border-gray-200">
              📌 BÁO CÁO TIẾN ĐỘ DỰ ÁN HANA WELLNESS PM HUB<br/>
              ⏰ Thời gian: 08:00 AM Hàng Ngày<br/>
              🔗 Truy cập PM Hub: {window.location.origin}/<br/><br/>
              📊 1. TỔNG QUAN TIẾN ĐỘ:<br/>
              • Tỷ lệ hoàn thành: {pct}% ({completed}/{totalTasks} công việc)<br/>
              • Ngày mục tiêu khai trương: {formData.targetDate}<br/>
              • Ngân sách CAPEX: {totalCapexAmount.toLocaleString()} VNĐ (gồm 110tr thi công + 100tr đặt cọc + mua sắm)<br/><br/>
              🚨 2. CÔNG VIỆC CẦN XỬ LÝ GẤP ({urgentTasks.length} việc):<br/>
              {urgentTasks.slice(0, 4).map(u => (
                <div key={u.id}>• {u.title} | Phụ trách: {u.pic} | Hạn: {u.dueDate}</div>
              ))}<br/>
              👉 Bấm vào liên kết để xem chi tiết & cập nhật: {window.location.origin}/
            </div>"""

new_modal_content = """            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs text-xs">
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
            </div>"""

admin_code = admin_code.replace(old_modal_content, new_modal_content)

with open("src/components/AdminView.tsx", "w") as f:
    f.write(admin_code)

print("AdminView.tsx preview modal updated successfully!")
