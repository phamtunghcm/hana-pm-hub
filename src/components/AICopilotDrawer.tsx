import { useState } from 'react';
import { MessageSquare, X, Settings, Send, Loader2, RefreshCw } from 'lucide-react';
import { useHana } from '../store/HanaContext';

export default function AICopilotDrawer() {
  const { tasks, docs, capex, legal } = useHana();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Xin chào, tôi là trợ lý AI Copilot của dự án HANA Wellness PM Hub. Tôi có thể giúp gì cho bạn về tiến độ, pháp lý hay danh mục mua sắm?' }
  ]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'gemini' | 'claude'>('gemini');
  const [apiKey, setApiKey] = useState(localStorage.getItem('hana_ai_key') || '');

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('hana_ai_key', trimmed);
  };

  const callGeminiDirect = async (cleanKey: string, systemInstructionText: string, userQueryText: string) => {
    let candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b', 'gemini-pro'];
    
    try {
      const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
      if (listResp.ok) {
        const listData = await listResp.json() as any;
        if (listData.models && Array.isArray(listData.models)) {
          const supported = listData.models
            .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
          if (supported.length > 0) {
            candidateModels = supported;
          }
        }
      }
    } catch (e) {
      // ignore
    }

    let lastError = '';

    for (const mName of candidateModels) {
      for (const apiVer of ['v1beta', 'v1']) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${mName}:generateContent?key=${cleanKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: systemInstructionText }]
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userQueryText }]
                  }
                ],
                generationConfig: { 
                  temperature: 0.3, 
                  maxOutputTokens: 2048 
                }
              })
            }
          );

          const data = await resp.json() as any;

          if (resp.ok && !data.error) {
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              // Loại bỏ bất kỳ thinking/scratchpad nào nếu model xuất ra
              text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
              return { success: true, text };
            }
          } else if (data.error) {
            lastError = data.error.message || `Lỗi HTTP ${resp.status}`;
            if (lastError.includes('API key not valid') || lastError.includes('PERMISSION_DENIED')) {
              return { success: false, error: `Mã API Key không hợp lệ: ${lastError}` };
            }
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }
    }

    return { success: false, error: lastError || 'Không thể kết nối đến các model của Google Gemini' };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userQuery = input.trim();
    const newMsgs = [...messages, { role: 'user', content: userQuery }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);
    
    // Rút gọn dữ liệu gửi kèm để tối ưu tốc độ và không vượt giới hạn token
    const trimData = (arr: any[]) => arr.map(a => ({ 
      title: a.title, 
      status: a.status, 
      pic: a.pic || a.department || a.agency, 
      due: a.dueDate || a.deadline || a.timeEstimate 
    }));
    
    const systemPrompt = `Bạn là trợ lý AI Copilot của dự án HANA Wellness PM Hub. Dưới đây là dữ liệu công việc hiện tại của toàn bộ dự án:
- Tổng số công việc (${tasks.length + docs.length} việc bao gồm 37 việc chính và 9 văn bản nội bộ):
  + Công việc chính: ${JSON.stringify(trimData(tasks))}
  + Văn bản nội bộ: ${JSON.stringify(trimData(docs))}
- Hồ sơ pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

YÊU CẦU CỐT LÕI:
1. Chỉ trả lời trực tiếp câu trả lời cho người dùng bằng tiếng Việt, súc tích, lịch sự và chuyên nghiệp.
2. TUYỆT ĐỐI KHÔNG lặp lại các chỉ dẫn, prompt hệ thống, suy nghĩ phân tích (chain-of-thought) hay roleplay vào khung chat.
3. Luôn tuân thủ chuẩn từ vựng HANA Wellness: dùng "chăm sóc", "wellness", "thư giãn sâu", "reset"; tuyệt đối tránh "bệnh nhân", "thăm khám", "trị liệu y tế".
4. Khi được hỏi về việc gấp: ưu tiên tra cứu các việc Quá hạn hoặc Đang làm có hạn gần nhất.`;

    const cleanKey = (apiKey || localStorage.getItem('hana_ai_key') || '').trim();

    if (!cleanKey) {
      setShowSettings(true);
      setMessages([...newMsgs, { 
        role: 'assistant', 
        content: '⚠️ Bạn chưa nhập mã API Key. Vui lòng bấm vào icon Bánh răng ⚙️ ở góc trên khung chat, dán mã API Key của bạn và bấm "Lưu Key".' 
      }]);
      setIsLoading(false);
      return;
    }


    try {
      if (model === 'gemini') {
        const result = await callGeminiDirect(cleanKey, systemPrompt, userQuery);
        if (result.success && result.text) {
          setMessages([...newMsgs, { role: 'assistant', content: result.text }]);
        } else {
          setShowSettings(true);
          setMessages([...newMsgs, { 
            role: 'assistant', 
            content: `⚠️ Lỗi từ Google Gemini: ${result.error}. Vui lòng kiểm tra lại mã API Key trong phần Cài đặt.` 
          }]);
        }
      } else {
        // Claude Proxy
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: [{ role: 'system', content: systemPrompt }, ...newMsgs], 
            model, 
            apiKey: cleanKey 
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            setMessages([...newMsgs, { role: 'assistant', content: data.reply }]);
          }
        } else {
          setMessages([...newMsgs, { role: 'assistant', content: 'Lỗi kết nối đến máy chủ Claude' }]);
        }
      }
    } catch (e: any) {
      setMessages([...newMsgs, { role: 'assistant', content: `⚠️ Lỗi kết nối: ${e.message || 'Không thể gửi tin nhắn'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Xin chào, tôi là trợ lý AI Copilot của dự án HANA Wellness PM Hub. Tôi có thể giúp gì cho bạn?' }
    ]);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-700 hover:bg-teal-800 text-white p-3.5 rounded-full shadow-2xl z-50 flex items-center justify-center transition-transform hover:scale-105"
        title="Mở trợ lý AI Copilot"
      >
        <MessageSquare size={22} />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col z-50 border-l border-gray-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="font-bold text-[#3D2B1A] text-sm flex items-center gap-1.5">
                  AI Copilot HANA
                  <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    className={`p-1 rounded hover:bg-gray-200 transition ${showSettings ? 'text-teal-700 bg-teal-100' : 'text-gray-400'}`} 
                    title="Cấu hình API Key"
                  >
                    <Settings size={15} />
                  </button>
                  <button 
                    onClick={handleClearChat}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition" 
                    title="Xoá lịch sử chat"
                  >
                    <RefreshCw size={14} />
                  </button>
                </h3>
                <p className="text-[10px] text-gray-500">Trợ lý phân tích tiến độ dự án</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Model Switcher */}
          <div className="px-4 py-2 border-b border-gray-100 flex gap-4 text-xs bg-gray-50 items-center">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input 
                type="radio" 
                name="ai_model"
                checked={model === 'gemini'} 
                onChange={() => setModel('gemini')} 
                className="text-teal-600 focus:ring-teal-500"
              />
              Google Gemini (Tự động chọn model tối ưu)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input 
                type="radio" 
                name="ai_model"
                checked={model === 'claude'} 
                onChange={() => setModel('claude')} 
                className="text-teal-600 focus:ring-teal-500"
              />
              Claude 3.5
            </label>
          </div>

          {/* Settings Panel for API Key */}
          {showSettings && (
            <div className="p-4 bg-teal-50/90 border-b border-teal-200 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex justify-between items-center">
                <label className="font-bold text-teal-950 block">
                  🔑 Cấu hình {model === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'} API Key:
                </label>
                <button onClick={() => setShowSettings(false)} className="text-teal-700 font-bold hover:underline">✕ Đóng</button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={e => {
                    const val = e.target.value;
                    setApiKey(val);
                    localStorage.setItem('hana_ai_key', val.trim());
                  }} 
                  placeholder="AIzaSy... (Dán mã API Key vào đây)"
                  className="flex-1 bg-white border border-teal-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                />
                <button 
                  onClick={() => {
                    saveApiKey(apiKey);
                    alert("Đã lưu API Key thành công trên trình duyệt của bạn!");
                    setShowSettings(false);
                  }}
                  className="px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Lưu Key
                </button>
              </div>
              <div className="text-[11px] text-teal-900 leading-normal bg-white/70 p-2 rounded border border-teal-200">
                {model === 'gemini' ? (
                  <>✨ <strong>Lấy Key miễn phí:</strong> Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-teal-900">Google AI Studio (Bấm vào đây)</a> để tạo key mới trong 5 giây.</>
                ) : (
                  <>✨ Lấy mã tại <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="underline font-bold text-teal-900">Anthropic Console</a>.</>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-teal-700 text-white self-end rounded-br-xs shadow-xs' 
                    : 'bg-[#F5F0E6] text-[#3D2B1A] self-start rounded-bl-xs border border-[#E7E0D6] shadow-xs whitespace-pre-wrap'
                }`}
              >
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-2xl self-start text-gray-500 text-xs animate-pulse">
                <Loader2 size={14} className="animate-spin text-teal-700" />
                <span>AI đang phân tích dữ liệu dự án...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-gray-100 bg-[#FAF8F5] flex gap-2 items-center">
            <input 
              className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-[#3D2B1A] outline-none focus:ring-2 focus:ring-teal-600 transition disabled:bg-gray-100" 
              value={input} 
              disabled={isLoading}
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập câu hỏi (VD: Việc nào đang bị trễ hạn?)..." 
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-3.5 py-2.5 rounded-xl font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
              title="Gửi câu hỏi"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
