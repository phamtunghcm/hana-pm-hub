import re

for folder_name, step in [("PCCC", 1607), ("ANTT", 1609)]:
    path = f"/Users/tungpv/.gemini/antigravity/brain/a9dc520f-834e-43c3-8dd1-fcb8f27c8075/.system_generated/steps/{step}/content.md"
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    print(f"\n=================== {folder_name} FILES ===================")
    # Search for aria-label="... ssk='5:auSv138:ID-0-16'
    matches = re.findall(r'aria-label="([^"]+)"[^>]*ssk=\'5:auSv138:([a-zA-Z0-9_-]+)-0-16\'', text)
    for name, fid in matches:
        print(f"File: {name} | ID: {fid}")
