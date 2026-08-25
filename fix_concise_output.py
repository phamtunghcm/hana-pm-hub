with open("src/components/AICopilotDrawer.tsx", "r") as f:
    code = f.read()

# Update system prompt to be clean, markdown-free or minimal markdown, concise, and include quick navigation links instruction
old_sys = """    const todayStr = new Date().toLocaleDateString('vi-VN');
    const systemPrompt = `Bạn là trợ lý AI của dự án HANA Wellness PM Hub. Hôm nay là ngày ${todayStr}.
Dữ liệu dự án:
- Công việc (${tasks.length + docs.length} việc): ${JSON.stringify(trimData(tasks).concat(trimData(docs)))}
- Pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- Mua sắm CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

Chỉ trả lời câu hỏi của người dùng bằng tiếng Việt, ngắn gọn, đi thẳng vào vấn đề. Tuyệt đối không viết nháp, không giải thích quá trình suy nghĩ.`;"""

new_sys = """    const todayStr = new Date().toLocaleDateString('vi-VN');
    const systemPrompt = `Bạn là trợ lý AI Copilot dự án HANA Wellness PM Hub. Hôm nay là ${todayStr}.
Dữ liệu:
- Công việc (${tasks.length + docs.length} việc): ${JSON.stringify(trimData(tasks).concat(trimData(docs)))}
- Pháp lý (${legal.length} mục): ${JSON.stringify(trimData(legal))}
- CAPEX (${capex.length} mục): ${JSON.stringify(capex.map(c => ({ title: c.title, qty: c.qty, price: c.totalPrice, status: c.status })))}

YÊU CẦU TRÌNH BÀY:
1. Trình bày cực kỳ ngắn gọn, mạch lạc, đi thẳng vào trọng tâm.
2. TUYỆT ĐỐI HẠN CHẾ các dấu in đậm ** hoặc markdown rườm rà (###, * **). Trình bày dạng danh sách gạch đầu dòng rõ ràng, dễ đọc trên điện thoại.
3. Luôn kèm theo gợi ý truy cập nhanh vào các mục liên quan (ví dụ: Xem chi tiết tại tab "Bảng Công việc" hoặc "Hồ sơ Pháp lý").`;"""

code = code.replace(old_sys, new_sys)

# Clean up any leftover double asterisks or markdown clutter in post-processing
old_clean_block = """              // Loại bỏ thẻ think nếu có
              text = text.replace(/<think>[\\s\\S]*?<\\/think>/gi, '').trim();"""

new_clean_block = """              // Loại bỏ thẻ think nếu có
              text = text.replace(/<think>[\\s\\S]*?<\\/think>/gi, '').trim();
              // Làm sạch các dấu markdown rườm rà như ###, **...**
              text = text.replace(/###\\s*/g, '').replace(/\\*\\*\\s*\\*\\*/g, '');"""

code = code.replace(old_clean_block, new_clean_block)

with open("src/components/AICopilotDrawer.tsx", "w") as f:
    f.write(code)

print("Updated prompt for concise output without markdown clutter!")
