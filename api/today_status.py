"""
GET /api/today_status

Returns everyone who has been marked today, from this month's Attendance
tab, in the shape AttendancePage.jsx expects: { employees: [{ name, status, time }] }
"""

from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, india_now, rows_as_dicts


def get(handler, body):
    now = india_now()
    date_str = now.strftime("%Y-%m-%d")

    ws = get_or_create_month_tab("Attendance")
    records = rows_as_dicts(ws)

    employees = []
    for r in records:
        if r.get("Date") == date_str:
            employees.append({
                "name": r.get("Employee", ""),
                "status": r.get("Status", ""),
                "time": r.get("Time", ""),
            })

    return 200, {"employees": employees}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        json_handler(self, get)

    def do_OPTIONS(self):
        options_response(self)
