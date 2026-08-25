import json

# Define the exact drive mappings for docs and legal
docs_drive_mapping = {
    1: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    2: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    3: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    4: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    5: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    6: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    7: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    8: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    9: {
        "fileLink": "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true"
    }
}

legal_drive_mapping = {
    1: {
        "fileLink": "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    2: {
        "fileLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    3: {
        "fileLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    4: {
        "fileLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true"
    },
    5: {
        "fileLink": "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
        "sheetRowLink": "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true"
    }
}

# Update docs9.json
with open("src/data/docs9.json", "r") as f:
    docs = json.load(f)

for d in docs:
    d_id = d.get("id")
    if d_id in docs_drive_mapping:
        d["fileLink"] = docs_drive_mapping[d_id]["fileLink"]
        d["sheetLink"] = docs_drive_mapping[d_id]["sheetRowLink"]

with open("src/data/docs9.json", "w") as f:
    json.dump(docs, f, indent=2, ensure_ascii=False)

# Update legal5.json
with open("src/data/legal5.json", "r") as f:
    legals = json.load(f)

for l in legals:
    l_id = l.get("id")
    if l_id in legal_drive_mapping:
        l["fileLink"] = legal_drive_mapping[l_id]["fileLink"]
        l["sheetLink"] = legal_drive_mapping[l_id]["sheetRowLink"]

with open("src/data/legal5.json", "w") as f:
    json.dump(legals, f, indent=2, ensure_ascii=False)

print("Updated docs9.json and legal5.json with direct file and sheets links!")
