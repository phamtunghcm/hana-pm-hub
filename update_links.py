with open("src/store/HanaContext.tsx", "r") as f:
    code = f.read()

old_links = """export const DRIVE_LINKS = {
  tasks: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394",
  legal: "https://docs.google.com/spreadsheets/d/1IGiSUoDnTDN_IFtqGDm_e5PWxMfPPN42/edit?usp=sharing",
  docs: "https://docs.google.com/spreadsheets/d/1aUNfIF5RdsDqawlxR42ycqUK1CPh5L-v1J11V6i3n78/edit?pli=1#gid=220737849",
  capex: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394"
};"""

new_links = """export const DRIVE_LINKS = {
  tasks: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394",
  // Bảng quản lý chung ANTT, PCCC
  legalSheet: "https://docs.google.com/spreadsheets/d/1lUWL9RtJeCllRgMQDUpSfPVQHmdrd38i/edit?usp=sharing&ouid=112807505253419172495&rtpof=true&sd=true",
  // Folder hồ sơ ANTT
  legalAnttFolder: "https://drive.google.com/drive/folders/1v-OwDDMRek50o6RVcz9QISUtc4wMKghm?usp=drive_link",
  // Folder hồ sơ PCCC (>100m2)
  legalPcccFolder: "https://drive.google.com/drive/folders/1RNDnyFSPis2NGIpEtSOsHvq5IZrwY4dV?usp=drive_link",
  // Bảng theo dõi văn bản nội bộ
  docsSheet: "https://docs.google.com/spreadsheets/d/1Qq3a6LjbvcF3SrVmodCRGGBNQ2vFyMlQ/edit?usp=drive_link&ouid=112807505253419172495&rtpof=true&sd=true",
  // Folder của nhóm văn bản nội bộ
  docsFolder: "https://drive.google.com/drive/folders/1prdsSerfEfqjU0fzfa-__eRphpJhoS6p?usp=drive_link",
  // Bảng tính mua sắm & CAPEX
  capex: "https://docs.google.com/spreadsheets/d/1TxIBBRPTftXJP4oqmyDXidr-8mDFoybQZFpo6NBJsm8/edit?pli=1#gid=139259394"
};"""

code = code.replace(old_links, new_links)

with open("src/store/HanaContext.tsx", "w") as f:
    f.write(code)

print("HanaContext.tsx links updated!")
