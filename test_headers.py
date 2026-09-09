import pandas as pd
xls = pd.ExcelFile('capex.xlsx')
for sheet in xls.sheet_names:
    df = pd.read_excel(xls, sheet_name=sheet)
    print(f"--- {sheet} ---")
    print(df.head(10).to_string())
