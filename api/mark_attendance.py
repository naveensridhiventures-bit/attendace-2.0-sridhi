"""
POST /api/mark_attendance
Body: { employee_name, status, latitude, longitude }

Writes one row to this month's "{Month}-{Year} Attendance" tab (auto-created
if it doesn't exist yet). If the employee already has a row for today, it
updates that row instead of creating a duplicate.
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, india_now, find_row_index

VALID_STATUSES = {"P", "A", "WO", "WOP", "NA"}


def post(handler, body):
    employee_name = (body.get("employee_name") or "").strip()
    status = (body.get("status") or "").strip().upper()
    latitude = body.get("latitude", "")
    longitude = body.get("longitude", "")

    if not employee_name:
        return 400, {"error": "employee_name is required"}
    if status not in VALID_STATUSES:
        return 400, {"error": f"status must be one of {sorted(VALID_STATUSES)}"}

    now = india_now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%I:%M %p")

    ws = get_or_create_month_tab("Attendance")
    rows = ws.get_all_values()
    header = rows[0] if rows else []

    # Look for an existing row: same employee AND same date
    existing_row_num = None
    for i, row in enumerate(rows[1:], start=2):
        row_dict = dict(zip(header, row))
        if row_dict.get("Employee", "").strip() == employee_name and row_dict.get("Date", "") == date_str:
            existing_row_num = i
            break

    new_row = [date_str, employee_name, status, time_str, str(latitude), str(longitude)]
    if existing_row_num:
        ws.update(f"A{existing_row_num}:F{existing_row_num}", [new_row], value_input_option="USER_ENTERED")
    else:
        ws.append_row(new_row, value_input_option="USER_ENTERED")

    return 200, {"ok": True, "employee_name": employee_name, "status": status, "date": date_str, "time": time_str}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
