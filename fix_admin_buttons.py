with open("src/components/AdminView.tsx", "r") as f:
    code = f.read()

# Replace button text and add an explicit info note
old_btn = """                <button
                  type="button"
                  onClick={() => setTestReportModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5F0E6] hover:bg-amber-100 text-[#3D2B1A] border border-[#E7E0D6] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#8D6E63]" />
                  <span>Gửi Thử Báo Cáo Mẫu Ngay</span>
                </button>"""

new_btn = """                <button
                  type="button"
                  onClick={() => setTestReportModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5F0E6] hover:bg-amber-100 text-[#3D2B1A] border border-[#E7E0D6] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#8D6E63]" />
                  <span>Xem Trước Mẫu Báo Cáo CEO (Preview)</span>
                </button>"""

code = code.replace(old_btn, new_btn)

# Also in modal header
code = code.replace("<span>Xem trước Báo cáo Mẫu 8:00 AM</span>", "<span>Mẫu Báo Cáo Email Gửi Cho CEO (Preview)</span>")

with open("src/components/AdminView.tsx", "w") as f:
    f.write(code)

print("AdminView updated with clear Preview button label!")
