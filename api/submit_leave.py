"""
POST /api/submit_leave
Body: { employee_name, leave_type, reason, from_date, to_date }

Logs a new pending leave request to this month's "{Month}-{Year} Leave" tab
(auto-created if needed). The tab used is based on the from_date's month,
so a leave starting in a future/past month files into that month's tab.
"""

import datetime
from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import get_or_create_month_tab, india_now, next_sno


def post(handler, body):
    employee_name = (body.get("employee_name") or "").strip()
    leave_type = (body.get("leave_type") or "").strip()
    reason = (body.get("reason") or "").strip()
    from_date = (body.get("from_date") or "").strip()
    to_date = (body.get("to_date") or "").strip()

    if not all([employee_name, leave_type, reason, from_date, to_date]):
        return 400, {"error": "employee_name, leave_type, reason, from_date and to_date are all required"}

    try:
        f = datetime.date.fromisoformat(from_date)
        t = datetime.date.fromisoformat(to_date)
    except ValueError:
        return 400, {"error": "from_date/to_date must be YYYY-MM-DD"}

    if t < f:
        return 400, {"error": "to_date must be on or after from_date"}

    days = (t - f).days + 1

    ws = get_or_create_month_tab("Leave", f.month, f.year)
    sno = next_sno(ws)
    submitted_at = india_now().strftime("%Y-%m-%d %I:%M %p")

    ws.append_row(
        [sno, employee_name, leave_type, from_date, to_date, days, reason, "Pending", "", submitted_at],
        value_input_option="USER_ENTERED",
    )

    return 200, {"ok": True, "id": sno, "days": days}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
