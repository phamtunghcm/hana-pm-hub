with open("src/components/AICopilotDrawer.tsx", "r") as f:
    code = f.read()

# Update the parsing logic in callGeminiDirect to strictly clean any markdown thinking or planning bullets
clean_logic = """          if (resp.ok && !data.error) {
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
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
            }
          }"""

old_block = """          if (resp.ok && !data.error) {
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              // Loại bỏ bất kỳ thinking/scratchpad nào nếu model xuất ra
              text = text.replace(/<think>[\\s\\S]*?<\\/think>/gi, '').trim();
              return { success: true, text };
            }
          }"""

code = code.replace(old_block, clean_logic)

# Also update the system prompt to use a very simple and natural directive
old_sys = """    const systemPrompt = `Bạn là trợ lý AI Copilot của dự án HANA Wellness PM Hub. Dưới đây là dữ liệu công việc hiện tại của toàn bộ dự án:
- Tổng số công việc (${tasks.length + docs.length} việc bao gồm 37 việc chính và 9 văn bản nội bộ):
  + Công việc chính: ${JSON.stringify(trimData(tasks))}
  + Văn bản nội bộ: ${JSON.stringify(trimData(docs))}
- Hồ sơ pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

YÊU CẦU CỐT LÕI:
1. Chỉ trả lời trực tiếp câu trả lời cho người dùng bằng tiếng Việt, súc tích, lịch sự và chuyên nghiệp.
2. TUYỆT ĐỐI KHÔNG lặp lại các chỉ dẫn, prompt hệ thống, suy nghĩ phân tích (chain-of-thought) hay roleplay vào khung chat.
3. Luôn tuân thủ chuẩn từ vựng HANA Wellness: dùng "chăm sóc", "wellness", "thư giãn sâu", "reset"; tuyệt đối tránh "bệnh nhân", "thăm khám", "trị liệu y tế".
4. Khi được hỏi về việc gấp: ưu tiên tra cứu các việc Quá hạn hoặc Đang làm có hạn gần nhất.`;"""

new_sys = """    const systemPrompt = `Bạn là trợ lý AI Copilot thông minh của dự án HANA Wellness PM Hub.
Dữ liệu dự án gồm:
- Công việc (${tasks.length + docs.length} việc): ${JSON.stringify(trimData(tasks).concat(trimData(docs)))}
- Pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

Nguyên tắc:
- Trả lời tự nhiên, thân thiện bằng tiếng Việt.
- Dùng từ ngữ wellness ("chăm sóc", "thư giãn sâu", "reset"), không dùng từ ngữ bệnh viện ("bệnh nhân", "thăm khám").
- Chỉ đưa ra câu trả lời trực tiếp cuối cùng, không kèm bất kỳ ghi chú phân tích đề bài nào.`;"""

code = code.replace(old_sys, new_sys)

with open("src/components/AICopilotDrawer.tsx", "w") as f:
    f.write(code)

print("Cleaned AI response output logic successfully!")
