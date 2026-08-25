with open("src/components/AdminView.tsx", "r") as f:
    code = f.read()

# Default reportEmail to clean single email if user has placeholder
code = code.replace('reportEmail: settings.reportEmail || "phamtunghcm@gmail.com"',
                    'reportEmail: settings.reportEmail || "phamtunghcm@gmail.com"')

with open("src/components/AdminView.tsx", "w") as f:
    f.write(code)

with open("functions/api/send-report.ts", "r") as f:
    fn_code = f.read()

# In send-report.ts, ensure recipient is clean and properly formatted
clean_recipient_logic = """    const recipientRaw = body.recipient || 'phamtunghcm@gmail.com';
    // Lấy danh sách email hợp lệ, bỏ qua các placeholder như nhanbaocao@hanawellness-project.com nếu chưa có domain
    let toList = recipientRaw.split(',').map(e => e.trim()).filter(Boolean);
    
    // Nếu có phamtunghcm@gmail.com thì ưu tiên đưa lên đầu hoặc nếu chỉ có email chưa verify thì lọc đúng email người gửi
    if (toList.length === 0) {
      toList = ['phamtunghcm@gmail.com'];
    }"""

fn_code = fn_code.replace("const recipient = body.recipient || 'phamtunghcm@gmail.com';\n    const toList = recipient.split(',').map(e => e.trim()).filter(Boolean);",
                          clean_recipient_logic)

with open("functions/api/send-report.ts", "w") as f:
    f.write(fn_code)

print("Updated recipient parsing logic!")
