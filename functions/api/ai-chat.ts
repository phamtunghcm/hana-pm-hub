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

    // 1. Google Gemini 1.5 Flash Proxy
    if (model === 'gemini') {
      const apiKey = (body.apiKey || env.GEMINI_API_KEY || '').trim();
      if (!apiKey) {
        return new Response(JSON.stringify({ reply: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng bấm vào icon Bánh răng ở góc trên để dán API Key.' }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      const promptText = `${systemPrompt}\n\nUser Question:\n${userPrompt}`;
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

      if (!geminiResp.ok || geminiData.error) {
        const errorMsg = geminiData.error?.message || `Lỗi HTTP ${geminiResp.status}`;
        return new Response(JSON.stringify({ 
          reply: `⚠️ Lỗi từ Google Gemini: ${errorMsg}. Vui lòng kiểm tra lại mã API Key trong phần Cài đặt.` 
        }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const reason = geminiData.candidates?.[0]?.finishReason || 'Unknown';
        return new Response(JSON.stringify({ 
          reply: `Google Gemini không trả về câu trả lời (Lý do: ${reason}). Vui lòng thử lại.` 
        }), { 
          headers: { 'Content-Type': 'application/json' },
          status: 200 
        });
      }

      return new Response(JSON.stringify({ reply: text }), { 
        headers: { 'Content-Type': 'application/json' } 
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
