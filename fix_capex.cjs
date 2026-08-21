const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
content = content.replace(
  '<h3 className="font-bold text-[#4E342E] text-sm uppercase tracking-wider">Danh sách Công việc Tổng thể</h3>',
  `<h3 className="font-bold text-[#4E342E] text-sm uppercase tracking-wider">Danh sách Công việc Tổng thể</h3>
          </div>
          <div className="bg-[#FFFBF2] p-4 border-b border-[#E7E0D6] flex gap-8 items-center">
            <div>
              <p className="text-xs font-bold text-[#8D6E63] uppercase">Tổng ngân sách dự toán (CAPEX)</p>
              <p className="text-2xl font-black text-amber-600">{capexCostStr}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#8D6E63] uppercase">Hạng mục mua sắm</p>
              <p className="text-2xl font-black text-[#5D4037]">{capexTasks.length} Mục</p>
            </div>`
);
fs.writeFileSync('src/components/DashboardView.tsx', content);
