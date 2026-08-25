with open("src/components/LegalView.tsx", "r") as f:
    code = f.read()

# Add group badge and filter or grouped layout if needed
old_card_header = """              <div className="flex justify-between items-start mb-4">
                <span className={"px-2.5 py-1 text-xs rounded-full font-bold " + (["Đã hoàn thành", "Hoàn thành"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" : ["Đã chuẩn bị"].includes(item.status) ? "bg-[#FFF3CD] text-[#856404]" : "bg-[#E2E3E5] text-[#383D41]")}>
                  {item.status}
                </span>
                <span className="text-xs text-amber-800 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Sửa →
                </span>
              </div>"""

new_card_header = """              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] rounded-md font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                    {(item as any).group || "Pháp lý"}
                  </span>
                  <span className={"px-2.5 py-1 text-xs rounded-full font-bold " + (["Đã hoàn thành", "Hoàn thành"].includes(item.status) ? "bg-[#D4EDDA] text-[#155724]" : ["Đã chuẩn bị"].includes(item.status) ? "bg-[#FFF3CD] text-[#856404]" : "bg-[#E2E3E5] text-[#383D41]")}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs text-amber-800 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Mở / Sửa →
                </span>
              </div>"""

code = code.replace(old_card_header, new_card_header)

with open("src/components/LegalView.tsx", "w") as f:
    f.write(code)

print("LegalView.tsx updated with group tags!")
