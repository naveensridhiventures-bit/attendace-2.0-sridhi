"""
POST /api/mark_attendance_bulk
Body: { entries: [{ employee_name, status, latitude?, longitude? }, ...] }

Same upsert-by-(employee,date) behavior as mark_attendance, but applied to
a whole batch in one sheet round-trip (faster than calling mark_attendance
once per employee).
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, india_now

VALID_STATUSES = {"P", "A", "WO", "WOP", "NA"}


def post(handler, body):
    entries = body.get("entries") or []
    if not isinstance(entries, list) or not entries:
        return 400, {"error": "entries must be a non-empty list"}

    now = india_now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%I:%M %p")

    ws = get_or_create_month_tab("Attendance")
    rows = ws.get_all_values()
    header = rows[0] if rows else []

    existing = {}
    for i, row in enumerate(rows[1:], start=2):
        row_dict = dict(zip(header, row))
        if row_dict.get("Date", "") == date_str:
            existing[row_dict.get("Employee", "").strip()] = i

    updates = []
    appends = []
    results = []
    for e in entries:
        name = (e.get("employee_name") or "").strip()
        status = (e.get("status") or "").strip().upper()
        if not name or status not in VALID_STATUSES:
            results.append({"employee_name": name, "ok": False, "error": "invalid name/status"})
            continue
        lat, lng = str(e.get("latitude", "")), str(e.get("longitude", ""))
        new_row = [date_str, name, status, time_str, lat, lng]
        if name in existing:
            updates.append((existing[name], new_row))
        else:
            appends.append(new_row)
        results.append({"employee_name": name, "ok": True, "status": status})

    for row_num, new_row in updates:
        ws.update(f"A{row_num}:F{row_num}", [new_row], value_input_option="USER_ENTERED")
    if appends:
        ws.append_rows(appends, value_input_option="USER_ENTERED")

    return 200, {"ok": True, "date": date_str, "results": results}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
