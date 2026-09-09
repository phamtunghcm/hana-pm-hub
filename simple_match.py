import json
import csv

with open('old_capex.json', 'r') as f:
    old_data = json.load(f)

with open('new_capex.csv', 'r') as f:
    reader = csv.reader(f)
    lines = list(reader)

for i, row in enumerate(lines):
    if len(row) > 2 and row[1].strip() == "Khu vực":
        header_idx = i
        break

new_items = []
for i in range(header_idx + 1, len(lines)):
    row = lines[i]
    if len(row) < 12: continue
    khu_vuc = row[1].strip()
    ten_vat_dung = row[4].strip()
    if not ten_vat_dung: continue
    new_items.append(ten_vat_dung)

def tokenize(text):
    return set(text.lower().replace("(", " ").replace(")", " ").split())

print("--- NEW ITEMS THAT MIGHT MATCH OLD ITEMS ---")
for new_name in new_items:
    new_tokens = tokenize(new_name)
    best_match = None
    best_score = 0
    for old_item in old_data:
        old_name = old_item['title']
        old_tokens = tokenize(old_name)
        overlap = len(new_tokens.intersection(old_tokens))
        score = overlap / max(len(new_tokens), len(old_tokens))
        if score > best_score:
            best_score = score
            best_match = old_name
    if best_score > 0.3:
        print(f"NEW: {new_name}  ===  OLD: {best_match} (Score: {best_score:.2f})")
