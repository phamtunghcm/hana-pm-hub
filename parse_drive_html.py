import re
from bs4 import BeautifulSoup

with open("/Users/tungpv/.gemini/antigravity/brain/a9dc520f-834e-43c3-8dd1-fcb8f27c8075/.system_generated/steps/1597/content.md", "r") as f:
    html = f.read()

# Search for patterns of files, titles, ids, or links in the raw html
matches = re.findall(r'(\[[^\]]*"(https://docs\.google\.com/[^"]+|https://drive\.google\.com/[^"]+)"[^\]]*\])', html)
print(f"Found {len(matches)} matches")
for m in matches[:10]:
    print(m)

# Find all file IDs or titles like 'Điều lệ', 'Quy chế', 'doc', etc.
doc_matches = re.findall(r'["\']([a-zA-Z0-9_-]{25,})["\']', html)
print(f"Potential IDs count: {len(doc_matches)}")
print("Sample IDs:", list(set(doc_matches))[:15])
