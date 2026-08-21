const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// 1. Add filter states
content = content.replace(
  "const [isLoading, setIsLoading] = useState(true);",
  "const [isLoading, setIsLoading] = useState(true);\n  const [filterWorkstream, setFilterWorkstream] = useState('All');\n  const [filterStatus, setFilterStatus] = useState('All');\n  const [filterPriority, setFilterPriority] = useState('All');\n  const [filterSearch, setFilterSearch] = useState('');"
);

// 2. Add filteredTasks & CAPEX summary logic just before // --- DERIVED DATA ---
const logicStr = `
  const capexTasks = tasks.filter((t: any) => t.workstream === 'Mua sắm & Tài chính');
  const capexCostTotal = capexTasks.reduce((acc: number, t: any) => {
    if(!t.cost) return acc;
    const num = parseInt(String(t.cost).replace(/,/g, ''));
    return isNaN(num) ? acc : acc + num;
  }, 0);
  const capexCostStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(capexCostTotal);

  const filteredTasks = tasks.filter((t: any) => {
    if (filterWorkstream !== 'All' && t.workstream !== filterWorkstream) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    if (filterSearch && !t.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  // --- DERIVED DATA ---`;

content = content.replace("  // --- DERIVED DATA ---", logicStr);

// 3. Update Master Table UI (Table head with filters and map filteredTasks)
const tableRegex = /<table className="w-full text-left text-sm border-collapse">([\s\S]*?)<\/tbody>/;

const newTableStr = `<table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#FDFBF7] sticky top-0 z-10">
                <tr className="text-[#8D6E63] font-bold border-b border-[#E7E0D6] text-xs uppercase">
                  <th className="px-6 py-3 whitespace-nowrap">ID</th>
                  <th className="px-6 py-3 w-1/3 min-w-[300px]">
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm công việc..." 
                      className="w-full bg-white border border-[#E7E0D6] rounded px-2 py-1 text-slate-700 outline-none focus:border-[#8D6E63]"
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                    />
                  </th>
                  <th className="px-6 py-3">
                    <select value={filterWorkstream} onChange={e => setFilterWorkstream(e.target.value)} className="bg-transparent font-bold outline-none cursor-pointer">
                      <option value="All">Phân loại (Tất cả)</option>
                      {WORKSTREAMS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </th>
                  <th className="px-6 py-3">
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-transparent font-bold outline-none cursor-pointer">
                      <option value="All">Ưu tiên (Tất cả)</option>
                      <option value="Đặc biệt cao">Đặc biệt cao</option>
                      <option value="Cao">Cao</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Thấp">Thấp</option>
                    </select>
                  </th>
                  <th className="px-6 py-3 text-right">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent font-bold outline-none cursor-pointer">
                      <option value="All">Trạng thái (Tất cả)</option>
                      <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                      <option value="Đang thực hiện">Đang thực hiện</option>
                      <option value="Bị chậm">Bị chậm</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Có rủi ro">Có rủi ro</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D6] bg-white">
                {filteredTasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-[#FDFBF7] transition-colors group">
                    <td className="px-6 py-4 text-[#A1887F] font-mono text-xs">#{task.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#4E342E]">{task.title}</span>
                        <span className="text-xs text-[#8D6E63] mt-1">{task.subgroup || task.workstream}</span>
                        {task.cost && <span className="text-xs text-amber-600 font-bold mt-1">Dự toán: {task.cost}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={task.pic}
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          const idx = newTasks.findIndex((t: any) => t.id === task.id);
                          newTasks[idx].pic = e.target.value;
                          setTasks(newTasks);
                        }}
                        className="bg-transparent border border-transparent hover:border-[#E7E0D6] rounded px-2 py-1 text-sm text-[#6D4C41] outline-none focus:border-[#8D6E63] focus:ring-1 focus:ring-[#8D6E63]"
                      >
                        <option value={task.pic}>{task.pic}</option>
                        <option value="CEO">CEO</option>
                        <option value="Hành chính Nhân sự">Hành chính Nhân sự</option>
                        <option value="Kế toán">Kế toán</option>
                        <option value="Training Lead">Training Lead</option>
                        <option value="Pháp chế">Pháp chế</option>
                        <option value="Ops Manager">Ops Manager</option>
                        <option value="IT / Ops">IT / Ops</option>
                        <option value="Mua sắm">Mua sắm</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={\`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide
                        \${task.priority === 'Đặc biệt cao' ? 'text-rose-600 bg-rose-50' :
                          task.priority === 'Cao' ? 'text-amber-600 bg-amber-50' :
                          'text-[#8D6E63] bg-[#EFEBE0]'}\`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={task.status}
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          const idx = newTasks.findIndex((t: any) => t.id === task.id);
                          newTasks[idx].status = e.target.value;
                          setTasks(newTasks);
                        }}
                        className={\`px-2.5 py-1 rounded-full text-xs font-semibold outline-none cursor-pointer border border-transparent hover:border-slate-300 focus:ring-2 focus:ring-slate-200
                          \${task.status === 'Hoàn thành' ? 'bg-[#E5F333] text-slate-800' :
                            task.status === 'Bị chậm' ? 'bg-rose-500 text-white' :
                            task.status === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' :
                            'bg-[#EFEBE0] text-[#6D4C41]'}\`}
                      >
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Bị chậm">Bị chậm</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Có rủi ro">Có rủi ro</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>`;

content = content.replace(tableRegex, newTableStr);

// 4. Update Capex UI explicitly before the table
const masterHeaderRegex = /<h3 className="font-bold text-lg text-slate-800">Danh sách Công việc Tổng thể<\/h3>/;
const capexStr = `<h3 className="font-bold text-lg text-[#4E342E]">Danh sách Công việc Tổng thể (Giao diện như Excel)</h3>
          </div>
          
          <div className="bg-[#FFFBF2] p-4 border-b border-[#E7E0D6] flex gap-8 items-center">
            <div>
              <p className="text-xs font-bold text-[#8D6E63] uppercase">Tổng ngân sách dự toán (CAPEX)</p>
              <p className="text-2xl font-black text-amber-600">{capexCostStr}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#8D6E63] uppercase">Hạng mục mua sắm</p>
              <p className="text-2xl font-black text-[#5D4037]">{capexTasks.length} Mục</p>
            </div>
          </div>`;

content = content.replace(masterHeaderRegex, capexStr);

// Make the table container scrollable with height
content = content.replace('<div className="overflow-x-auto">', '<div className="overflow-x-auto max-h-[600px] overflow-y-auto">');

// Update standard card colors
content = content.replace(/bg-white/g, 'bg-white'); // keep cards white
content = content.replace(/border-slate-100/g, 'border-[#E7E0D6]');
content = content.replace(/border-slate-200/g, 'border-[#E7E0D6]');
content = content.replace(/text-slate-800/g, 'text-[#4E342E]');
content = content.replace(/text-slate-500/g, 'text-[#8D6E63]');
content = content.replace(/text-slate-700/g, 'text-[#5D4037]');
content = content.replace(/text-slate-600/g, 'text-[#6D4C41]');

fs.writeFileSync('src/components/DashboardView.tsx', content);
