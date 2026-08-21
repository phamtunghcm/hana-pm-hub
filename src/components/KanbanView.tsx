
export default function KanbanView() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kanban Board</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {['Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành'].map(status => (
          <div key={status} className="bg-gray-100 p-4 rounded min-w-[300px]">
            <h3 className="font-bold text-gray-700 mb-3">{status}</h3>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-200 mb-2">
              <p className="font-medium text-sm">Task mẫu {status}</p>
              <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                <span>WS1 - Xây dựng</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Cao</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
