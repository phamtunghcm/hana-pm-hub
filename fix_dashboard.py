import re

with open("src/components/DashboardView.tsx", "r") as f:
    content = f.read()

# Add overdueList
content = re.sub(r'const doingList = useMemo\(\(\) => combinedTasks\.filter.*?\[combinedTasks\]\);',
                 'const doingList = useMemo(() => combinedTasks.filter(t => t.status === "Đang thực hiện" || t.status === "Đang soạn thảo"), [combinedTasks]);\n  const overdueList = useMemo(() => combinedTasks.filter(t => t.status !== "Hoàn thành" && t.daysLeft < 0), [combinedTasks]);',
                 content, flags=re.DOTALL)

# Fix overdue tooltip
overdue_tooltip = """
              {hoveredSection === "donut_overdue" && (
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
              )}
"""
content = re.sub(r'\{hoveredSection === "donut_overdue".*?\}\)\n\s*\}\)\}\n\s*</div>\n\s*\)\}', overdue_tooltip.strip(), content, flags=re.DOTALL)

with open("src/components/DashboardView.tsx", "w") as f:
    f.write(content)
