import re

with open("/Users/tungpv/.gemini/antigravity/brain/a9dc520f-834e-43c3-8dd1-fcb8f27c8075/.system_generated/steps/1597/content.md", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Look for patterns like [ "1...", "01 Điều lệ...", ... ] or similar
matches = re.findall(r'\["(1[a-zA-Z0-9_-]{25,})",\[.*?\]', text)
print(f"Matched ID patterns: {len(matches)}")

# Let's find all occurrences of "01 Điều lệ" and surrounding 300 chars
for fname in ["01 Điều lệ", "02 SỔ", "03 NỘI", "05 QUY", "06 QUY", "07 QUY", "08 QUY", "09 SƠ"]:
    idx = text.find(fname)
    if idx != -1:
        print(f"\n=== Context for {fname} ===")
        print(text[max(0, idx-150): min(len(text), idx+250)])

