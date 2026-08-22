import { useState } from 'react';
import { MessageSquare, X, Settings } from 'lucide-react';
import { useHana } from '../store/HanaContext';

export default function AICopilotDrawer() {
  const { tasks, docs, capex, legal } = useHana();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Xin chào, tôi là trợ lý AI cho dự án HANA Wellness PM Hub. Tôi có thể giúp gì?' }
  ]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'gemini' | 'claude'>('gemini');
  const [apiKey, setApiKey] = useState(localStorage.getItem('hana_ai_key') || '');

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('hana_ai_key', key);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    
    // Chỉ lấy id, title, status, pic, dueDate để tránh bị quá dài
    const trimData = (arr: any[]) => arr.map(a => ({ title: a.title, status: a.status, pic: a.pic || a.department || a.agency, due: a.dueDate || a.deadline || a.timeEstimate }));
    
    const systemPrompt = `Bạn là trợ lý AI Copilot của dự án HANA Wellness PM Hub. Dưới đây là dữ liệu công việc hiện tại (đã rút gọn):
- Công việc chính: ${JSON.stringify(trimData(tasks))}
- Văn bản nội bộ: ${JSON.stringify(trimData(docs))}
- Pháp lý: ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX: ${JSON.stringify(capex.map(c => ({title: c.title, qty: c.qty, price: c.totalPrice, status: c.status})))}

Hãy trả lời các câu hỏi của người dùng một cách ngắn gọn, thông minh và trực tiếp bằng tiếng Việt, dựa vào đúng dữ liệu trên. Gợi ý công việc nên dựa trên những việc Chưa bắt đầu, Đang làm, hoặc bị Quá hạn (nếu có).`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...newMsgs.filter(m => m.role !== 'system')
    ];
    
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, model, apiKey })
      });
      const data = await res.json();
      
      if (data.reply && (data.reply.includes('Chưa cấu hình') || data.reply.includes('API_KEY'))) {
         setShowSettings(true);
      }
      
      setMessages([...newMsgs, { role: 'assistant', content: data.reply || 'Có lỗi xảy ra' }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Lỗi kết nối API' }]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 z-50"
      >
        <MessageSquare />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl flex flex-col z-50 border-l">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
               AI Copilot
               <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-teal-600" title="Cấu hình API Key">
                 <Settings size={16} />
               </button>
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-2 border-b flex gap-2 text-sm bg-gray-100 items-center">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={model === 'gemini'} onChange={() => setModel('gemini')} />
              Gemini 1.5
            </label>
            <label className="flex items-center gap-1 cursor-pointer ml-4">
              <input type="radio" checked={model === 'claude'} onChange={() => setModel('claude')} />
              Claude 3.5
            </label>
          </div>

          {showSettings && (
             <div className="p-4 bg-teal-50 border-b text-xs">
                <label className="font-bold text-teal-800 block mb-1">Cấu hình API Key (Lưu tại trình duyệt):</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={e => saveApiKey(e.target.value)} 
                  placeholder="Dán API Key vào đây..."
                  className="w-full border border-teal-200 rounded px-2 py-1.5 outline-none focus:border-teal-500 mb-2"
                />
                <p className="text-teal-600">Lấy key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>. Chìa khoá sẽ được lưu an toàn tại máy của bạn.</p>
             </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded max-w-[85%] ${m.role === 'user' ? 'bg-teal-100 self-end text-teal-900' : 'bg-gray-100 self-start text-gray-800'}`}>
                {m.content}
              </div>
            ))}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input 
              className="flex-1 border rounded px-3 py-2 outline-none focus:border-teal-500" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi AI (VD: Việc nào đang trễ hạn?)..." 
            />
            <button onClick={handleSend} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}
