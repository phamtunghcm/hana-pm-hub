import re
with open("src/components/DashboardView.tsx", "r") as f:
    content = f.read()

# Try to find the exact block
old_block = """              {hoveredSection === "donut_overdue" && (
                <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-2xl z-40 space-y-1 animate-in fade-in duration-150 border border-red-900/40">
                  <p className="font-bold border-b border-white/20 pb-1 text-red-300">Chi tiết — Cần xử lý gấp ({urgentTasks.length}):</p>
                  {urgentTasks.map(t => (
                    <p key={t.id} className="text-red-200 truncate">• {t.title} ({t.dueDate})</p>
                  ))}
                </div>
              )}"""

new_block = """              {hoveredSection === "donut_overdue" && (
                <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#3D2B1A] text-white text-xs p-3 rounded-xl shadow-2xl z-40 space-y-1 animate-in fade-in duration-150 border border-red-900/40">
                  <p className="font-bold border-b border-white/20 pb-1 text-red-300">Chi tiết — Quá hạn ({taskStats.overdue}):</p>
                  {overdueList.length > 0 ? (
                    overdueList.map(t => (
                      <p key={t.id} className="text-red-200 truncate">• {t.title} ({t.dueDate})</p>
                    ))
                  ) : (
                    <p className="text-gray-300">• Không có việc quá hạn</p>
                  )}
                </div>
              )}"""

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("Block not found!")

with open("src/components/DashboardView.tsx", "w") as f:
    f.write(content)
