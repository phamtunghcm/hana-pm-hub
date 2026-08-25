import re

with open("/Users/tungpv/.gemini/antigravity/brain/a9dc520f-834e-43c3-8dd1-fcb8f27c8075/.system_generated/steps/1597/content.md", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Look for filenames like .docx, .doc, .xlsx, .pdf, or Vietnamese strings
print("Searching for docx/xlsx/pdf...")
items = re.findall(r'([A-Za-z0-9_\-\s\u00C0-\u1EF9]+\.(?:docx|doc|xlsx|xls|pdf|gdoc|gsheet))', text, re.IGNORECASE)
print("Files found:", set(items))

# Search for any JSON blobs or arrays containing folder items
chunks = re.findall(r'(\[[^\]]{10,200}\])', text)
for c in chunks:
    if "drive" in c.lower() or "http" in c.lower() or "docx" in c.lower() or "điều lệ" in c.lower():
        print("Chunk:", c)

