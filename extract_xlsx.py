import pandas as pd

try:
    xls = pd.ExcelFile('capex.xlsx')
    print("Sheets found:", xls.sheet_names)
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet)
        print(f"\n--- Sheet: {sheet} ---")
        # Find 'máy lạnh' case-insensitive
        matches = df[df.apply(lambda row: row.astype(str).str.contains('máy lạnh|hoà|điều', case=False, na=False).any(), axis=1)]
        if not matches.empty:
            print("Found matches:")
            print(matches.to_string())
        else:
            print("No 'máy lạnh' found in this sheet.")
            
        # find 'ghế'
        ghế = df[df.apply(lambda row: row.astype(str).str.contains('ghế', case=False, na=False).any(), axis=1)]
        if not ghế.empty:
            print("Found 'ghế':")
            print(ghế.to_string())
            
except Exception as e:
    print("Error:", e)
