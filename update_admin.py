import re

with open("src/components/AdminView.tsx", "r") as f:
    content = f.read()

# Replace stats calculation in AdminView
old_stats = """  const completed = tasks.filter(t => t.status === "Hoàn thành").length;
  const totalTasks = tasks.length;
  const pct = Math.round((completed / totalTasks) * 100) || 0;
  const urgentTasks = tasks.filter(t => t.status !== "Hoàn thành" && t.daysLeft < 15);"""

new_stats = """  // Merge docs with tasks for unified system stats (37 main tasks + 9 internal docs = 46 total)
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
  }, 0);"""

content = content.replace(old_stats, new_stats)

# Replace the System Stats block in AdminView
old_sys_stats = """            <div className="space-y-3 text-sm text-[#5D4037]">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Tổng số Công việc:</span>
                <strong className="text-[#3D2B1A]">{tasks.length} tasks</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Hồ sơ Pháp lý:</span>
                <strong className="text-[#3D2B1A]">{legal.length} mục (gồm PCCC >100m2)</strong>
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
                  Cơ sở >100m2 (Thẩm duyệt)
                </span>
              </div>
            </div>"""

new_sys_stats = """            <div className="space-y-3 text-sm text-[#5D4037]">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Tổng số Công việc (Đã gộp):</span>
                <strong className="text-[#3D2B1A]">{totalTasks} tasks ({tasks.length} việc chính + {docs.length} văn bản)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Hồ sơ Pháp lý:</span>
                <strong className="text-[#3D2B1A]">{legal.length} mục (gồm PCCC >100m2)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Văn bản Nội bộ:</span>
                <strong className="text-[#3D2B1A]">{docs.length} tài liệu quy chuẩn</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Danh mục CAPEX:</span>
                <strong className="text-[#3D2B1A]">{capex.length} hạng mục ({(totalCapexAmount / 1000000).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})}tr)</strong>
              </div>
              <div className="flex justify-between py-1 pt-2">
                <span>Quy định PCCC:</span>
                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Cơ sở >100m2 (Thẩm duyệt PCCC)
                </span>
              </div>
            </div>"""

content = content.replace(old_sys_stats, new_sys_stats)

# Replace hardcoded test report text in modal
content = content.replace("• Ngân sách CAPEX: 513,740,000 VNĐ (gồm 110tr thi công + 100tr đặt cọc + mua sắm)",
                          "• Ngân sách CAPEX: {totalCapexAmount.toLocaleString()} VNĐ (gồm 110tr thi công + 100tr đặt cọc + mua sắm)")

# Replace hardcoded URLs with window.location.origin
content = content.replace("https://hanawellness-project.com/", "{window.location.origin}/")

with open("src/components/AdminView.tsx", "w") as f:
    f.write(content)
print("AdminView updated!")
