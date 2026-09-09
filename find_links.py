import os, re

for root, dirs, files in os.walk("src"):
    for f in files:
        if f.endswith(".ts") or f.endswith(".tsx"):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                links = re.findall(r'https://(?:docs|drive)\.google\.com/[^\s"\'`\)]+', content)
                if links:
                    print(f"=== {p} ({len(links)} links) ===")
                    for l in set(links):
                        print("  ", l)
