import re

# Update functions/api/ai-chat.ts to fallback automatically across gemini model versions
with open("functions/api/ai-chat.ts", "r") as f:
    fn_content = f.read()

gemini_models_code = """    // 1. Google Gemini Proxy (Tự động thử các model: gemini-1.5-flash, gemini-1.5-flash-latest, gemini-2.0-flash, gemini-1.5-pro)
    if (model === 'gemini') {
      const apiKey = (body.apiKey || env.GEMINI_API_KEY || '').trim();
      if (!apiKey) {
        return new Response(JSON.stringify({ reply: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng bấm vào icon Bánh răng ở góc trên để dán API Key.' }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      const promptText = `${systemPrompt}\\n\\nUser Question:\\n${userPrompt}`;
      const candidateModels = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-pro'
      ];

      let lastError = '';
      for (const modelName of candidateModels) {
        try {
          const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
              })
            }
          );

          const geminiData = await geminiResp.json() as any;

          if (geminiResp.ok && !geminiData.error) {
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return new Response(JSON.stringify({ reply: text }), { 
                headers: { 'Content-Type': 'application/json' } 
              });
            }
          } else {
            lastError = geminiData.error?.message || `HTTP ${geminiResp.status}`;
            // If error is invalid API key, no need to retry other models
            if (lastError.includes('API key not valid') || lastError.includes('PERMISSION_DENIED')) {
              break;
            }
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }

      return new Response(JSON.stringify({ 
        reply: `⚠️ Lỗi từ Google Gemini: ${lastError}. Vui lòng kiểm tra lại mã API Key trong phần Cài đặt.` 
      }), { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      });
    }"""

fn_content = re.sub(r'// 1\. Google Gemini 1\.5 Flash Proxy.*?// 2\. Anthropic Claude', gemini_models_code + '\n\n    // 2. Anthropic Claude', fn_content, flags=re.DOTALL)

with open("functions/api/ai-chat.ts", "w") as f:
    f.write(fn_content)

# Also update AICopilotDrawer.tsx direct client fallback with multiple model retries + Explicit Save button with Visual Feedback
with open("src/components/AICopilotDrawer.tsx", "r") as f:
    drawer_content = f.read()

# Update settings UI to have an explicit "Lưu Key" button and auto-save feedback
old_settings_box = """          {/* Settings Panel for API Key */}
          {showSettings && (
            <div className="p-4 bg-teal-50/70 border-b border-teal-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex justify-between items-center">
                <label className="font-bold text-teal-900 block">
                  Cấu hình {model === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'} API Key:
                </label>
                <button onClick={() => setShowSettings(false)} className="text-teal-700 font-bold hover:underline">Đóng</button>
              </div>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => saveApiKey(e.target.value)} 
                placeholder="AIzaSy... (Dán mã API Key vào đây)"
                className="w-full bg-white border border-teal-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-teal-500"
              />
              <div className="text-[11px] text-teal-800 leading-normal">
                {model === 'gemini' ? (
                  <>👉 Lấy mã miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-teal-900">Google AI Studio (Click vào đây)</a>. Key lưu tại máy của bạn.</>
                ) : (
                  <>👉 Lấy mã tại <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="underline font-bold text-teal-900">Anthropic Console (Click vào đây)</a>.</>
                )}
              </div>
            </div>
          )}"""

new_settings_box = """          {/* Settings Panel for API Key */}
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
                  <>✨ <strong>Tự động lưu:</strong> Khi bạn dán Key vào ô trên, hệ thống đã tự lưu vào máy. Bạn có thể bấm <strong>"Lưu Key"</strong> để yên tâm. Lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-teal-900">Google AI Studio</a>.</>
                ) : (
                  <>✨ Lấy mã tại <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="underline font-bold text-teal-900">Anthropic Console</a>.</>
                )}
              </div>
            </div>
          )}"""

drawer_content = drawer_content.replace(old_settings_box, new_settings_box)

with open("src/components/AICopilotDrawer.tsx", "w") as f:
    f.write(drawer_content)

print("Updated both files successfully!")
