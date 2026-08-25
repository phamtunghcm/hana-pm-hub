with open("src/components/AdminView.tsx", "r") as f:
    code = f.read()

# Add isSending state and handleInstantSend function
state_anchor = "const [testReportModal, setTestReportModal] = useState(false);"
new_state = """const [testReportModal, setTestReportModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleInstantSend = async () => {
    const key = (formData.resendApiKey || "").trim();
    if (!key) {
      alert("Vui lòng nhập mã Resend API Key vào ô cấu hình bên dưới và bấm Lưu trước khi gửi!");
      return;
    }

    setIsSending(true);
    try {
      const todayStr = new Date().toLocaleDateString('vi-VN');
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          recipient: formData.reportEmail || "phamtunghcm@gmail.com",
          subject: `📌 [HANA PM Hub] Báo cáo Điều hành Dự án - ${todayStr}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
              <div style="background: #2c1a0e; color: #fff; padding: 20px;">
                <div style="font-size: 11px; font-weight: bold; color: #fde047; text-transform: uppercase;">Executive Briefing</div>
                <h1 style="margin: 4px 0 0 0; font-size: 18px;">HANA WELLNESS PM HUB</h1>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #cbd5e1;">Bản tin thử nghiệm gửi trực tiếp từ Admin</p>
              </div>
              <div style="padding: 20px; color: #1e293b; font-size: 13px;">
                <p><strong>📊 Chỉ số Tổng quan:</strong></p>
                <ul>
                  <li>Tổng công việc: <strong>${totalTasks}</strong> (37 việc chính + 9 văn bản)</li>
                  <li>Đã hoàn thành: <strong>${completed}</strong> tasks (${pct}%)</li>
                  <li>Ngân sách CAPEX: <strong>${(totalCapexAmount / 1000000).toLocaleString(undefined, {maximumFractionDigits: 1})} triệu VNĐ</strong></li>
                </ul>
                <p style="color: #dc2626;"><strong>🚨 Việc cần đôn đốc gấp (${urgentTasks.length} việc):</strong></p>
                <ul>
                  ${urgentTasks.slice(0, 4).map(u => `<li><strong>${u.title}</strong> - Hạn: ${u.dueDate} (${u.status})</li>`).join('')}
                </ul>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${window.location.origin}" style="background: #2c1a0e; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 12px; display: inline-block;">
                    Truy cập HANA PM Hub →
                  </a>
                </div>
              </div>
            </div>
          `,
          text: `Báo cáo HANA PM Hub: ${completed}/${totalTasks} hoàn thành (${pct}%). Truy cập: ${window.location.origin}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`🚀 Đã gửi thành công email báo cáo đến: ${formData.reportEmail || "phamtunghcm@gmail.com"}! Hãy kiểm tra Hộp thư đến (hoặc Spam).`);
      } else {
        alert(`⚠️ Lỗi khi gửi: ${data.error || "Không thể gửi email"}`);
      }
    } catch (e: any) {
      alert(`⚠️ Lỗi kết nối: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };"""

code = code.replace(state_anchor, new_state)

# Replace the buttons row in Email Card to include both Send Now and Preview
old_buttons_row = """              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTestReportModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5F0E6] hover:bg-amber-100 text-[#3D2B1A] border border-[#E7E0D6] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#8D6E63]" />
                  <span>Xem Trước Mẫu Báo Cáo CEO (Preview)</span>
                </button>

                <button
                  onClick={handleSaveSettings}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#3D2B1A] hover:bg-[#2C1F13] text-[#FDFBF7] font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Báo Cáo 8:00 AM</span>
                </button>
              </div>"""

new_buttons_row = """              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-gray-100">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleInstantSend}
                    disabled={isSending}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? "Đang gửi..." : "⚡ Gửi Email Thử Nghiệm Ngay"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestReportModal(true)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-[#F5F0E6] hover:bg-amber-100 text-[#3D2B1A] border border-[#E7E0D6] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Xem Mẫu (Preview)</span>
                  </button>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#3D2B1A] hover:bg-[#2C1F13] text-[#FDFBF7] font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình Báo Cáo 8:00 AM</span>
                </button>
              </div>"""

code = code.replace(old_buttons_row, new_buttons_row)

with open("src/components/AdminView.tsx", "w") as f:
    f.write(code)

print("AdminView updated with Instant Send Email feature!")
