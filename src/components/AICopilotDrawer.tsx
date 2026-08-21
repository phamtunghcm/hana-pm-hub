import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

export default function AICopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Xin chào, tôi là trợ lý AI cho dự án HANA Wellness PM Hub. Tôi có thể giúp gì?' }
  ]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'gemini' | 'claude'>('gemini');

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, model })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: 'assistant', content: data.reply || 'Có lỗi xảy ra' }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: 'Lỗi kết nối' }]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700"
      >
        <MessageSquare />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl flex flex-col z-50 border-l">
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-800">AI Copilot</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-2 border-b flex gap-2 text-sm bg-gray-100">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={model === 'gemini'} onChange={() => setModel('gemini')} />
              Gemini 1.5
            </label>
            <label className="flex items-center gap-1 cursor-pointer ml-4">
              <input type="radio" checked={model === 'claude'} onChange={() => setModel('claude')} />
              Claude 3.5
            </label>
          </div>

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
              placeholder="Nhập tin nhắn..." 
            />
            <button onClick={handleSend} className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}
