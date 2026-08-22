interface Env {
  GEMINI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      messages: { role: string; content: string }[];
      model: 'gemini' | 'claude';
      apiKey?: string;
    };

    const { messages, model } = body;
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const userPrompt = messages[messages.length - 1]?.content || '';

        // 1. Google Gemini Proxy (Tự động thử các model: gemini-1.5-flash, gemini-1.5-flash-latest, gemini-2.0-flash, gemini-1.5-pro)
    if (model === 'gemini') {
      const apiKey = (body.apiKey || env.GEMINI_API_KEY || '').trim();
      if (!apiKey) {
        return new Response(JSON.stringify({ reply: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng bấm vào icon Bánh răng ở góc trên để dán API Key.' }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      const promptText = `${systemPrompt}

User Question:
${userPrompt}`;
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
    }

    // 2. Anthropic Claude 3.5 Sonnet Proxy
    if (model === 'claude') {
      const apiKey = (body.apiKey || env.ANTHROPIC_API_KEY || '').trim();
      if (!apiKey) {
        return new Response(JSON.stringify({ reply: 'Chưa cấu hình ANTHROPIC_API_KEY. Vui lòng bấm vào icon Bánh răng để dán API Key.' }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      const claudeMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 2048,
          system: systemPrompt,
          messages: claudeMessages
        })
      });

      const claudeData = await claudeResp.json() as any;

      if (!claudeResp.ok || claudeData.error) {
        const errorMsg = claudeData.error?.message || `Lỗi HTTP ${claudeResp.status}`;
        return new Response(JSON.stringify({ 
          reply: `⚠️ Lỗi từ Anthropic Claude: ${errorMsg}. Vui lòng kiểm tra lại API Key.` 
        }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      const text = claudeData.content?.[0]?.text || 'Không có phản hồi từ Claude.';
      return new Response(JSON.stringify({ reply: text }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: 'Model không hợp lệ' }), { status: 400 });
  } catch (error: any) {
    return new Response(JSON.stringify({ reply: `⚠️ Lỗi hệ thống máy chủ: ${error.message}` }), { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    });
  }
}
