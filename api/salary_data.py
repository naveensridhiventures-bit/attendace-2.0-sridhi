"""
POST /api/salary_data
Body: { pin, month, year }

PIN-protected (same PIN as the HR dashboard, stored in the "HR" tab cell B1).

Logic:
  1. Read the Employees tab -> name, role, monthly_salary for every active employee
  2. Read this month's Attendance tab -> count P / WO / WOP / A / NA per employee
  3. Read this month's Salary tab if it exists -> pick up the "Advance" column
     (HR can edit advances directly in the sheet; if a Salary tab doesn't
     exist yet, advance defaults to 0 and the tab gets created)
  4. Run calc_salary() per employee and write the computed row back into the
     Salary tab (so the sheet always shows the same numbers the app shows,
     and is the place to manually override things if ever needed)
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import (
    get_or_create_month_tab, get_employees_tab, get_hr_pin, rows_as_dicts,
)
from _lib.salary import calc_salary


def post(handler, body):
    pin = str(body.get("pin", "")).strip()
    if pin != get_hr_pin():
        return 401, {"error": "Wrong PIN"}

    month = body.get("month")
    year = body.get("year")

    employees_ws = get_employees_tab()
    employees = rows_as_dicts(employees_ws)

    attendance_ws = get_or_create_month_tab("Attendance", month, year)
    attendance = rows_as_dicts(attendance_ws)

    salary_ws = get_or_create_month_tab("Salary", month, year)
    salary_rows = rows_as_dicts(salary_ws)
    advance_by_name = {r.get("Name", "").strip(): r.get("Advance", 0) for r in salary_rows}

    # Tally attendance counts per employee for this month
    counts = {}
    for r in attendance:
        name = (r.get("Employee") or "").strip()
        status = (r.get("Status") or "").strip().upper()
        if not name:
            continue
        counts.setdefault(name, {"P": 0, "WO": 0, "WOP": 0, "A": 0, "NA": 0})
        if status in counts[name]:
            counts[name][status] += 1

    result = []
    sheet_output_rows = []
    for emp in employees:
        name = (emp.get("Name") or "").strip()
        if not name:
            continue
        if str(emp.get("Active", "TRUE")).strip().upper() in ("FALSE", "NO", "0"):
            continue

        role = emp.get("Role", "")
        monthly_salary = emp.get("Monthly Salary", 0)
        c = counts.get(name, {"P": 0, "WO": 0, "WOP": 0, "A": 0, "NA": 0})
        advance = advance_by_name.get(name, 0)

        calc = calc_salary(
            monthly_salary=monthly_salary,
            p_count=c["P"], wo_count=c["WO"], wop_count=c["WOP"],
            a_count=c["A"], na_count=c["NA"], advance=advance,
        )

        result.append({"name": name, "role": role, **calc})
        sheet_output_rows.append([
            name, role, calc["monthly_salary"], calc["p_count"], calc["wo_count"],
            calc["wop_count"], calc["a_count"], calc["na_count"], calc["advance"],
            calc["paid_days"], calc["per_day_salary"], calc["gross_salary"],
            calc["net_salary"], calc["warning"],
        ])

    # Write the computed numbers back into the Salary tab so the sheet
    # always mirrors what the app shows (HR can still hand-edit Advance
    # there; it'll be picked up next time this runs).
    if sheet_output_rows:
        salary_ws.resize(rows=max(len(sheet_output_rows) + 1, 2))
        salary_ws.update(f"A2:N{len(sheet_output_rows) + 1}", sheet_output_rows, value_input_option="USER_ENTERED")

    return 200, {"employees": result}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
