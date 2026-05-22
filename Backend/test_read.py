import openpyxl

wb = openpyxl.load_workbook("Customers.xlsx")
ws = wb.active

for i, row in enumerate(ws.iter_rows(values_only=True), start=1):
    print(row)
    if i == 5:  # print first 5 rows only
        break