with open("src/components/AICopilotDrawer.tsx", "r") as f:
    code = f.read()

# Replace body payload in callGeminiDirect with proper camelCase systemInstruction + thinkingConfig + clean parser
old_fetch_body = """              body: JSON.stringify({
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
              })"""

new_fetch_body = """              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemInstructionText }]
                },
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: userQueryText }]
                  }
                ],
                generationConfig: { 
                  temperature: 0.2, 
                  maxOutputTokens: 2048,
                  thinkingConfig: {
                    thinkingBudget: 0
                  }
                }
              })"""

code = code.replace(old_fetch_body, new_fetch_body)

# Robust output sanitization to guarantee NO thinking bullets escape
old_text_clean = """            if (text) {
              // 1. Loại bỏ các khối thẻ <think>...</think>
              text = text.replace(/<think>[\\s\\S]*?<\\/think>/gi, '').trim();
              
              // 2. Nếu model xuất ra dạng planning (bắt đầu bằng * Role: hoặc * User says: hoặc * Goal:), trích xuất câu trả lời thực sự
              if (text.includes('* Role:') || text.includes('* User says:') || text.includes('* Goal:') || text.includes('* Greeting:')) {
                // Tìm đoạn text nằm trong dấu ngoặc kép hoặc sau các mục greeting
                const quoteMatch = text.match(/"([^"]{10,})"/);
                if (quoteMatch && quoteMatch[1]) {
                  text = quoteMatch[1].trim();
                } else {
                  // Lấy các dòng không bắt đầu bằng dấu * hoặc gạch đầu dòng phân tích
                  const lines = text.split('\\n');
                  const cleanLines = lines.filter((l: string) => {
                    const trimmed = l.trim();
                    return !trimmed.startsWith('*') && !trimmed.startsWith('- Role') && !trimmed.startsWith('Role:') && !trimmed.startsWith('Goal:');
                  });
                  if (cleanLines.join('\\n').trim()) {
                    text = cleanLines.join('\\n').trim();
                  }
                }
              }

              return { success: true, text };
            }"""

new_text_clean = """            if (text) {
              // Loại bỏ thẻ think nếu có
              text = text.replace(/<think>[\\s\\S]*?<\\/think>/gi, '').trim();
              
              // Nếu xuất hiện dạng phân tích câu hỏi (Chain-of-thought bullet points)
              if (text.includes('* User Question:') || text.includes('* User says:') || text.includes('* Role:') || text.includes('* Current Date:') || text.includes('Wait, if I don')) {
                // Trích xuất phần câu trả lời cuối cùng (thường sau dấu phân cách hoặc đoạn văn xuôi tiếng Việt thuần)
                const paragraphs = text.split(/\\n\\s*\\n/);
                const nonBulletParas = paragraphs.filter((p: string) => {
                  const t = p.trim();
                  return !t.startsWith('*') && !t.startsWith('-') && !t.includes('User Question:') && !t.includes('Current Date:') && !t.includes('Wait, ');
                });
                
                if (nonBulletParas.length > 0) {
                  text = nonBulletParas.join('\\n\\n').trim();
                } else {
                  // Lọc từng dòng
                  const lines = text.split('\\n');
                  const cleanLines = lines.filter((l: string) => {
                    const trimmed = l.trim();
                    return !trimmed.startsWith('*') && !trimmed.startsWith('-') && !trimmed.includes('Wait, ') && !trimmed.includes('User Question:');
                  });
                  text = cleanLines.join('\\n').trim() || text;
                }
              }

              return { success: true, text };
            }"""

code = code.replace(old_text_clean, new_text_clean)

# Also update system prompt to include today's exact date so it doesn't think about "Current Date"
old_sys_prompt = """    const systemPrompt = `Bạn là trợ lý AI Copilot thông minh của dự án HANA Wellness PM Hub.
Dữ liệu dự án gồm:
- Công việc (${tasks.length + docs.length} việc): ${JSON.stringify(trimData(tasks).concat(trimData(docs)))}
- Pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

Nguyên tắc:
- Trả lời tự nhiên, thân thiện bằng tiếng Việt.
- Dùng từ ngữ wellness ("chăm sóc", "thư giãn sâu", "reset"), không dùng từ ngữ bệnh viện ("bệnh nhân", "thăm khám").
- Chỉ đưa ra câu trả lời trực tiếp cuối cùng, không kèm bất kỳ ghi chú phân tích đề bài nào.`;"""

new_sys_prompt = """    const todayStr = new Date().toLocaleDateString('vi-VN');
    const systemPrompt = `Bạn là trợ lý AI của dự án HANA Wellness PM Hub. Hôm nay là ngày ${todayStr}.
Dữ liệu dự án:
- Công việc (${tasks.length + docs.length} việc): ${JSON.stringify(trimData(tasks).concat(trimData(docs)))}
- Pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

Chỉ trả lời câu hỏi của người dùng bằng tiếng Việt, ngắn gọn, đi thẳng vào vấn đề. Tuyệt đối không viết nháp, không giải thích quá trình suy nghĩ.`;"""

code = code.replace(old_sys_prompt, new_sys_prompt)

with open("src/components/AICopilotDrawer.tsx", "w") as f:
    f.write(code)

print("Updated AICopilotDrawer.tsx with systemInstruction camelCase and today's date!")
