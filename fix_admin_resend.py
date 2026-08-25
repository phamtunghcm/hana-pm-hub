with open("src/store/HanaContext.tsx", "r") as f:
    context_code = f.read()

# Add resendApiKey to ProjectSettings
context_code = context_code.replace("reportEmail?: string;\n  zaloWebhook?: string;",
                                    "reportEmail?: string;\n  zaloWebhook?: string;\n  resendApiKey?: string;")

context_code = context_code.replace('reportEmail: "phamtunghcm@gmail.com",\n    zaloWebhook: ""',
                                    'reportEmail: "phamtunghcm@gmail.com",\n    zaloWebhook: "",\n    resendApiKey: ""')

with open("src/store/HanaContext.tsx", "w") as f:
    f.write(context_code)

with open("src/components/AdminView.tsx", "r") as f:
    admin_code = f.read()

# Add resendApiKey to AdminView state
admin_code = admin_code.replace('zaloWebhook: settings.zaloWebhook || ""',
                                'zaloWebhook: settings.zaloWebhook || "",\n    resendApiKey: settings.resendApiKey || ""')

# Add Resend API Key input field to AdminView UI
old_input_block = """              <div>
                <label className="block text-xs font-bold text-[#5D4037] mb-1.5 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Zalo Webhook URL / Nhóm Zalo (Không bắt buộc):</span>
                </label>
                <input
                  type="text"
                  value={formData.zaloWebhook}
                  onChange={(e) => setFormData({ ...formData, zaloWebhook: e.target.value })}
                  placeholder="https://chat.zalo.me/webhook/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                />
              </div>"""

new_input_block = """              <div>
                <label className="block text-xs font-bold text-[#5D4037] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Resend API Key (Để gửi thư qua Resend.com):</span>
                </label>
                <input
                  type="password"
                  value={formData.resendApiKey}
                  onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                  placeholder="re_123456789... (Dán API Key từ tài khoản Resend của bạn)"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  * Lấy mã tại <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline font-bold text-[#8D6E63]">Resend.com/api-keys</a>. Sau khi dán và bấm "Lưu Cấu Hình", hệ thống sẽ lưu an toàn để gửi mail báo cáo.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5D4037] mb-1.5 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Zalo Webhook URL / Nhóm Zalo (Không bắt buộc):</span>
                </label>
                <input
                  type="text"
                  value={formData.zaloWebhook}
                  onChange={(e) => setFormData({ ...formData, zaloWebhook: e.target.value })}
                  placeholder="https://chat.zalo.me/webhook/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-[#3D2B1A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
                />
              </div>"""

admin_code = admin_code.replace(old_input_block, new_input_block)

with open("src/components/AdminView.tsx", "w") as f:
    f.write(admin_code)

print("AdminView and HanaContext updated with Resend API Key field!")
